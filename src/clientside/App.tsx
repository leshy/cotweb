import './App.css';
import { reduce, keys, head, get, times } from 'lodash'
import { Map, View } from 'ol';
import { OSM } from 'ol/source.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import { Circle as CircleStyle, Fill, Stroke, Icon, Text, Style, RegularShape } from 'ol/style.js';

// react
import React, { useState, useEffect } from 'react';
// openlayers
import GeoJSON from 'ol/format/GeoJSON'
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import Polygon from 'ol/geom/Polygon.js';
import { fromLonLat } from 'ol/proj.js';

// @ts-ignore
import mqtt_client from 'u8-mqtt'
import * as types from '../types'
import { cotEntity } from "../cotParser/cotEntityEnum"

type COT = types.COT & {
    feature?: Array<Feature>
}

// components
import MapWrapper from './components/mapWrapper'

function App() {
    // set intial state
    const [features, setFeatures] = useState([])


    // initialization - retrieve GeoJSON features from Mock JSON API get features from mock
    //  GeoJson API (read from flat .json file in public directory)
    useEffect(() => {
        //@ts-ignore
        comms(setFeatures).then(() => console.log("comms initialized"))

    }, [])



    return (
        <div className="App">
            <div className="app-label">
                <p>React Functional Components with OpenLayers Example</p>
            </div>
            <MapWrapper features={features} />
        </div>
    )
}


// gpt4 wrote this, I have no idea what it does and it's a bit wrong (wrong scale on lng dimension) but nvm for now
// check this for later to fix this
// https://stackoverflow.com/questions/68961531/how-to-get-latitude-and-longitude-after-going-a-distance-at-certain-bearing-from
function movePoint([lat, lng]: [number, number], distance: number, bearing: number): [number, number] {
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);
    const toDegrees = (radians: number) => radians * (180 / Math.PI);

    const R = 6371e3; // earth radius in meters
    const bearingRad = toRadians(bearing);
    const latRad = toRadians(lat);
    const delta = distance / R; // angular distance in radians

    const newLatRad = Math.asin(Math.sin(latRad) * Math.cos(delta) +
        Math.cos(latRad) * Math.sin(delta) * Math.cos(bearingRad));
    let newLngRad = Math.atan2(Math.sin(bearingRad) * Math.sin(delta) * Math.cos(latRad),
        Math.cos(delta) - Math.sin(latRad) * Math.sin(newLatRad));

    newLngRad = ((lng + toDegrees(newLngRad) + 180) % 360) - 180; // normalise to -180..+180°
    return [toDegrees(newLatRad), newLngRad]
}

function nameFromCot(cot: COT): string {
    return get(cot, 'detail.contact.callsign', cot.uid)
}

const entities: { [uid: string]: COT } = {}

function FeatureFromCOT(cot: COT): Array<Feature> {
    if (cot.atype == cotEntity['sensor point']) {

        //@ts-ignore
        const coneAngle: number = - cot.detail.sensor.azimuth + 90
        //@ts-ignore
        const fov: number = cot.detail.sensor.fov
        //@ts-ignore
        const range: number = cot.detail.sensor.range * 1.45

        const resolution = 8

        return [

            new Feature({
                geometry: new Point(fromLonLat([cot.point.lon, cot.point.lat])),
                name: cot.uid,
                cot: cot
            }),

            new Feature({
                geometry: new Polygon([[
                    fromLonLat([cot.point.lon, cot.point.lat]),

                    ...(times(resolution, (i: number) => {
                        return fromLonLat(movePoint([cot.point.lon, cot.point.lat], range,
                            coneAngle - fov / 2 + ((fov / (resolution - 1)) * i)))
                    }
                    )),
                    fromLonLat([cot.point.lon, cot.point.lat])
                ]]),
            })
        ]
    } else {
        return [new Feature({
            geometry: new Point(fromLonLat([cot.point.lon, cot.point.lat])),
            name: cot.uid,
            cot: cot
        })]
    }
}

async function comms(setFeatures: (features: Array<Feature>) => void) {
    let mqttConnection = mqtt_client()
        .with_websock('ws://localhost:3001')
        // or .with_tcp('tcp://test.mosquitto.org:1883')
        .with_autoreconnect()

    await mqttConnection.connect()

    mqttConnection.subscribe_topic(
        'cot/#',
        (pkt: any) => {
            const cot: COT = pkt.json()
            console.log('COT update', nameFromCot(cot), cot)

            //if (entities[cot.uid]) {
            //    // @ts-ignore
            //    entities[cot.uid].feature.forEach((feature) => cotVectorSource.removeFeature(feature))
            //}

            const features = FeatureFromCOT(cot)
            cot.feature = features
            entities[cot.uid] = cot

            // @ts-ignore
            const allFeatures = reduce(entities, ((acc, cot) => ([...acc, ...(cot.feature || [])])), [])
            console.log("SETFEATURES", allFeatures)

            setFeatures(allFeatures)

            //features.forEach((feature) => cotVectorSource.addFeature(feature))
            //refocus()
        })

    await mqttConnection.json_send(
        'test/live',
        {
            note: 'from README example',
            live: new Date().toISOString()
        })

}




export default App

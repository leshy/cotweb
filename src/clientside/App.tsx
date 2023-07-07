import './App.css';
import { reduce, keys, head, get, times, clone } from 'lodash'
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
import { cotEntity } from "../cotParser/cotEntityEnum"
import * as types from '../types'

import { COT } from './base'

// components
import CotMap from './components/cotMap'
import CotList from './components/cotList'

function App() {
    // set intial state
    const [entities, setEntities] = useState({})
    const [isExpanded, setExpanded] = useState<string | void>(undefined);
    // initialization - retrieve GeoJSON features from Mock JSON API get features from mock
    //  GeoJson API (read from flat .json file in public directory)
    useEffect(() => {
        //@ts-ignore
        comms(setEntities).then(() => console.log("comms initialized"))
    }, [])


    const reticle = isExpanded ? <img id="reticleImg" key={isExpanded} src="images/reticle.svg" /> : null

    return <div className="App">
        <CotMap entities={entities} isExpanded={isExpanded} setExpanded={setExpanded} />
        <CotList entities={entities} isExpanded={isExpanded} setExpanded={setExpanded} />
    </div>
}

function nameFromCot(cot: COT): string {
    return get(cot, 'detail.contact.callsign', cot.uid)
}

const entities: { [uid: string]: COT } = {}

async function comms(callback: (entities: { [uid: string]: COT }) => void) {
    let mqttConnection = mqtt_client()
        .with_websock('ws://localhost:3001')
        // or .with_tcp('tcp://test.mosquitto.org:1883')
        .with_autoreconnect()

    await mqttConnection.connect()

    mqttConnection.subscribe_topic(
        'cot/#',
        (pkt: any) => {
            const cot: COT = pkt.json()

            if (cot == null) {
                console.log("NULL MSG", pkt)
                return
            }

            console.log('COT update', nameFromCot(cot), cot)

            entities[cot.uid] = cot
            callback(clone(entities))


            //if (entities[cot.uid]) {
            //    // @ts-ignore
            //    entities[cot.uid].feature.forEach((feature) => cotVectorSource.removeFeature(feature))
            //}
            /*
            *             const features = FeatureFromCOT(cot)
            *             cot.feature = features
            *
            *             // @ts-ignore
            *             const allFeatures = reduce(entities, ((acc, cot) => ([...acc, ...(cot.feature || [])])), [])
            *             console.log("SETFEATURES", allFeatures)
            *
            *             setFeatures(allFeatures)
            *  */
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

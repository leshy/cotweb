import { map, times, flatten } from 'lodash'
import React from 'react';
import { COT, nameFromCot } from '../base'
import MapWrapper from './mapWrapper'
import { Circle as CircleStyle, Fill, Stroke, Icon, Text, Style, RegularShape } from 'ol/style.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import Polygon from 'ol/geom/Polygon.js';
import { fromLonLat } from 'ol/proj.js';
import { cotEntity } from "../../cotParser/cotEntityEnum"
import * as turf from 'turf'


function movePoint([lat, lng]: [number, number], distance: number, bearing: number): [number, number] {
    const point = turf.point([lng, lat]);
    const destination = turf.destination(point, distance, bearing, 'meters');
    return destination.geometry.coordinates.reverse() as [number, number]
}

// gpt4 wrote this, I have no idea what it does and it's a bit wrong (wrong scale on lng dimension)
// but nvm for now
// check this for later to fix this
// https://stackoverflow.com/questions/68961531/how-to-get-latitude-and-longitude-after-going-a-distance-at-certain-bearing-from
function movePoint_old([lat, lng]: [number, number], distance: number, bearing: number): [number, number] {
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
export function CotMap({ entities, isExpanded }: { entities: { [uid: string]: COT }, isExpanded: string | void }) {
    const features = flatten(map(entities, FeatureFromCOT))

    const cot: COT | void = isExpanded ? entities[isExpanded] : undefined

    return <MapWrapper features={features} viewLoc={cot ? [cot.point.lon, cot.point.lat] : undefined} />
}

export default CotMap

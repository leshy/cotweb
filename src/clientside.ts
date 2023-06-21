import { io } from 'socket.io-client'

import { Map, View } from 'ol';
import XYZ from 'ol/source/XYZ.js';
// import OSM from 'ol/source/OSM';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { Circle as CircleStyle, Fill, Stroke, Icon, Style } from 'ol/style.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
// import Feature from 'ol/Feature.js';
import KML from 'ol/format/KML.js';
import { applyStyle } from 'ol-mapbox-style';

import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import MVT from 'ol/format/MVT.js';

import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { fromLonLat } from 'ol/proj.js';

import * as types from './types'
import { StyleLike } from 'ol/style/Style';


export type Config = {
    mapBoxKey: string
}

// @ts-ignore
const key = (window.config as Config).mapBoxKey

const map = new Map({
    target: 'map',

    view: new View({
        //@ts-ignore
        //        projection: olProj.get('EPSG:4326'),
        center: [15.9, 45.7],
        zoom: 3
    })
})

const osmLayer = new TileLayer({
    className: 'bw',
    source: new OSM()
})

var satLayer = new TileLayer({
    source: new XYZ({
        // @ts-ignore
        url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/{z}/{x}/{y}?access_token=' + key,
        tileSize: 512
    })
});

const mapBoxVectorLayer = new VectorTileLayer({
    declutter: true,
    //    projection: olProj.get('EPSG:4326'),
    source: new VectorTileSource({
        attributions:
            '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
            '© <a href="https://www.openstreetmap.org/copyright">' +
            'OpenStreetMap contributors</a>',
        format: new MVT(),
        url:
            'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
            '{z}/{x}/{y}.vector.pbf?access_token=' +
            key,
    })
})

applyStyle(mapBoxVectorLayer, 'mapbox://styles/mapbox/dark-v9', { accessToken: key });
//applyStyle(vectorLayer, 'mapbox://styles/lshy33/cliyl8l1h002701pe223sg29u', { accessToken: key });
map.addLayer(mapBoxVectorLayer)

//const image = new CircleStyle({
//    radius: 5,
//    stroke: new Stroke({ color: 'red', width: 1 }),
//});



const styles = {
    'Point': new Style({
        image: new Icon({
            color: '#8959A8',
            crossOrigin: 'anonymous',
            src: 'icons/sensor_location.png',
        }),
    })
}

const kmlLayer = new VectorLayer({
    source: new VectorSource({
        url: 'data/boundary.kml',
        format: new KML({
            extractStyles: false,
        }),
    })
})

map.addLayer(kmlLayer);


const styleFunction = function(feature: Feature, resolution: number): Style | StyleLike | void {
    if (resolution < 25) { return styles.Point }


};


const cotVectorSource = new VectorSource({
    features: [],
});

const cotVectorLayer = new VectorLayer({
    source: cotVectorSource,
    // @ts-ignore
    style: styleFunction,
});
map.addLayer(cotVectorLayer)

const entities: { [uid: string]: types.COT } = {}

const socket = io();
//@ts-ignore
socket.on('msg', (data) => { console.log('msg', data) })

socket.on('SET', (entity: types.COT) => {
    console.log("SET", entity)
    entities[entity.uid] = entity

    cotVectorSource.addFeature(
        new Feature({
            geometry: new Point(fromLonLat([entity.point.lon, entity.point.lat])),
        })
    )
})

socket.on('DEL', (uid: string) => {
    console.log("DEL", uid)
    delete entities[uid]
})


// const addEvent = (data: any) => {
//     console.log('event', data)
//     const feature = new GeoJSON().readFeature(data)
//     console.log("FEATURE", feature)
//     vectorSource.addFeature(feature)
// }

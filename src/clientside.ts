//import { io } from 'socket.io-client'

import { Map, View } from 'ol';
import XYZ from 'ol/source/XYZ.js';
// import OSM from 'ol/source/OSM';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { Circle as CircleStyle, Fill, Stroke, Icon, Text, Style } from 'ol/style.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
// import Feature from 'ol/Feature.js';
import KML from 'ol/format/KML.js';
import { applyStyle } from 'ol-mapbox-style';

import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import MVT from 'ol/format/MVT.js';

import Feature from 'ol/Feature.js';
import { FeatureLike } from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { fromLonLat } from 'ol/proj.js';

import * as serversideTypes from './types'

type COT = serversideTypes.COT & {
    feature?: Feature
}

//@ts-ignore
import mqtt_client from 'u8-mqtt'

import * as types from './types'
import { StyleLike } from 'ol/style/Style';


export type Config = {
    mapBoxKey: string
}

// @ts-ignore
const key = (window.config as Config).mapBoxKey

const view = new View({
    //@ts-ignore
    //        projection: olProj.get('EPSG:4326'),
    center: [15.9, 45.7],
    zoom: 3
})

const map = new Map({
    target: 'map',
    view
})

const osmLayer = new TileLayer({
    className: 'bw',
    source: new OSM()
})

var satLayer = new TileLayer({
    source: new XYZ({
        // @ts-ignore
        url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=' + key,
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

map.addLayer(satLayer)


//applyStyle(vectorLayer, 'mapbox://styles/lshy33/cliyl8l1h002701pe223sg29u', { accessToken: key });
//map.addLayer(mapBoxVectorLayer)
//map.addLayer(mapBoxVectorLayer)

//const image = new CircleStyle({
//    radius: 5,
//    stroke: new Stroke({ color: 'red', width: 1 }),
//});


const kmlLayer = new VectorLayer({
    source: new VectorSource({
        url: 'data/boundary.kml',
        format: new KML({
            extractStyles: false,
        }),
    })
})

map.addLayer(kmlLayer);


function cotStyleFunction(feature: Feature, resolution: number): Style | StyleLike | void {
    if (resolution < 25) { return styles.Point }
}


function flyTo(location: any, done: (complete: any) => any) {
    const duration = 2000;
    const zoom: number = view.getZoom() as number;
    let parts = 2;
    let called = false;
    function callback(complete: any) {
        --parts;
        if (called) {
            return;
        }
        if (parts === 0 || !complete) {
            called = true;
            done(complete);
        }
    }
    view.animate(
        {
            center: location,
            duration: duration,
        },
        callback
    );
    view.animate(
        {
            zoom: 19,
            duration: duration
        },
        callback
    );
}

const cotVectorSource = new VectorSource({
    features: [],
});

// const socket = io();
// //@ts-ignore
// socket.on('msg', (data) => { console.log('msg', data) })

// socket.on('SET', (entity: types.COT) => {
//     console.log("SET", entity)
//     entities[entity.uid] = entity

//     cotVectorSource.addFeature(
//         new Feature({
//             geometry: new Point(fromLonLat([entity.point.lon, entity.point.lat])),
//         })
//     )
// })

// socket.on('DEL', (uid: string) => {
//     console.log("DEL", uid)
//     delete entities[uid]
// })


// const addEvent = (data: any) => {
//     console.log('event', data)
//     const feature = new GeoJSON().readFeature(data)
//     console.log("FEATURE", feature)
//     vectorSource.addFeature(feature)
// }

// or import mqtt_client from 'u8-mqtt'


const styles = {
    point: (name: string) => new Style({
        image: new Icon({
            crossOrigin: 'anonymous',
            src: 'icons/control_point.png',
        }),
        text: new Text({
            text: name,
            font: '20px monospace',
            padding: [2, 5, 2, 5],
            textAlign: 'left',
            fill: new Fill({
                color: 'white',
            }),
            backgroundFill: new Fill({
                color: [0, 0, 0, 0.75],
            }),
            offsetX: 20,
            offsetY: 25
        }),
    })
}


const styleFunction = function(feature: Feature, resolution: number): Style | StyleLike | void {
    console.log('feature', feature)
    if (resolution < 25) { return styles.point(feature.get('name')) }
};

const cotVectorLayer = new VectorLayer({
    source: cotVectorSource,
    // @ts-ignore
    style: styleFunction,
});
map.addLayer(cotVectorLayer)

const entities: { [uid: string]: types.COT } = {}

// @ts-ignore
window.entities = entities

function FeatureFromCOT(cot: COT): Feature {
    return new Feature({
        geometry: new Point(fromLonLat([cot.point.lon, cot.point.lat])),
        name: cot.uid,
        cot: cot
    })
}

async function comms() {
    let mqttConnection = mqtt_client()
        .with_websock('ws://localhost:3001')
        // or .with_tcp('tcp://test.mosquitto.org:1883')
        .with_autoreconnect()

    await mqttConnection.connect()

    mqttConnection.subscribe_topic(
        'cot/#',
        (pkt: any) => {
            const cot: COT = pkt.json()
            console.log('COT update', cot)

            if (entities[cot.uid]) {
                // @ts-ignore
                cotVectorSource.removeFeature(entities[cot.uid].feature)
            } else {
                flyTo(fromLonLat([cot.point.lon, cot.point.lat]), () => { })
            }

            const feature = FeatureFromCOT(cot)
            cot.feature = feature
            entities[cot.uid] = cot
            cotVectorSource.addFeature(feature)
        })

    await mqttConnection.json_send(
        'test/live',
        {
            note: 'from README example',
            live: new Date().toISOString()
        })

}


comms().then(() => console.log("comms initialized"))



const selectStyle = new Style({
    fill: new Fill({
        color: '#ff0000',
    }),
    stroke: new Stroke({
        color: 'rgba(255, 0, 0, 0.7)',
        width: 2,
    }),
});

let selected: FeatureLike | null = null
map.on('pointermove', function(e) {
    if (selected !== null) {
        // @ts-ignore
        selected.setStyle(undefined);
        selected = null;
    }

    map.forEachFeatureAtPixel(e.pixel, function(f) {
        console.log("feature", f)
        selected = f;
        //        selectStyle.getFill().setColor("#ff0000")
        //        @ts-ignore
        f.setStyle(selectStyle);
        return true;
    }, {
        layerFilter: (l) => l == cotVectorLayer
    });

})

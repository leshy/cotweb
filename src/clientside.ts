import { io } from 'socket.io-client'

import { Map, View } from 'ol';
import XYZ from 'ol/source/XYZ.js';
// import OSM from 'ol/source/OSM';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
// import Feature from 'ol/Feature.js';
import KML from 'ol/format/KML.js';
import { applyStyle } from 'ol-mapbox-style';

import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import MVT from 'ol/format/MVT.js';

const socket = io();
//@ts-ignore
socket.on('msg', (data) => { console.log('msg', data) })


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

const vectorLayer = new VectorTileLayer({
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

applyStyle(vectorLayer, 'mapbox://styles/mapbox/dark-v9', { accessToken: key });
//applyStyle(vectorLayer, 'mapbox://styles/lshy33/cliyl8l1h002701pe223sg29u', { accessToken: key });
map.addLayer(vectorLayer)

const addEvent = (data: any) => {
    console.log('event', data)
    const feature = new GeoJSON().readFeature(data)
    console.log("FEATURE", feature)
    vectorSource.addFeature(feature)
}

socket.on('event', addEvent)

const image = new CircleStyle({
    radius: 5,
    stroke: new Stroke({ color: 'red', width: 1 }),
});

const styles = {
    'Point': new Style({
        image: image,
    }),
    'LineString': new Style({
        stroke: new Stroke({
            color: 'green',
            width: 1,
        }),
    }),
    'MultiLineString': new Style({
        stroke: new Stroke({
            color: 'green',
            width: 1,
        }),
    }),
    'MultiPoint': new Style({
        image: image,
    }),
    'MultiPolygon': new Style({
        stroke: new Stroke({
            color: 'yellow',
            width: 1,
        }),
        fill: new Fill({
            color: 'rgba(255, 255, 0, 0.1)',
        }),
    }),
    'Polygon': new Style({
        stroke: new Stroke({
            color: 'blue',
            lineDash: [4],
            width: 3,
        }),
        fill: new Fill({
            color: 'rgba(0, 0, 255, 0.1)',
        }),
    }),
    'GeometryCollection': new Style({
        stroke: new Stroke({
            color: 'magenta',
            width: 2,
        }),
        fill: new Fill({
            color: 'magenta',
        }),
        image: new CircleStyle({
            radius: 10,
            stroke: new Stroke({
                color: 'magenta',
            }),
        }),
    }),
    'Circle': new Style({
        stroke: new Stroke({
            color: 'red',
            width: 2,
        }),
        fill: new Fill({
            color: 'rgba(255,0,0,0.2)',
        }),
    }),
};

// const styleFunction = function(feature: any) {
//     //@ts-ignore
//     return styles[feature.getGeometry().getType()];
// }

// const vectorLayer = new VectorLayer({
//     source: vectorSource,
//     style: styleFunction,
// });


// map.addLayer(vectorLayer);

const vectorSource = new VectorSource()

const vector = new VectorLayer({
    source: new VectorSource({
        url: 'data/boundary.kml',
        format: new KML({
            extractStyles: false,
        }),
    }),
    style: (feature) => {
        //        console.log('styling feature', feature)

        return new Style({
            stroke: new Stroke({
                color: 'red',
                width: 2,
            })
        })
    }
})

map.addLayer(vector);

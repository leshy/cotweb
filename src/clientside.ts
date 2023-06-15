const { Socket } = require('engine.io-client');
const socket = new Socket('ws://' + document.location.host);

import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';


//@ts-ignore
socket.on('open', (err, data) => {
    console.log('connected', err, data);
    socket.send('hello');
    // @ts-ignore
    socket.on('message', (data) => { console.log('recv', data) })
    socket.on('close', () => {
        console.log('closed')
    })
})

const map = new Map({
    target: 'map',
    layers: [
        new TileLayer({
            source: new OSM()
        })
    ],
    view: new View({
        center: [0, 0],
        zoom: 2
    })
})

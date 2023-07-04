import { reduce, keys, head, get, times } from 'lodash'
import * as types from './types'
// @ts-ignore
import mqtt_client from 'u8-mqtt'

import { createRoot } from "react-dom/client";
import { useState } from 'react';

import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
//@ts-ignore
import App from './clientside/App.tsx';


const container = document.getElementById('root');

// Create a root - https://github.com/reactwg/react-18/discussions/5
const root = ReactDOMClient.createRoot(container as HTMLElement)

// Initial render: Render an element to the root
root.render(
    <App />
);



/* async function comms() {
*     let mqttConnection = mqtt_client()
*         .with_websock('ws://localhost:3001')
*         // or .with_tcp('tcp://test.mosquitto.org:1883')
*         .with_autoreconnect()
*
*     await mqttConnection.connect()
*
*     mqttConnection.subscribe_topic(
*         'cot/#',
*         (pkt: any) => {
*             const cot: COT = pkt.json()
*             console.log('COT update', nameFromCot(cot), cot)
*
*             if (entities[cot.uid]) {
*                 // @ts-ignore
*                 entities[cot.uid].feature.forEach((feature) => cotVectorSource.removeFeature(feature))
*             }
*
*             const features = FeatureFromCOT(cot)
*             cot.feature = features
*             entities[cot.uid] = cot
*             features.forEach((feature) => cotVectorSource.addFeature(feature))
*             refocus()
*         })
*
*     await mqttConnection.json_send(
*         'test/live',
*         {
*             note: 'from README example',
*             live: new Date().toISOString()
*         })
*
* }
*
* comms().then(() => console.log("comms initialized")) */

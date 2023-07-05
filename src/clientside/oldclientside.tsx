//import { io } from 'socket.io-client'
import { reduce, keys, head, get, times } from 'lodash'

import { Map, View } from 'ol';
import Stamen from 'ol/source/Stamen.js';
import XYZ from 'ol/source/XYZ.js';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import { Circle as CircleStyle, Fill, Stroke, Icon, Text, Style, RegularShape } from 'ol/style.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
// import Feature from 'ol/Feature.js';
import KML from 'ol/format/KML.js';
import { applyStyle } from 'ol-mapbox-style';
import Polygon from 'ol/geom/Polygon.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import MVT from 'ol/format/MVT.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import GeometryCollection from 'ol/geom/GeometryCollection';
import LineString from 'ol/geom/LineString.js';
import { fromLonLat } from 'ol/proj.js';
import { StyleLike } from 'ol/style/Style';

import * as serversideTypes from '../types'
import { cotEntity } from "../cotParser/cotEntityEnum"
// @ts-ignore
window.cotEntity = cotEntity

type COT = serversideTypes.COT & {
    feature?: Array<Feature>
}

//@ts-ignore
import mqtt_client from 'u8-mqtt'

import * as types from '../types'


export type Config = {
    mapBoxKey: string
}

// @ts-ignore
const key = (window.config as Config).mapBoxKey

import React from "react";
import { createRoot } from "react-dom/client";
import { useState } from 'react';

function App() {
    return <h1>Hello world! </h1>;
}

const container = document.getElementById("app");
const root = createRoot(container as HTMLElement)
root.render(<App />);


function makemap() {
    const view = new View({
        //@ts-ignore
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

    var customTiles = new TileLayer({
        extent: [2618837.368622, 4685652.482596, 2620324.334091, 4687347.410557],
        source: new XYZ({
            url: '/tiles/sat/{z}/{x}/{-y}.png',
            tileSize: 256,
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


    const stamenTonerLayer = new TileLayer({
        source: new Stamen({
            layer: 'toner-background'
        }),
    });



    // const tiffSource = new GeoTIFF({
    //     sources: [
    //         {
    //             url: '/tif/tif.tif',
    //         },
    //     ],
    // });

    // const tiffLayer = new TileLayer({
    //     source: tiffSource
    // });



    //map.addLayer(stamenTonerLayer)
    map.addLayer(osmLayer)
    map.addLayer(customTiles)
    //map.addLayer(satLayer)
    //map.addLayer(tiffLayer)

    //applyStyle(vectorLayer, 'mapbox://styles/lshy33/cliyl8l1h002701pe223sg29u', { accessToken: key });
    //map.addLayer(mapBoxVectorLayer)
    //map.addLayer(mapBoxVectorLayer)

    //const image = new CircleStyle({
    //    radius: 5,
    //    stroke: new Stroke({ color: 'red', width: 1 }),
    //});

    const kmlStyle = new Style({
        fill: new Fill({
            color: 'rgba(255,255,255,0)',
        }), stroke: new Stroke({
            color: 'red',
            width: 5,
            lineDash: [1, 30],
        })
    })


    const kmlLayer = new VectorLayer({
        source: new VectorSource({
            url: 'data/boundary.kml',
            format: new KML({
                extractStyles: false,
            }),
        }),
        style: kmlStyle,
        // @ts-ignore
        styleFunction: function(feature: Feature, resolution: number): Style | void {
            console.log("KMLSTYE", feature, resolution)
            if (resolution < 17) {
                return kmlStyle
            }
        }
    })

    map.addLayer(kmlLayer);

    function refocus() {
        const config = {
            padding: 200,
            duration: 2000,
            soloZoom: 19
        }

        const ekeys = keys(entities)
        view.cancelAnimations()

        if (ekeys.length == 1) {
            const cot = entities[head(ekeys) as string] as COT
            view.animate({ zoom: config.soloZoom, center: fromLonLat([cot.point.lon, cot.point.lat]), duration: config.duration })
        } else {
            const square = reduce(
                entities,
                (minMaxSquare: { minLat: number, maxLat: number, minLon: number, maxLon: number }, entity: COT) => {
                    const lat = entity.point.lat
                    const lon = entity.point.lon
                    return {
                        minLat: Math.min(minMaxSquare.minLat, lat),
                        maxLat: Math.max(minMaxSquare.maxLat, lat),
                        minLon: Math.min(minMaxSquare.minLon, lon),
                        maxLon: Math.max(minMaxSquare.maxLon, lon),
                    }
                },
                { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 }
            )

            view.fit([
                ...fromLonLat([square.minLon, square.minLat]),
                ...fromLonLat([square.maxLon, square.maxLat])
            ], {
                duration: config.duration,
                padding: Array.from({ length: 4 }, () => config.padding)
            })
        }
    }

    const cotVectorSource = new VectorSource({
        features: [],
    });

    const styles = {

        cot: (name: string, iconName: string) => new Style({
            image: new Icon({
                crossOrigin: 'anonymous',
                src: 'icons/' + iconName + '.png',
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
            stroke: new Stroke({
                color: [50, 50, 100, 0.75],
                width: 2,
            }),
            fill: new Fill({
                color: [50, 50, 100, 0.5],
            })
        }),

        default: new Style({
            stroke: new Stroke({
                color: [50, 50, 100, 0.75],
                width: 2,
            }),
            fill: new Fill({
                color: [50, 50, 100, 0.125],
            })
        })

    }


    function nameFromCot(cot: COT): string {
        return get(cot, 'detail.contact.callsign', cot.uid)
    }

    function styleFromCot(cot: COT): Style {
        function iconFromCOT(cot: COT): string {
            if (cot.atype == cotEntity['sensor point']) {
                return 'sensor_location'
            } else if (cot.atype == cotEntity['Gnd Combat unit']) {
                return 'control_point'
            } else {
                return 'default'
            }
        }

        return styles.cot(nameFromCot(cot), iconFromCOT(cot))
    }

    const styleFunction = function(feature: Feature, resolution: number): Style | StyleLike | void {
        if (resolution < 25) {
            const cot = feature.get('cot') as COT
            if (cot) {
                // @ts-ignore
                return styleFromCot(cot)
            } else {
                return styles.default
            }
        }
    }

    const cotVectorLayer = new VectorLayer({
        source: cotVectorSource,
        // @ts-ignore
        style: styleFunction,
    });

    map.addLayer(cotVectorLayer)

    const entities: { [uid: string]: types.COT } = {}

    // @ts-ignore
    window.entities = entities


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
                console.log('COT update', nameFromCot(cot), cot)

                if (entities[cot.uid]) {
                    // @ts-ignore
                    entities[cot.uid].feature.forEach((feature) => cotVectorSource.removeFeature(feature))
                }

                const features = FeatureFromCOT(cot)
                cot.feature = features
                entities[cot.uid] = cot
                features.forEach((feature) => cotVectorSource.addFeature(feature))
                refocus()
            })

        await mqttConnection.json_send(
            'test/live',
            {
                note: 'from README example',
                live: new Date().toISOString()
            })

    }

    comms().then(() => console.log("comms initialized"))

    // const selectStyle = new Style({
    //     fill: new Fill({
    //         color: '#ff0000',
    //     }),
    //     stroke: new Stroke({
    //         color: 'rgba(255, 0, 0, 0.7)',
    //         width: 2,
    //     }),
    // });
    // let selected: FeatureLike | null = null
    // map.on('pointermove', function(e) {
    //     if (selected !== null) {
    //         // @ts-ignore
    //         selected.setStyle(undefined);
    //         selected = null;
    //     }

    //     map.forEachFeatureAtPixel(e.pixel, function(f) {
    //         console.log("feature", f)
    //         selected = f;
    //         //        selectStyle.getFill().setColor("#ff0000")
    //         //        @ts-ignore
    //         f.setStyle(selectStyle);
    //         return true;
    //     }, {
    //         layerFilter: (l) => l == cotVectorLayer
    //     });

    // })
}

// react
import React, { useState, useEffect, useRef } from 'react';
import { Circle as CircleStyle, Fill, Stroke, Icon, Text, Style, RegularShape } from 'ol/style.js';
import Feature from 'ol/Feature.js';
import { reduce, keys, head, get, times } from 'lodash'

// openlayers
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Stamen from 'ol/source/Stamen'
import XYZ from 'ol/source/XYZ'
import KML from 'ol/format/KML.js';
import { fromLonLat } from 'ol/proj.js';
import { transform } from 'ol/proj'
import { toStringXY } from 'ol/coordinate';

import { cotEntity } from "../../cotParser/cotEntityEnum"
import * as types from '../../types'

type COT = types.COT & {
    feature?: Array<Feature>
}



// @ts-ignore
function MapWrapper(props) {

    // set intial state
    const [map, setMap] = useState()
    const [featuresLayer, setFeaturesLayer] = useState()
    const [selectedCoord, setSelectedCoord] = useState()

    // pull refs
    const mapElement = useRef()

    // create state ref that can be accessed in OpenLayers onclick callback function
    //  https://stackoverflow.com/a/60643670
    const mapRef = useRef()
    mapRef.current = map

    // initialize map on first render - logic formerly put into componentDidMount
    useEffect(() => {

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

        const styleFunction = function(feature: Feature, resolution: number): Style | void {
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

        // create and add vector source layer
        const initalFeaturesLayer = new VectorLayer({
            source: new VectorSource(),
            //@ts-ignore
            style: styleFunction,
        })

        // create map
        const initialMap = new Map({
            target: mapElement.current,
            layers: [

                /*
                *                 new TileLayer({
                *                     className: 'bw',
                *                     source: new OSM()
                *                 })
                *  */
                // Google Maps Terrain
                /* new TileLayer({
                  source: new XYZ({
                    url: 'http://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}',
                  })
                }), */


            ],
            view: new View({
                projection: 'EPSG:3857',
                center: [0, 0],
                zoom: 2
            }),
            controls: []
        })


        const kmlStyle = new Style({
            fill: new Fill({
                color: 'rgba(255,255,255,0)',
            }), stroke: new Stroke({
                color: 'red',
                width: 5,
                lineDash: [1, 30],
            })
        })

        const customTiles = new TileLayer({
            extent: [2618837.368622, 4685652.482596, 2620324.334091, 4687347.410557],
            source: new XYZ({
                url: '/tiles/sat_big/{z}/{x}/{-y}.png',
                //                tileSize: 256,
                tileSize: 1024,
            })
        });

        const kmlLayer = new VectorLayer({
            source: new VectorSource({
                url: 'data/boundary.kml',
                format: new KML({
                    extractStyles: false,
                }),
            }),
            style: kmlStyle,

        })

        const stamenTonerLayer = new TileLayer({
            source: new Stamen({
                layer: 'toner-background'
            }),
        });


        const satLayer = new TileLayer({
            source: new XYZ({
                // @ts-ignore
                url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=' + window.config.mapBoxKey,
                tileSize: 512
            })
        });


        initialMap.addLayer(satLayer)
        initialMap.addLayer(customTiles)
        initialMap.addLayer(kmlLayer)
        initialMap.addLayer(initalFeaturesLayer)


        // set map onclick handler
        initialMap.on('click', handleMapClick)

        // save map and vector layer references to state
        // @ts-ignore
        setMap(initialMap)
        // @ts-ignore
        setFeaturesLayer(initalFeaturesLayer)

    }, [])


    // update map if features prop changes - logic formerly put into componentDidUpdate
    useEffect(() => {
        if (props.viewLoc) {
            // @ts-ignore
            const view = map.getView()
            view.cancelAnimations()
            view.animate({ zoom: props.viewZoom || 18, center: fromLonLat(props.viewLoc), duration: 1000 })
        }


        if (props.features.length) { // may be null on first render
            // set features to map
            // @ts-ignore
            featuresLayer.setSource(
                new VectorSource({
                    features: props.features // make sure features is an array
                })
            )

            // fit map to feature extent (with 100px of padding)
            // @ts-ignore
            /* map.getView().fit(featuresLayer.getSource().getExtent(), {
*     padding: [100, 100, 100, 100]
* })
 */
        }

    }, [props.features])

    // map click handler
    // @ts-ignore
    const handleMapClick = (event) => {
        // get clicked coordinate using mapRef to access current React state inside OpenLayers callback
        //  https://stackoverflow.com/a/60643670
        // @ts-ignore
        const clickedCoord = mapRef.current.getCoordinateFromPixel(event.pixel);

        // transform coord to EPSG 4326 standard Lat Long
        const transormedCoord = transform(clickedCoord, 'EPSG:3857', 'EPSG:4326')

        // set React state
        // @ts-ignore
        setSelectedCoord(transormedCoord)
    }

    // render component
    // @ts-ignore
    return (
        <div>
            <div ref={mapElement} className="map-container"></div>
            <div className="clicked-coord-label">
                <p>{(selectedCoord) ? toStringXY(selectedCoord, 5) : ''}</p>
            </div>
        </div>
    )

}

export default MapWrapper

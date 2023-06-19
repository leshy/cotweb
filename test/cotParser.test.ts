import { inspect } from 'util'
import * as samples from './samples'
import * as cotParser from '../src/cotParser'

describe('cotParser', () => {
    it('XMLtoGeoJson', () => {
        expect(cotParser.XMLtoGeoJson(samples.xml.camera)).toEqual({
            id: 'bf4fe367-c422-403c-aaf0-918a5b6a8e63',
            type: 'Feature',
            properties: {
                callsign: 'ivn.16.133249',
                type: 'b-m-p-s-p-loc',
                how: 'h-g-i-g-o',
                time: '2023-06-16T11:37:45.047Z',
                start: '2023-06-16T11:37:45.047Z',
                stale: '2024-06-15T11:37:45.047Z'
            },
            geometry: { type: 'Point', coordinates: ['15.978569', '45.813012', '178.0'] }
        })
    })



    it('XMLtoJson', () => {
        expect(cotParser.XMLtoJson(samples.xml.camera)).toEqual({
            event: {
                _attributes: {
                    version: '2.0',
                    uid: 'bf4fe367-c422-403c-aaf0-918a5b6a8e63',
                    type: 'b-m-p-s-p-loc',
                    how: 'h-g-i-g-o',
                    time: '2023-06-16T11:37:45.047Z',
                    start: '2023-06-16T11:37:45.047Z',
                    stale: '2024-06-15T11:37:45.047Z'
                },
                point: {
                    _attributes: {
                        lat: '45.813012',
                        lon: '15.978569',
                        hae: '178.0',
                        ce: '9999999.0',
                        le: '9999999.0'
                    }
                },


                detail: {
                    status: { _attributes: { readiness: 'true' } },
                    archive: [{}, {}],
                    color: { _attributes: { argb: '-1' } },
                    precisionlocation: { _attributes: { altsrc: 'DTED0' } },
                    __video: {
                        _attributes: {
                            uid: 'd648b1c1-db78-405e-bbbd-4a8ec089b969',
                            url: 'https://cdn-006.whatsupcams.com/hls/hr_zagreb6.m3u8'
                        },
                        ConnectionEntry: {
                            _attributes: {
                                networkTimeout: '12000',
                                uid: 'd648b1c1-db78-405e-bbbd-4a8ec089b969',
                                path: '',
                                protocol: 'raw',
                                bufferTime: '-1',
                                address: 'https://cdn-006.whatsupcams.com/hls/hr_zagreb6.m3u8',
                                port: '-1',
                                roverPort: '-1',
                                rtspReliable: '0',
                                ignoreEmbeddedKLV: 'false',
                                alias: 'Zagreb Sahare cam'
                            }
                        }
                    },
                    contact: { _attributes: { callsign: 'ivn.16.133249' } },
                    link: {
                        _attributes: {
                            uid: 'ANDROID-cdc97979a5447ede',
                            production_time: '2023-06-16T11:32:49.813Z',
                            type: 'a-f-G-U-C',
                            parent_callsign: 'ivn',
                            relation: 'p-p'
                        }
                    },
                    remarks: {},
                    sensor: {
                        _attributes: {
                            vfov: '45',
                            elevation: '0',
                            fovBlue: '0.0',
                            fovRed: '1.0',
                            strokeWeight: '0.0',
                            roll: '0',
                            range: '112',
                            azimuth: '271',
                            fov: '64',
                            fovGreen: '0.46666666865348816',
                            displayMagneticReference: '0',
                            strokeColor: '-35072',
                            rangeLines: '100',
                            fovAlpha: '0.2980392156862745'
                        }
                    }
                }
            }
        })
    })

    it('XMLtoCOT', () => {
        const cotMsg = cotParser.XMLtoCOT(samples.xml.camera)
        expect(cotMsg).toEqual({
            version: '2.0',
            uid: 'bf4fe367-c422-403c-aaf0-918a5b6a8e63',
            type: 'b-m-p-s-p-loc',
            how: 'h-g-i-g-o',
            time: '2023-06-16T11:37:45.047Z',
            start: '2023-06-16T11:37:45.047Z',
            stale: '2024-06-15T11:37:45.047Z',
            point: {
                lat: '45.813012',
                lon: '15.978569',
                hae: '178.0',
                ce: '9999999.0',
                le: '9999999.0'
            },


            detail: {
                status: { readiness: 'true' },
                archive: [{}, {}],
                color: { argb: '-1' },
                precisionlocation: { altsrc: 'DTED0' },
                __video: {
                    uid: 'd648b1c1-db78-405e-bbbd-4a8ec089b969',
                    url: 'https://cdn-006.whatsupcams.com/hls/hr_zagreb6.m3u8',
                    ConnectionEntry: {
                        networkTimeout: '12000',
                        uid: 'd648b1c1-db78-405e-bbbd-4a8ec089b969',
                        path: '',
                        protocol: 'raw',
                        bufferTime: '-1',
                        address: 'https://cdn-006.whatsupcams.com/hls/hr_zagreb6.m3u8',
                        port: '-1',
                        roverPort: '-1',
                        rtspReliable: '0',
                        ignoreEmbeddedKLV: 'false',
                        alias: 'Zagreb Sahare cam'
                    }
                },
                contact: { callsign: 'ivn.16.133249' },
                link: {
                    uid: 'ANDROID-cdc97979a5447ede',
                    production_time: '2023-06-16T11:32:49.813Z',
                    type: 'a-f-G-U-C',
                    parent_callsign: 'ivn',
                    relation: 'p-p'
                },
                remarks: {},
                sensor: {
                    vfov: '45',
                    elevation: '0',
                    fovBlue: '0.0',
                    fovRed: '1.0',
                    strokeWeight: '0.0',
                    roll: '0',
                    range: '112',
                    azimuth: '271',
                    fov: '64',
                    fovGreen: '0.46666666865348816',
                    displayMagneticReference: '0',
                    strokeColor: '-35072',
                    rangeLines: '100',
                    fovAlpha: '0.2980392156862745'
                }
            }
        })
    })


})

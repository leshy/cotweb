import { omit, flow } from 'lodash'
import { get } from 'lodash/fp'
import xmljs from 'xml-js'
import * as geojson from 'geojson'
import { COT } from '../types'
import { resolveType } from './checks'
import { types, utils } from 'lsh-foundation'
import * as path from 'path'

// https://github.com/dB-SPL/cot-types/blob/main/CoTtypes.xml

export const xmlStreamSplit = async function*(input: AsyncGenerator<Buffer>) {
    let totalData: string = ""
    for await (const data of input) {
        totalData = totalData + data.toString()
        const endToken = "</event>"

        const emitEvent = () => {
            const index = totalData.toLocaleLowerCase().indexOf(endToken)
            if (index != -1) {
                const eventXML = totalData.slice(0, index + endToken.length)
                totalData = totalData.slice(index + endToken.length)
                return eventXML
            } else { return false }
        }

        let nextEvent: String | false
        while (nextEvent = emitEvent()) {
            yield nextEvent
        }
    }
}

export type XML = string

export function XMLtoJson(input: XML): xmljs.ElementCompact {
    return xmljs.xml2js(input, { compact: true })
}

export function XMLtoCOT_(input: XML): COT {
    const parsed = xmljs.xml2js(input, { compact: true })
    const flattenAttributes = (input: xmljs.ElementCompact): types.BasicDict =>
        ({ ...input._attributes, ...omit(input, ['_attributes']) })

    // @ts-ignore
    return { ...flattenAttributes(parsed.event), point: flattenAttributes(parsed.event.point) }
}


type CB = (branch: any, dictpath: string) => any
const depthFirstMap = (cb: CB) => {
    const step = (branch: any, dictpath: string = "/", descend: boolean = false): any => {
        if (utils.isDict(branch)) {
            if (descend) {
                return Object.entries(branch).reduce((acc: types.Dict<any>, [key, value]) => {
                    acc[key] = step(value, path.join(dictpath, key), false)
                    return acc
                }, {})
            } else {
                return step(cb(branch, dictpath), dictpath, true)
            }
        } else if (utils.isArray(branch)) {
            if (descend) {
                return branch.map((entry: any) => step(entry, dictpath, false))
            } else {
                return step(cb(branch, dictpath), dictpath, true)
            }
        } else {
            return cb(branch, dictpath)
        }
    }
    return step
}



export const XMLtoCOT = flow([
    (xml: string) => xmljs.xml2js(xml, { compact: true }),

    depthFirstMap((branch: types.BasicType | types.Dict<types.BasicType>, dictPath: string) => {
        if (utils.isDict(branch) && branch._attributes) {
            //@ts-ignore
            return { ...(branch._attributes as types.BasicDict), ...omit(branch, ['_attributes']) }
        } else {
            return branch
        }
    }),

    get('event'),

    depthFirstMap((branch: types.BasicType | types.Dict<types.BasicType>, dictPath: string) => {
        const time = (branch: string) => new Date(branch)

        const pathTransforms: { [key: string]: (branch: any) => any } = {
            "/stale": time,
            "/start": time,
            "/time": time,
            "/point/lat": parseFloat,
            "/point/lon": parseFloat,
            "/point/hae": parseFloat,
            "/point/ce": parseFloat,
            "/point/le": parseFloat,
        }

        const transform = pathTransforms[dictPath]
        if (transform) { return transform(branch) }
        else { return branch }
    }),

    // @ts-ignore
    (cot: COT): COT => ({ ...cot, atype: resolveType(cot.type) })


])



export function COTtoGeoJSON(input: COT): geojson.GeoJSON {
    const feature: geojson.Feature = {
        //@ts-ignore
        id: input.event._attributes.uid,
        type: 'Feature',
        properties: {
            //@ts-ignore
            callsign: input.event.detail.contact._attributes.callsign || 'UNKNOWN',
            //@ts-ignore
            type: input.event._attributes.type,
            //@ts-ignore
            how: input.event._attributes.how,
            //@ts-ignore
            time: input.event._attributes.time,
            //@ts-ignore
            start: input.event._attributes.start,
            //@ts-ignore
            stale: input.event._attributes.stale,
            //@ts-ignore
            detail: input.event.detail
        },
        geometry: {
            type: 'Point',
            coordinates: [
                //@ts-ignore
                input.event.point._attributes.lon,
                //@ts-ignore
                input.event.point._attributes.lat,
                //@ts-ignore
                input.event.point._attributes.hae
            ]
        }
    };
    return feature
}

export function XMLtoGeoJson(input: string): geojson.GeoJSON {
    const raw: any = xmljs.xml2js(input, { compact: true });
    const feature: geojson.Feature = {
        id: raw.event._attributes.uid,
        type: 'Feature',
        properties: {
            callsign: raw.event.detail.contact._attributes.callsign || 'UNKNOWN',
            type: raw.event._attributes.type,
            how: raw.event._attributes.how,
            time: raw.event._attributes.time,
            start: raw.event._attributes.start,
            stale: raw.event._attributes.stale,
        },
        geometry: {
            type: 'Point',
            coordinates: [
                raw.event.point._attributes.lon,
                raw.event.point._attributes.lat,
                raw.event.point._attributes.hae
            ]
        }
    };
    return feature
}

import { omit } from 'lodash'
import xmljs from 'xml-js'
import * as geojson from 'geojson'
import { COT } from './types'
import { types, utils } from 'lsh-foundation'

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




type CB = (branch: any) => any
//@ts-ignore
const depthFirstMap = (cb: CB) => {
    const step = (branch: any, descend: boolean = false): any => {
        console.log("STEP", descend, branch)
        if (utils.isDict(branch)) {
            if (descend) {
                return Object.entries(branch).reduce((acc, [key, value]) => {
                    //@ts-ignore
                    acc[key] = step(value, false)
                    return acc
                }, {})
            } else {
                //@ts-ignore
                return step(cb(branch), true)
            }
        } else if (utils.isArray(branch)) {

            if (descend) {
                // @ts-ignore
                return branch.map(step)
            } else {
                return step(cb(branch), true)
            }
        } else {
            return cb(branch)
        }
    }
    return step
}


export function XMLtoCOT(input: XML): COT {
    const parsed = xmljs.xml2js(input, { compact: true })
    return depthFirstMap((branch: types.BasicDict) => {
        //        console.log("PROCESSING BRACNCH", branch)
        if (utils.isDict(branch) && branch._attributes) {
            return { ...(branch._attributes as types.BasicDict), ...omit(branch, ['_attributes']) }
        } else {
            return branch
        }
        // @ts-ignore
    })(parsed.event)
}


export function COTtoJSON(input: COT): geojson.GeoJSON {
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

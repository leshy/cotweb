import { get, capitalize } from 'lodash'
import * as types from '../types'
import Feature from 'ol/Feature.js';

export type COT = types.COT & {
    feature?: Array<Feature>
}

export type COTRenderedTime = COT & {
    start: Date,
    time: Date,
    stale: Date
}

export function renderTimes(cot: COT): COTRenderedTime {
    return {
        ...cot,
        // @ts-ignore
        start: new Date(cot.start), time: new Date(cot.time), stale: new Date(cot.stale)
    }
}

export function nameFromCot(cot: COT): string {
    return capitalize(get(cot, 'detail.contact.callsign', cot.uid))
}

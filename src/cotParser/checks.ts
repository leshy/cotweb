import { COT } from '../types';
import { cotTypes } from './cotTypes'

export type Check = (cot: COT) => boolean;

export function makeCheck(regex: RegExp): Check {
    return (cot: COT) => regex.test(cot.type);
}

export const friend = makeCheck(/^a-f-/)
export const hostile = makeCheck(/^a-h-/)
export const unknown = makeCheck(/^a-u-/)


export function resolveType(cotType: string): string {
    const cotTypeA = cotType.split("-")
    if (cotTypeA[0] == "a") { cotTypeA[1] = "." }

    // @ts-ignore
    return cotTypes[cotTypeA.join("-")] || "unknown"
}

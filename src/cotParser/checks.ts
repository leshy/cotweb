import { COT } from './types';

export type Check = (cot: COT) => boolean;

export function makeCheck(regex: RegExp): Check {
    return (cot: COT) => regex.test(cot);
}

export const isFriendly = makeCheck(/^a-f-/)

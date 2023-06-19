import { types } from 'lsh-foundation';

export function objectFlip(obj: types.Dict<any>) {
    const ret: types.Dict<any> = {};
    Object.keys(obj).forEach(key => {
        ret[obj[key]] = key;
    });
    return ret;
}

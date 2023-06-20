import * as types from '../../types'
export type Connection = {
    stream: () => AsyncGenerator<types.COT>,
    close: () => Promise<any>,
}

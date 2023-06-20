export type Connection<EVENT> = AsyncGenerator<EVENT>

export type COT = {
    version: string
    uid: string
    type: string
    how: string
    time: Date
    start: Date
    stale: Date
    point: {
        lat: number
        lon: number
        hae: number
        ce: number
        le: number
    }
}

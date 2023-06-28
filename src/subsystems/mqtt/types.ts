export type Config = {
    enabled: boolean
    external?: {
        host: string
        port: string
    }
    embedded?: {
        TCPport?: number
    }
}

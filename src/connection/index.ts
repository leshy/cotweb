import { logger } from 'lsh-foundation'
import { Connection } from './types'
import * as tcpConnection from './tcp'

export { Connection, tcpConnection }

export type Config = {
    tcp: tcpConnection.Config
}

export const connect = <EVENT>(logger: logger.Logger, config: Config): Connection<EVENT> => {
    if (config.tcp) {
        return tcpConnection.connect(logger, config.tcp)
    } else {
        throw new Error("no connection specified")
    }
}

import { logger, generator } from 'lsh-foundation'
import { Connection } from './types'
import { SubSystem, RunningSubSystem } from '../../types'
import * as tcpConnection from './tcp'
import * as cotParser from '../../cotParser'

export { Connection, tcpConnection }

export type Config = {
    tcp: tcpConnection.Config
}

export class CotConnection implements RunningSubSystem {
    constructor(
        public readonly connection: Connection,
        private readonly logger: logger.Logger
    ) { }

    async stream() {
        return generator.pipe(this.connection.stream(), cotParser.xmlStreamSplit)
    }

    stop = async () => this.connection.close()
}

export const cotConnection: SubSystem<Config, CotConnection> = {
    name: "cotConnection",
    init: async ({ logger, config }) => {
        if (config.tcp) {
            return new CotConnection(await tcpConnection.connect(logger, config.tcp), logger)
        } else {
            throw new Error("no connection specified")
        }
    }
}

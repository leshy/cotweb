import { logger, generator } from 'lsh-foundation'
import { Connection } from './types'
import { SubSystem, RunningSubSystem } from '../../types'
import { cotPipeline, CotPipeline } from '../cotPipeline'
import * as tcpConnection from './tcp'

export { Connection, tcpConnection }

export type Config = {
    tcp: tcpConnection.Config
}

export class CotConnection implements RunningSubSystem {
    constructor(
        public readonly connection: Connection,
        private readonly pipeline: CotPipeline,
        private readonly logger: logger.Logger,
    ) {
        this.pipeline.pull(this.connection.stream())
    }

    stop = async () => this.connection.close()
}

export const cotConnection: SubSystem<Config, CotConnection> = {
    name: "cotConnection",
    init: async ({ logger, config, initSubsystem }) => {
        const pipeline = await initSubsystem(cotPipeline)

        if (config.tcp) {
            return new CotConnection(await tcpConnection.connect(logger, config.tcp), pipeline, logger)
        } else {
            throw new Error("no connection specified")
        }
    }
}

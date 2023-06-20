import { generator, logger } from 'lsh-foundation'
import { XMLtoCOT } from '../cotParser';
import { SubSystem, RunningSubSystem } from '../types';
import { cotConnection } from './cotConnection';

export type Config = {}

export class CotParser implements RunningSubSystem {
    constructor(public readonly events: AsyncGenerator<string>, private readonly logger: logger.Logger) {
        setTimeout(() => this.work, 1)
    }

    work = async () => {
        for await (const msg of this.events) {
            this.logger.info(msg)
        }
    }

    async stop() { }
}

export const cotParser: SubSystem<Config, CotParser> = {
    name: 'cotParser',
    init: async ({ logger, initSubsystem }) => {
        const connection = await initSubsystem(cotConnection)
        const events = generator.pipe(
            connection.stream(),
            generator.map(XMLtoCOT)
        ) as AsyncGenerator<string>

        return new CotParser(events, logger)
    }
}

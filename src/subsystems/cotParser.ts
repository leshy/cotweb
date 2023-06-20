import { generator, logger } from 'lsh-foundation'
import { XMLtoCOT, xmlStreamSplit } from '../cotParser';
import { SubSystem, RunningSubSystem, COT } from '../types';
import { cotConnection } from './cotConnection';

export type Config = {}

export class CotParser implements RunningSubSystem {
    entities: Map<string, COT> = new Map()

    constructor(public readonly events: AsyncGenerator<COT>, private readonly logger: logger.Logger) {
        setTimeout(this.work, 1)
    }

    clearStale = () => {
        const now = Date.now()
        for (const [key, entity] of this.entities.entries()) {
            const diff = now - entity.stale
            this.logger.debug("stalecounter: " + entity.uid + " " + diff)
            if (diff > 0) {
                this.entities.delete(key)
                this.logger.info({ uid: entity.uid }, "entity stale: " + entity.uid)
            }
        }
    }

    work = async () => {
        setInterval(this.clearStale, 1000)

        for await (const entity of this.events) {
            // check if entity already exists
            if (!this.entities.get(entity.uid)) {
                this.logger.info({ entity }, "received new entity")
            } else {
                this.logger.info({ uid: entity.uid }, "entity update: " + entity.uid)
            }

            this.entities.set(entity.uid, entity)
        }
    }

    async stop() { }
}

export const cotParser: SubSystem<Config, CotParser> = {
    name: 'cotParser',
    init: async ({ logger, initSubsystem }) => {
        const connection = await initSubsystem(cotConnection)
        const events = generator.pipe(
            await connection.stream(),
            xmlStreamSplit,
            generator.map(XMLtoCOT),
        ) as AsyncGenerator<COT>

        return new CotParser(events, logger)
    }
}

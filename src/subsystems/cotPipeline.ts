import { generator, logger } from 'lsh-foundation'
import { XMLtoCOT, xmlStreamSplit } from '../cotParser';
import { SubSystem, RunningSubSystem, COT } from '../types';
import { EventEmitter } from "events";

export type Config = {}

export class CotPipeline extends EventEmitter implements RunningSubSystem {
    entities: Map<string, COT> = new Map()

    constructor(private readonly logger: logger.Logger) { super() }

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

    pull = async (stream: AsyncGenerator<COT>) => {
        setInterval(this.clearStale, 1000)

        for await (const entity of stream) {
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

export const cotPipeline: SubSystem<Config, CotPipeline> = {
    name: 'cotPipeline',
    init: async ({ logger }) => {
        return new CotPipeline(logger)
    }
}

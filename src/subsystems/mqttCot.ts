import * as Mqtt from './mqtt'
import { cotPipeline } from './cotPipeline'
import { COT, SubSystem, RunningSubSystem, Logger } from '../types';

export enum TranslatorType {
    Standard
}

export type Config = {
    enabled: boolean
    type?: TranslatorType
}

export class MqttTranslator implements RunningSubSystem {
    constructor(public readonly config: Config, public readonly logger: Logger) {
    }

    stop = () => { return Promise.resolve() }
}


export const mqttCot: SubSystem<Config, MqttTranslator> = {
    name: 'mqttCot',
    init: async ({ logger, config, initSubsystem }) => {
        const [mqtt, pipeline] = await Promise.all([initSubsystem(Mqtt.mqtt), initSubsystem(cotPipeline)])

        function pub(cot: COT) {
            mqtt.publish({
                cmd: 'publish',
                qos: 1,
                retain: true,
                topic: "cot/" + cot.uid,
                payload: JSON.stringify(cot)
            })
        }

        pipeline.entities.forEach((entity: COT) => {
            pub(entity)
        })

        pipeline.on("SET", pub)

        pipeline.on("DEL", (cot: COT) => {
            mqtt.publish({
                cmd: 'publish',
                qos: 1,
                retain: false,
                topic: "cot/" + cot.uid,
                payload: new Buffer(0)
            })
        })


        return new MqttTranslator(config, logger)
    }
}

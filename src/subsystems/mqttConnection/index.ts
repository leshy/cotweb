import Aedes from 'aedes'
import { IPublishPacket } from 'mqtt-packet';
import * as ws from 'websocket-stream'

import { RunningSubSystem, SubSystem, Logger } from '../../types';
import { webServer, WebServer } from '../webServer';

export type ConfigExternal = {
    host: string
    port: number
}

export type ConfigEmbedded = {
    TCPport?: number
}

export type Config = {
    enabled: boolean
    external?: ConfigExternal
    embedded?: ConfigEmbedded
}

export type SimpleCB = () => void;

export type DeliverFunc = (packet: IPublishPacket, callback: SimpleCB) => void;

export interface MQTT extends RunningSubSystem {
    publish: (packet: IPublishPacket) => any,
    subscribe: (topic: string, deliverFunc: DeliverFunc) => Promise<any>,
    unsubscribe: (topic: string, deliverfunc: DeliverFunc) => Promise<any>,
}

export class MqttServer implements MQTT {
    public readonly aedes: Aedes
    constructor(private readonly logger: Logger, private readonly config: ConfigEmbedded, server: WebServer) {
        this.aedes = new Aedes()
        // @ts-ignore
        ws.createServer({ server: server.http }, this.aedes.handle)
    }

    publish = (packet: IPublishPacket) =>
        new Promise((resolve, reject) =>
            this.aedes.publish(packet, (err?: Error) => err ? reject(err) : resolve(undefined)))

    subscribe = (topic: string, deliverFunc: DeliverFunc) =>
        new Promise((resolve, reject) => this.aedes.subscribe(topic, deliverFunc, (err?: Error) => err ? reject(err) : resolve(undefined)))

    unsubscribe = (topic: string, deliverfunc: DeliverFunc) =>
        new Promise((resolve, reject) => this.aedes.unsubscribe(topic, deliverfunc, (err?: Error) => err ? reject(err) : resolve(undefined)))

    async stop() { return this.aedes.close() }
}

export class MqttClient implements MQTT {
    constructor(private readonly logger: Logger, private readonly config: ConfigExternal) { }
    publish(packet: IPublishPacket) { return undefined }
    async subscribe(topic: string, deliverFunc: DeliverFunc) { return undefined }
    async unsubscribe(topic: string, deliverfunc: DeliverFunc) { return undefined }
    async stop() { return undefined }
}

export const mqtt: SubSystem<Config, MQTT> = {
    name: 'mqtt',
    init: async ({ logger, config, initSubsystem }) => {
        if (config.embedded) {
            const server = await initSubsystem(webServer)
            return new MqttServer(logger, config.embedded, server);
        }

        if (config.external) {
            return new MqttClient(logger, config.external);
        }

        throw new Error("No MQTT config provided")
    }
}

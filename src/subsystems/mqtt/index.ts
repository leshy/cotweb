import Aedes from 'aedes'
import { IPublishPacket } from 'mqtt-packet';
import * as ws from 'websocket-stream'

import { RunningSubSystem, SubSystem, Logger } from '../../types';
import { webServer, WebServer } from '../webServer';
import TcpServer from 'net'


export type ConfigClient = {
    enabled: boolean
    host: string
    port: number
}

export type ConfigServer = {
    enabled: boolean
    ws: {
        enabled: boolean
    },
    tcp: {
        enabled: boolean
        port?: number
    }
}

export type Config = {
    enabled: boolean
    client?: ConfigClient
    server?: ConfigServer
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
    public readonly http?: WebServer['http']
    public readonly tcp?: TcpServer.Server

    constructor(private readonly logger: Logger, private readonly config: ConfigServer, webServer?: WebServer) {

        this.aedes = new Aedes()

        if (config.ws && config.ws.enabled && webServer) {
            this.http = webServer.http
            // @ts-ignore
            ws.createServer({ server: webServer.http }, this.aedes.handle)
            logger.info(`MQTT WS server listening on port ${webServer.config.port} attached to web server`)
        }

        if (config.tcp && config.tcp.enabled) {
            this.tcp = TcpServer.createServer(this.aedes.handle)
            this.tcp.listen(config.tcp.port || 1883)
            logger.info(`MQTT TCP server listening on port ${config.tcp.port || 1883}`)
        }
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
    constructor(private readonly logger: Logger, private readonly config: ConfigClient) { }
    publish(packet: IPublishPacket) { return undefined }
    async subscribe(topic: string, deliverFunc: DeliverFunc) { return undefined }
    async unsubscribe(topic: string, deliverfunc: DeliverFunc) { return undefined }
    async stop() { return undefined }
}

export const mqtt: SubSystem<Config, MQTT> = {
    name: 'mqtt',
    init: async ({ logger, config, initSubsystem }) => {
        if (config.server && config.server.enabled) {
            if (config.server.ws && config.server.ws.enabled) {
                const server = await initSubsystem(webServer)
                return new MqttServer(logger, config.server, server);
            }
            return new MqttServer(logger, config.server);
        }

        if (config.client && config.client.enabled) {
            return new MqttClient(logger, config.client);
        }

        throw new Error("No MQTT config provided")
    }
}

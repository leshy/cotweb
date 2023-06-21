import sio from 'socket.io';
import { COT, SubSystem, RunningSubSystem } from '../types';
import { webServer } from './webServer';
import { cotPipeline } from './cotPipeline'

export type Config = {};

export class WebsocketServer implements RunningSubSystem {
    constructor(public readonly io: sio.Server) { }
    async stop() {
        this.io.close();
    }
}

export const webSocketServer: SubSystem<Config, WebsocketServer> = {
    name: 'webSocketServer',
    init: async ({ logger, initSubsystem }) => {

        const [server, pipeline] = await Promise.all([initSubsystem(webServer), initSubsystem(cotPipeline)])

        const io = new sio.Server(server.http);

        io.on('connection', (socket) => {
            logger.info('socket connected')
            socket.emit('msg', 'hi socket')

            pipeline.entities.forEach((entity: COT) => {
                console.log("EMIT SET", entity.uid)
                socket.emit('SET', entity)
            })

            socket.on('close', () => {
                logger.info('socket closed');
            })
        })

        pipeline.on('SET', (entity: COT) => { io.emit('SET', entity) })
        pipeline.on('DEL', (uid: string) => { io.emit('DEL', uid) })

        return new WebsocketServer(io);
    }
}

import sio from 'socket.io';
import { SubSystem, RunningSubSystem } from '../types';
import { httpServer } from './httpServer';

export type Config = {}
export type Deps = {
    httpServer: typeof httpServer
}

export class RunningWebsocketServer implements RunningSubSystem {
    constructor(public readonly io: sio.Server) { }
    async stop() {
        this.io.close()
    }
}

export const webSocketServer: SubSystem<Config, RunningWebsocketServer> = {
    name: 'webSocketServer',
    init: async ({ logger, initSubsystem }) => {
        const io = new sio.Server(await initSubsystem(httpServer))
        io.on('connection', (socket) => {
            logger.info("socket connected")

            io.emit("msg", "hello there")
            socket.emit("msg", "hi socket")

            socket.on('close', () => {
                logger.info("socket closed")
            })

        })
        return new RunningWebsocketServer(io)

    }
}

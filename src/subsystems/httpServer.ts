import * as path from 'path'
import express from "express";
import { createServer } from "http";
import { configSystem } from 'lsh-foundation'

import sio from 'socket.io';
import createError from 'http-errors'

import { SubSystem } from '../types';

export type Config = {
    port: number
}

export const httpServer: SubSystem<Config, {}> = {
    name: 'httpServer',
    init: async (_, logger, config, env) => {
        logger.info("initializing")

        const app = express();
        const httpServer = createServer(app);

        app.set('views', path.join(env.rootDir, 'web/views'));
        app.set('view engine', 'ejs');

        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));
        app.use(express.static(path.join(env.rootDir, 'web/static')));

        app.get(' test/', function(req, res, next) {
            res.render('index', { title: 'Express' });
        });

        // catch 404 and forward to error handler
        app.use(function(req, res, next) {
            next(createError(404));
        });

        //@ts-ignore
        app.use(function(err, req, res, next) {
            // set locals, only providing error in development
            res.locals.message = err.message;
            //@ts-ignore
            res.locals.error = config.env === configSystem.Env.dev ? err : {};
            // render the error page
            res.status(err.status || 500);
            res.render('error');
        });

        app.get('/', (req, res) => {
            res.send('Hello World!')
        })

        const io = new sio.Server(httpServer)
        // @ts-ignore
        io.on('connection', (socket) => {
            logger.info("socket connected")
            io.emit("msg", "hello there")
            socket.emit("msg", "hi socket")
            //socket.emit("event", sampleObject)
            // @ts-ignore
            socket.on('close', () => { });
        })

        httpServer.listen(config.port)

        return {
            stop: async () => {
                logger.info("closing")
                io.close()
                httpServer.close()
            }
        }
    }
}

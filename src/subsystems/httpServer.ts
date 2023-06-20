import * as path from 'path'
import express from "express";
import { createServer, Server } from "http";
import { configSystem } from 'lsh-foundation'
import createError from 'http-errors'

import { SubSystem, RunningSubSystem } from '../types';

export type Config = {
    port: number
}

export class HttpServer implements RunningSubSystem {
    constructor(public readonly http: Server) { }
    stop = async () => this.http.close()
}

export const httpServer: SubSystem<Config, HttpServer> = {
    name: 'httpServer',
    init: async ({ logger, config, env }) => {
        const app = express();
        const httpServer = createServer(app);

        app.set('views', path.join(env.rootDir, 'web/views'));
        app.set('view engine', 'ejs');

        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        logger.info("static path: " + path.join(env.rootDir, 'web/static'))
        app.use(express.static(path.join(env.rootDir, 'web/static')));

        app.get('/', function(req, res, next) {
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

        httpServer.listen(config.port)
        return new HttpServer(httpServer)
    }
}

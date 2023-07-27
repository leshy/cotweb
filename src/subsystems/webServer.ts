import * as path from 'path'
import express from "express";
import { createServer, Server } from "http";
import { configSystem } from 'lsh-foundation'
import createError from 'http-errors'

import { SubSystem, RunningSubSystem, Logger } from '../types';

/*
 * webServer just creates a simple http server serving /web/static and /web/views dirs
 * it is usually further specialized by other subsystems, like mqttServer implements websockets via webServer
 */



export type Config = {
    port: number
    clientside: {
        mapBoxKey: string
    }
}

export class WebServer implements RunningSubSystem {
    constructor(public readonly config: Config, public readonly logger: Logger, public readonly http: Server) { }
    start = async () => {
        this.http.listen(this.config.port || 3001)
        this.logger.info("http listening at " + this.config.port || 3001)

    }

    stop = async () => {
        this.http.close()
    }
}

export const webServer: SubSystem<Config, WebServer> = {
    name: 'webServer',
    init: async ({ logger, config, env }) => {
        const app = express();
        const server = createServer(app);

        app.set('views', path.join(env.rootDir, 'web/views'));
        app.set('view engine', 'ejs');

        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        logger.info("static path: " + path.join(env.rootDir, 'web/static'))
        app.use(express.static(path.join(env.rootDir, 'web/static')));

        app.get('/', function(req, res, next) {
            res.render('index', { title: 'Express', config: config.clientside })
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

        return new WebServer(config, logger, server)
    }
}

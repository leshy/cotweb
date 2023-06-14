//@ts-ignore
import { appCore, configSystem } from 'lsh-foundation'
import * as path from 'path'
import express from "express";
import { createServer } from "http";
import engine from 'engine.io';
//@ts-ignore
const createError = require('http-errors');

const root = path.join(__dirname, '../')

type Config = configSystem.AppConfig & {
  apiKey: string
}

export const init = async () => {
  const { logger, config } = await appCore.init<Config>({
    name: 'cot-websocket',
    configDir: path.join(root, 'config'),
    verbose: true,
    defaultConfig: {}
  })

  const app = express();
  const httpServer = createServer(app);

  app.set('views', path.join(config.rootDir, 'views'));
  app.set('view engine', 'ejs');

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(config.rootDir, 'static')));

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
    res.locals.error = config.env === configSystem.Env.dev ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });


  app.get('/', (req, res) => {
    res.send('Hello World!')
  })

  const sockets = engine.attach(httpServer, {})
  // @ts-ignore
  sockets.on('connection', (socket) => {
    console.log('connected')
    // @ts-ignore
    socket.on('message', (data) => {
      console.log(data)
      // @ts-ignore
      socket.on('close', () => { });
    })
  })

  httpServer.listen(3001)



}

init()

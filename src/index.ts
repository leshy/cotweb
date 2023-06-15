import { appCore, configSystem, generator } from 'lsh-foundation'
import * as path from 'path'
import express from "express";
import { createServer } from "http";
import engine from 'engine.io';
import { XML } from '@tak-ps/node-cot';
const nodeCot = require('@tak-ps/node-cot');
const createError = require('http-errors');


const root = path.join(__dirname, '../')

import * as connection from './connection'

type Config = configSystem.AppConfig & {
  apiKey: string
  cotServer: connection.Config
}




export const init = async () => {
  const { logger, config } = await appCore.init<Config>({
    name: 'cot-websocket',
    configDir: path.join(root, 'config'),
    verbose: true,
    defaultConfig: {
      cotServer: {
        tcp: {
          host: "localhost"
        }
      }
    }
  })


  const app = express();
  const httpServer = createServer(app);

  app.set('views', path.join(config.rootDir, 'web/views'));
  app.set('view engine', 'ejs');

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(config.rootDir, 'web/static')));

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
    console.log(config)
    //@ts-ignore
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
      socket.send('world')
      // @ts-ignore
      socket.on('close', () => { });
    })
  })

  httpServer.listen(3001)


  // const parser = async function*(input: AsyncGenerator<Buffer>) {
  //   const xml = new XMLParser();
  //   for await (const data of input) {
  //     const parsed = xml.parse(data)
  //     const event = parsed.event

  //     if (event.constructor === Array) {
  //       for (const entry of event) {
  //         yield entry
  //       }
  //     } else {
  //       yield event
  //     }
  //   }
  // }

  const parser2 = async function*(input: AsyncGenerator<Buffer>) {
    for await (const data of input) {
      const cot = new XML(data);
      yield cot.to_geojson()
    }
  }

  const events = generator.pipe(
    connection.connect(logger, config.cotServer),
    parser2)
  //@ts-ignore
  for await (const msg of events) {
    console.log("RCV", msg)
  }


}

init()


/*
  <event
    version="2.0"
    uid="ANDROID-cdc97979a5447ede"
    type="a-f-G-U-C"
    how="m-g"
    time="2023-06-15T13:01:52.511Z"
    start="2023-06-15T13:01:52.511Z"
    stale="2023-06-15T13:08:07.511Z">

    <point lat="45.809997" lon="15.973340" hae="177.1" ce="1.7" le="9999999.0"/>
    <detail>
      <takv os="31" version="4.6.1.7 (f1924d21).1657814638-CIV" device="ULEFONE POWER ARMOR 18T" platform="ATAK-CIV"/>
      <contact endpoint="*:-1:stcp" callsign="ivn"/>
      <uid Droid="ivn"/><precisionlocation altsrc="GPS" geopointsrc="GPS"/>
      <__group role="Team Member" name="Cyan"/>
      <status battery="17"/><track course="228.71486033115562" speed="0.0"/>
    </detail>
  </event


*/

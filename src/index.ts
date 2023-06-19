import { appCore, configSystem, generator } from 'lsh-foundation'
import * as path from 'path'
import express from "express";
import { createServer } from "http";
import sio from 'socket.io';
import createError from 'http-errors'
import * as geojson from 'geojson'
const root = path.join(__dirname, '../')
import * as cotParser from './cotParser'
import * as connection from './connection'

type Config = configSystem.AppConfig & {
  apiKey: string
  cotServer: connection.Config
}

// const sampleEvent = '<event version="2.0" uid="ANDROID-cdc97979a5447ede" type="a-f-G-U-C" how="m-g" time="2023-06-15T18:59:43.584Z" start="2023-06-15T18:59:43.584Z" stale="2023-06-15T19:05:58.584Z"><point lat="45.780938" lon="15.963918" hae="174.5" ce="1.7" le="9999999.0"/><detail><takv os="31" version="4.6.1.7 (f1924d21).1657814638-CIV" device="ULEFONE POWER ARMOR 18T" platform="ATAK-CIV"/><contact endpoint="*:-1:stcp" callsign="ivn"/><uid Droid="ivn"/><precisionlocation altsrc="GPS" geopointsrc="GPS"/><__group role="Team Member" name="Cyan"/><status battery="17"/><track course="164.11510169886566" speed="0.0"/></detail></event>'

// const sampleObject = {
//   "id": "14d9b9dd-89f7-44bd-9cb5-63f5543cae8c",
//   "type": "Feature",
//   "properties": {
//     "callsign": "R.14.163725",
//     "type": "a-h-G",
//     "how": "h-g-i-g-o",
//     "time": "2023-06-15T14:43:29.469Z",
//     "start": "2023-06-15T14:43:29.469Z",
//     "stale": "2024-06-14T14:43:29.469Z"
//   },
//   "geometry": {
//     "type": "Point",
//     "coordinates": [
//       "15.974357",
//       "15.974357",
//       "168.8"
//     ]
//   }
// }

// const cot = new XMLCot(sampleEvent);
// console.log(cot.to_geojson())

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

  const io = new sio.Server(httpServer)
  // @ts-ignore
  io.on('connection', (socket) => {
    console.log('connected')
    io.emit("msg", "hello there")
    socket.emit("msg", "hi socket")
    //socket.emit("event", sampleObject)
    // @ts-ignore
    socket.on('close', () => { });
  })

  httpServer.listen(3001)

  // const parser = async function*(input: AsyncGenerator<Buffer>) {
  //   for await (const data of input) {
  //     const parsed = xmljs.xml2js(data.toString(), { compact: true })
  //     //@ts-ignore
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

  const events = generator.pipe(
    connection.connect(logger, config.cotServer),
    cotParser.xmlStreamSplit,
    generator.map(cotParser.COTtoJSON)) as AsyncGenerator<geojson.Feature>

  for await (const msg of events) {
    console.log("RCV", msg)
    io.emit("event", msg)
  }


}

init()


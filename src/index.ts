import { appCore, generator } from 'lsh-foundation'
import * as path from 'path'
const root = path.join(__dirname, '../')
import * as types from './types'
import * as cotParser from './cotParser'
import * as connection from './connection'
import * as subSystemsDefs from './subsystems'
import { keys, find } from 'lodash'

export const init = async () => {
  const { logger, config } = await appCore.init<types.AppConfig>({
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

  const appEnv: types.AppEnv = {
    env: config.env,
    rootDir: config.rootDir,
    logger: logger,
  }


  const runningSubSystems: { [name: string]: types.RunningSubSystem } = {}

  const runSubSystems = async (subSystems: { [name: string]: types.SubSystem<any> }) => {
    for (const [name, subSystem] of Object.entries(subSystems)) {

      const batch: Promise<types.RunningSubSystem>[] = []
      const running = keys(runningSubSystems)

      if (!subSystem.deps) {
        batch.push(subSystem.init(logger.child({ subsystem: name }), config[name] || {}, appEnv))
      } else {



      }


      runningSubSystems[name] = subSystem(appEnv)
    }


  }




  const events = generator.pipe(
    connection.connect(logger, config.cotServer),
    cotParser.xmlStreamSplit,
    generator.map(cotParser.XMLtoCOT)) as AsyncGenerator<types.COT>

  for await (const msg of events) {
    console.log("RCV", msg)
    //io.emit("event", msg)
  }

}

init()


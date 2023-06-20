import * as path from 'path'
import { keys, filter, map, identity } from 'lodash'
import { ArgumentParser } from 'argparse'

// @ts-ignore
import { appCore } from 'lsh-foundation'

import * as types from './types'
import * as systems from './subsystems'

const { name, version } = require('../package.json')
const root = path.join(__dirname, '../')



const parser = new ArgumentParser({
  description: 'Argparse example'
})

parser.add_argument('-v', '--version', {
  action: 'version',
  version: name + ' ' + version
})

parser.add_argument('-s', '--systems', {
  nargs: '*',
  help: 'select which systems to initialize',
  type: 'string',
  choices: keys(systems)
})

const parsedArgs = parser.parse_args()

// would prefer to type this more explicitly
const argSystems: Array<string> = parsedArgs.systems

export const init = async () => {
  const { logger, config } = await appCore.init<types.AppConfig>({
    name: 'cot-websocket',
    configDir: path.join(root, 'config'),
    verbose: true,
    defaultConfig:
    {
      system: {
        httpServer: {
          port: 3001
        },

        cotConnection: {
          tcp: {
            host: "localhost",
          }
        }
      }
    }



  })

  const appEnv: types.AppEnv = {
    env: config.env,
    rootDir: config.rootDir,
    logger: logger,
  }

  const initializingSystems: { [key: string]: Promise<types.RunningSubSystem> } = {}

  const initSubsystem: types.InitSubsystem<any> = (subsystem: types.SubSystem<any, any>) => {
    const existing = initializingSystems[subsystem.name]
    if (existing) { return existing }

    const childLogger = logger.child({ subSystem: subsystem.name })
    return subsystem.init({
      logger: childLogger,
      config: config.system[subsystem.name] || {},
      env: appEnv,
      initSubsystem
    }).then((runningSubsystem) => {
      childLogger.info("init " + subsystem.name)
      return runningSubsystem
    })
  }

  const runSystems =
    argSystems && argSystems.length
      ? argSystems
      : filter(
        map(config.system, (config, systemName) =>
          config.enabled ? systemName : undefined
        ),
        identity
      )

  if (!runSystems.length) {
    logger.warn('no systems selected to run, exiting')
    return
  }

  logger.info(`running systems ${runSystems.join(', ')}`)


  await Promise.all(map(runSystems, (systemName) => {
    //@ts-ignore
    initSubsystem(systems[systemName])
  }))


  //await initSubsystem(systems.cotParser)
  //await initSubsystem(systems.webSocketServer)

  //const connection = subSystems.websocket.init({}, appEnv)

  // const events = generator.pipe(
  //   connection.connect(logger, config.cotServer),
  //   cotParser.xmlStreamSplit,
  //   generator.map(cotParser.XMLtoCOT)) as AsyncGenerator<types.COT>

  // for await (const msg of events) {
  //   console.log("RCV", msg)
  //   //io.emit("event", msg)
  // }

}

init()


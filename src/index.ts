import * as path from 'path'
import { keys, filter, map, identity, mapValues, flow } from 'lodash'
import { ArgumentParser } from 'argparse'

// @ts-ignore
import { appCore, utils } from 'lsh-foundation'

import * as types from './types'
import * as systems from './subsystems'

// @ts-ignore
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
        cotConnection: {
          enabled: true,
          tcp: {
            host: "localhost",
            port: 8087
          }
        },
        mqttCot: {
          enabled: true
        },
        mqtt: {
          enabled: true,
          server: {
            enabled: true,
            tcp: { enabled: true },
            ws: { enabled: true }
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
    const initializing = subsystem.init({
      logger: childLogger,
      config: config.system[subsystem.name] || {},
      env: appEnv,
      initSubsystem
    }).then((runningSubsystem) => {
      childLogger.info("init " + subsystem.name)
      return runningSubsystem
    })

    initializingSystems[subsystem.name] = initializing
    return initializing
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

  logger.info(`running systems: ${runSystems.join(', ')}`)

  await Promise.all(map(runSystems, (systemName) => {
    //@ts-ignore
    initSubsystem(systems[systemName])
  }))

  await utils.promise.propsResolve(
    mapValues(
      await utils.promise.propsResolve(initializingSystems),
      (subSystem: types.RunningSubSystem) =>
        subSystem.start ? subSystem.start() : undefined)
  )

  logger.info('all systems started')
}

init()


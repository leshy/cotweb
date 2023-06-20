import { appCore, generator } from 'lsh-foundation'
import * as path from 'path'
const root = path.join(__dirname, '../')
import * as types from './types'
import * as systems from './subsystems'

export const init = async () => {
  const { logger, config } = await appCore.init<types.AppConfig>({
    name: 'cot-websocket',
    configDir: path.join(root, 'config'),
    verbose: true,
    defaultConfig: {

      httpServer: {
        port: 3001
      },

      cotConnection: {
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

  const initializingSystems: { [key: string]: Promise<types.RunningSubSystem> } = {}

  const initSubsystem: types.InitSubsystem<any> = (subsystem: types.SubSystem<any, any>) => {
    const existing = initializingSystems[subsystem.name]
    if (existing) { return existing }

    const childLogger = logger.child({ subSystem: subsystem.name })
    return subsystem.init({
      logger: childLogger,
      config: config[subsystem.name] || {},
      env: appEnv,
      initSubsystem
    }).then((runningSubsystem) => {
      childLogger.info("init " + subsystem.name)
      return runningSubsystem
    })
  }

  await initSubsystem(systems.cotParser)
  await initSubsystem(systems.webSocketServer)

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


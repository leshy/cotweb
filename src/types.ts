import { configSystem, logger } from 'lsh-foundation'
import * as connection from './connection'

export type AppConfig = configSystem.AppConfig & {
    apiKey: string
    cotServer: connection.Config
}

export type AppEnv = {
    logger: logger.Logger,
    env: configSystem.Env,
    rootDir: string
}

export type Connection<EVENT> = AsyncGenerator<EVENT>

export type COT = {
    version: string
    uid: string
    type: string
    how: string
    time: Date
    start: Date
    stale: Date
    point: {
        lat: number
        lon: number
        hae: number
        ce: number
        le: number
    }
}


type Dependencies = { [name: string]: SubSystem<any, any> }

export type SubSystem<CONFIG, DEPS extends Dependencies> = {
    name: string
    deps?: DEPS
    init: (deps: { [name in keyof DEPS]: SubSystem<any, any> }, logger: logger.Logger, config: CONFIG, env: AppEnv) => Promise<RunningSubSystem>;
}

export interface RunningSubSystem {
    stop: () => Promise<any>
}

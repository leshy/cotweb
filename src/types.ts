import { configSystem, logger } from 'lsh-foundation'
import { RunningHttpServer } from './subsystems/httpServer'

export type AppConfig = configSystem.AppConfig & {
    apiKey: string
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

export type InitSubsystem<RUNNING extends RunningSubSystem> = (subSystem: SubSystem<any, RUNNING>) => Promise<RUNNING>

export type SubSystemInitArgs<CONFIG> = {
    logger: logger.Logger,
    config: CONFIG,
    env: AppEnv,
    initSubsystem: InitSubsystem<any>
}

export type SubSystem<CONFIG, RUNNING extends RunningSubSystem> = {
    name: string
    init: (args: SubSystemInitArgs<CONFIG>) => Promise<RUNNING>;
}

export interface RunningSubSystem {
    stop: () => Promise<any>
}

export type AppEnv = {
    logger: logger.Logger,
    env: configSystem.Env,
    rootDir: string,
}

import { cotEntity } from './cotParser/cotEntityEnum'
import { configSystem, logger } from 'lsh-foundation'

export type Logger = logger.Logger

export type AppConfig = configSystem.AppConfig & {
    apiKey: string
    system: { [name: string]: { enabled: boolean } }
}

export type Connection<EVENT> = AsyncGenerator<EVENT>

export type COT = {
    atype: cotEntity
    version: string
    uid: string
    type: string
    how: string
    time: number
    start: number
    stale: number
    point: {
        lat: number
        lon: number
        hae: number
        ce: number
        le: number
    }
    detail: {
        contact?: {
            callsign?: string
        }
    }
}

export type InitSubsystem<RUNNING extends RunningSubSystem> = (subSystem: SubSystem<any, RUNNING>) => Promise<RUNNING>

export type SubSystemInitArgs<CONFIG> = {
    logger: Logger,
    config: CONFIG,
    env: AppEnv,
    initSubsystem: InitSubsystem<any>
}

export type SubSystem<CONFIG, RUNNING extends RunningSubSystem> = {
    name: string
    init: (args: SubSystemInitArgs<CONFIG>) => Promise<RUNNING>;
}

export interface RunningSubSystem {
    start?: () => Promise<any>
    stop: () => Promise<any>
}

export type AppEnv = {
    logger: Logger,
    env: configSystem.Env,
    rootDir: string,
}

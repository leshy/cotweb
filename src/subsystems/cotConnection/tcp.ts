import net from 'net';
import * as types from './types'
import { logger } from 'lsh-foundation'
export type Config = net.SocketConnectOpts

export const defaultConfig: Config = {
    host: "localhost",
    port: 8087
}

export const connect = async (logger: logger.Logger, config: Config): Promise<types.Connection> => {
    const client = new net.Socket();

    // @ts-ignore
    client.connect({ ...defaultConfig, config }, function() {
        logger.info('TCP connection established with the COT server.')
        client.write('Hello, server.');
    })

    client.on('end', function() {
        return
    });

    return {
        // @ts-ignore
        stream: async function*() {
            for await (const chunk of client) {
                yield chunk
            }
        },
        close: async () => client.destroy()
    }
}

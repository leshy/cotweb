import net from 'net';
import * as types from './types'
import { logger } from 'lsh-foundation'
export type Config = net.SocketConnectOpts

export const defaultConfig: Config = {
    host: "localhost",
    port: 8087
}

export const connect = async function*(logger: logger.Logger, config: Config): types.Connection<any> {
    const client = new net.Socket();

    // @ts-ignore
    client.connect({ ...defaultConfig, config }, function() {
        logger.info('TCP connection established with the server.')
        client.write('Hello, server.');
    })

    client.on('end', function() {
        return
    });

    for await (const chunk of client) {
        logger.info(`Data in: ${chunk.toString()}.`);
        yield chunk
    }
}

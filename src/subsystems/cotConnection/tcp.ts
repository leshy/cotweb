import net from 'net';
import * as types from './types'
import { COT } from '../../types'
import { logger, generator } from 'lsh-foundation'
import { XMLtoCOT, xmlStreamSplit } from '../../cotParser'
export type Config = net.SocketConnectOpts

export const defaultConfig: Config = {
    host: "localhost",
    port: 8087
}

export const connect = async (logger: logger.Logger, config: Config): Promise<types.Connection> => {
    const client = new net.Socket();

    const cfg = { ...defaultConfig, ...config }
    console.log("CFG IS", cfg)
    // @ts-ignore
    client.connect(cfg, function() {
        logger.info('TCP connection established with the COT server.')
        client.write('Hello, server.');
    })

    client.on('end', function() {
        return
    });

    return {
        stream: (): AsyncGenerator<COT> =>
            generator.pipe(
                (async function*() {
                    for await (const chunk of client) {
                        yield chunk
                    }
                })(),
                xmlStreamSplit,
                generator.map(XMLtoCOT)
            ) as AsyncGenerator<COT>,

        close: async () => client.destroy()
    }
}

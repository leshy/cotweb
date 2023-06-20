export type Connection = {
    stream: () => AsyncGenerator<string>,
    close: () => Promise<any>,
}

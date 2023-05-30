//https://natsbyexample.com/examples/jetstream/limits-stream/node
import { NatsConnection, RetentionPolicy, StorageType, StreamConfig, StringCodec, connect } from 'nats';
import { configuration } from './config';
import fs from 'fs';

const server = {
    servers: configuration.serverUrl,
};

async function closeConnection(nc: NatsConnection, done: Promise<void | Error>) {
    await nc.close();
    // check if the close was OK
    const err = await done;
    if (err) {
        console.log('error closing:', err);
    }
}

(async () => {
    try {
        // to create a connection to a nats-server:
        const natsConn = await connect(server);
        console.log(`connected to ${natsConn.getServer()}`);
        // this promise indicates the client closed
        const done = natsConn.closed();

        // Jetstream setup
        const jsm = await natsConn.jetstreamManager();
        const streamName = "RuleRequest";
        try {
            await jsm.streams.find(streamName).then((s) => {
                console.log("Stream already exists");
            }, async (reason) => {
                const cfg: Partial<StreamConfig> = {
                    name: streamName,
                    subjects: [streamName],
                    retention: RetentionPolicy.Interest,
                    storage: StorageType.Memory,
                };
                await jsm.streams.add(cfg)
                console.log("Created the stream")

            });
        } catch (error) {
            const cfg: Partial<StreamConfig> = {
                name: streamName,
                subjects: [streamName],
                retention: RetentionPolicy.Interest,
            };
            await jsm.streams.add(cfg)
            console.log("Created the stream")
        }

        const js = natsConn.jetstream();
        // create a codec
        const sc = StringCodec();
        // Publish message to Subject
        let req: string = '';
        await new Promise<void>((resolve, reject) => fs.readFile('./RuleRequest.json', 'utf8', async (err, data) => {
            if (err) {
                console.error(err);
                await closeConnection(natsConn, done);
                reject(err);
            }
            req = data;
            resolve();
        })
        );

        console.log(`Publishing ${configuration.iterations} iterations with ${configuration.delay}ms delay`);
        for (let iteration = 0; iteration < configuration.iterations; iteration++) {
            const toSend = sc.encode(req);
            console.time('PublishRuleRequest');
            const resp = await js.publish("RuleRequest", toSend);
            console.timeEnd('PublishRuleRequest');
            // console.time('timer');
            if (configuration.delay > 0)
                await new Promise(resolve => setTimeout(resolve, configuration.delay));
            // console.timeEnd('timer');
        }
        console.log(`Published ${configuration.iterations} iterations`);

        // close the connection
        await closeConnection(natsConn, done);
    } catch (err) {
        console.log(`error connecting to ${JSON.stringify(server)}, with error ${err}`);
        throw err;
    }
})();




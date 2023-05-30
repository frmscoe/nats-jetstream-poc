import { NatsConnection, StringCodec, connect } from 'nats';
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
        const nc = await connect(server);
        console.log(`connected to ${nc.getServer()}`);
        // this promise indicates the client closed
        const done = nc.closed();
        // do something with the connection

        // create a codec
        const sc = StringCodec();
        // Publish message to Subject
        let req: string = '';
        await new Promise<void>((resolve, reject) => fs.readFile('./RuleRequest.json', 'utf8', async (err, data) => {
            if (err) {
                console.error(err);
                await closeConnection(nc, done);
                reject(err);
            }
            req = data;
            resolve();
        })
        );

        console.log(`Publishing ${configuration.iterations} iterations`);
        for (let iteration = 0; iteration < configuration.iterations; iteration++) {
            console.time('PublishRuleRequest');
            nc.publish("RuleRequest", sc.encode(req));
            console.timeEnd('PublishRuleRequest');
            // console.time('timer');
            if (configuration.delay > 0)
                await new Promise(resolve => setTimeout(resolve, configuration.delay));
            // console.timeEnd('timer');

        }
        console.log(`Published ${configuration.iterations} iterations`);
        // close the connection
        await closeConnection(nc, done);
    } catch (err) {
        console.log(`error connecting to ${JSON.stringify(server)}, with error ${err}`);
    }
})();




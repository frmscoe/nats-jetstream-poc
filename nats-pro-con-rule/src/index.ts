import { NatsConnection, StringCodec, connect } from 'nats';
import { configuration } from './config';

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
        // create a simple subscriber and iterate over messages
        // matching the subscription
        const sub = nc.subscribe("RuleRequest", { queue: "RuleRequestQueue" });
        (async () => {
            for await (const m of sub) {
                console.log(`${Date.now().toLocaleString()} [${sub.getProcessed()}]: ${m.data.length}`);
                let request = m.json() as any;
                request["ruleResult"] = {
                    "id": "003@1.0.0",
                    "cfg": "1.0.0",
                    "subRuleRef": "123",
                    "result": true,
                    "reason": "asdf"
                };
                const resp = JSON.stringify(request);
                console.time('PublishRuleRequest');
                nc.publish(`RuleResponse${configuration.functionName}`, sc.encode(resp));
                console.timeEnd('PublishRuleRequest');
            }
            console.log("subscription closed");
        })();

        // close the connection
        //await closeConnection(nc, done);
    } catch (err) {
        console.log(`error connecting to ${JSON.stringify(server)}`);
    }
})();


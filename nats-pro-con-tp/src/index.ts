import { Codec, NatsConnection, StringCodec, Subscription, connect } from 'nats';
import { configuration } from './config';

const server = {
    servers: configuration.serverUrl,
};

const typologyResult = {
    "id": "028@1.0",
    "cfg": "1.0",
    "result": 50,
    "ruleResults": [
        {
            "rule": "Rule_05_1.0",
            "result": true,
            "subRuleRef": "",
            "reason": ""
        },
        {
            "rule": "Rule_27_1.0",
            "result": true,
            "subRuleRef": "",
            "reason": ""
        },
        {
            "rule": "Rule_15_1.4",
            "result": true,
            "subRuleRef": "",
            "reason": ""
        }
    ]
}

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
        // matching the subscription and queue
        const rules = configuration.ruleName.split(',');
        let subs: Subscription[] = [];
        for (const ruleName of rules) {
            subs.push(nc.subscribe(`RuleResponse${ruleName}`, { queue: `RuleResponseQueue${configuration.functionName}` }));
        }
        (async () => {
            for (const sub of subs) {
                subscribe(sub, nc, sc);
            }
        })();

        // close the connection
        //await closeConnection(nc, done);
    } catch (err) {
        console.log(`error connecting to ${JSON.stringify(server)}`);
    }
})();

async function subscribe(sub: Subscription, nc: NatsConnection, sc: Codec<string>) {
    // this for loop will forever trigger every time a new message comes into the desired subject / queue
    for await (const m of sub) {
        console.log(`${Date.now().toLocaleString()} [${sub.getProcessed()}]: ${m.data.length}`);
        let request = m.json() as any;
        request["ruleResult"] = undefined;
        request["typologyResult"] = typologyResult;
        const resp = JSON.stringify(request);
        console.time('PublishRuleRequest');
        nc.publish(`TypologyResponse${configuration.functionName}`, sc.encode(resp));
        console.timeEnd('PublishRuleRequest');
    }
}


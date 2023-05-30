import { AckPolicy, ConsumerConfig, ConsumerMessages, DeliverPolicy, JetStreamClient, NatsConnection, ReplayPolicy, RetentionPolicy, StorageType, StreamConfig, StringCodec, connect } from 'nats';
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
        const natsConn = await connect(server);
        console.log(`connected to ${natsConn.getServer()}`);
        // this promise indicates the client closed
        const done = natsConn.closed();
        const functionName = configuration.functionName.replace(/\./g, '_',);

        // Jetstream setup
        const jsm = await natsConn.jetstreamManager();

        // Add consumer streams
        const consumerCfg: Partial<ConsumerConfig> = {
            ack_policy: AckPolicy.Explicit,
            durable_name: functionName,
        };
        const rules = configuration.ruleName.split(',');
        let consumerStreamNames: string[] = [];
        for (const ruleName of rules) {
            const consumerStreamName = `RuleResponse${ruleName.replace(/\./g, '_',)}`;
            consumerStreamNames.push(consumerStreamName);
            await jsm.consumers.add(consumerStreamName, consumerCfg);
            console.log(`Created the consumer for ${consumerStreamName}`)
        }

        // Add producer stream
        const producerStreamName = `TypologyResponse${functionName}`;
        await jsm.streams.find(producerStreamName).then((s) => {
            console.log("Producer stream already exists");
        }, async (reason) => {
            const cfg: Partial<StreamConfig> = {
                name: producerStreamName,
                subjects: [producerStreamName],
                retention: RetentionPolicy.Workqueue,
                storage: StorageType.Memory,
            };
            await jsm.streams.add(cfg)
            console.log("Created the producer stream")
        });

        const js = natsConn.jetstream();

        for (const consumerStreamName of consumerStreamNames) {
            // Get a consumer instance for each rule to listen for new messages
            const consumer = await js.consumers.get(consumerStreamName, functionName);
            // create a simple consumer and iterate over messages matching the subscription
            const sub = await consumer.consume({ max_messages: 1 });

            subscribe(sub, js, producerStreamName);
        }

        // close the connection
        // await closeConnection(natsConn, done);
    } catch (err) {
        console.log(`error connecting to ${JSON.stringify(server)}, with error: ${err}`);
        throw err;
    }
})();

async function subscribe(sub: ConsumerMessages, js: JetStreamClient, producerStreamName: string) {
    // create a codec
    const sc = StringCodec();

    for await (const m of sub) {
        console.log(`${Date.now().toLocaleString()} S:[${m.seq}] Q:[${m.subject}] [${m?.seq}]: ${m.data.length}`);
        let request = m.json() as any;
        request["ruleResult"] = undefined;
        request["typologyResult"] = typologyResult;
        const resp = JSON.stringify(request);
        console.time('PublishTypologyResponse');
        await js.publish(producerStreamName, sc.encode(resp));
        console.timeEnd('PublishTypologyResponse');
        m.ack();
    }
    console.log("subscription closed");

}


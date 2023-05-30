import { AckPolicy, ConsumerConfig, DeliverPolicy, NatsConnection, ReplayPolicy, RetentionPolicy, StorageType, StreamConfig, StringCodec, connect } from 'nats';
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
        const natsConn = await connect(server);
        console.log(`connected to ${natsConn.getServer()}`);
        // this promise indicates the client closed
        const done = natsConn.closed();
        const functionName = configuration.functionName.replace(/\./g, '_',);

        // Jetstream setup
        const jsm = await natsConn.jetstreamManager();

        // Add consumer streams
        const consumerStreamName = "RuleRequest";
        const consumerCfg: Partial<ConsumerConfig> = {
            ack_policy: AckPolicy.Explicit,
            durable_name: functionName,
        };
        await jsm.consumers.add(consumerStreamName, consumerCfg);

        const producerStreamName = `RuleResponse${functionName}`;
        await jsm.streams.find(producerStreamName).then((s) => {
            console.log("Producer stream already exists");
        }, async (reason) => {
            const cfg: Partial<StreamConfig> = {
                name: producerStreamName,
                subjects: [producerStreamName],
                retention: RetentionPolicy.Interest,
                storage: StorageType.Memory,
            };
            await jsm.streams.add(cfg)
            console.log("Created the producer stream")

        });

        console.log(`created the stream with functionName ${functionName}`)
        const js = natsConn.jetstream();

        // Get the consumer to listen to messages for
        const consumer = await js.consumers.get(consumerStreamName, functionName);

        // create a codec
        const sc = StringCodec();
        // create a simple consumer and iterate over messages matching the subscription
        const sub = await consumer.consume({ max_messages: 1 });//js.pullSubscribe("RuleRequest", { queue: "RuleRequestQueue" });
        (async () => {
            for await (const m of sub) {
                console.log(`${Date.now().toLocaleString()} S:[${m?.seq}] Q:[${m.subject}]: ${m.data.length}`);
                let request = m.json() as any;
                request["ruleResult"] = {
                    "id": "003@1.0.0",
                    "cfg": "1.0.0",
                    "subRuleRef": "123",
                    "result": true,
                    "reason": "asdf"
                };
                const resp = JSON.stringify(request);
                console.time('PublishRuleResponse');
                await js.publish(producerStreamName, sc.encode(resp));
                console.timeEnd('PublishRuleResponse');
                m.ack();
            }
            console.log("Consumer subscription closed");
            // close the connection
            await closeConnection(natsConn, done);
        })();

    } catch (err) {
        console.log(`error connecting to ${JSON.stringify(server)}, with error: ${err}`);
        throw err;
    }
})();


import { AckPolicy, ConsumerConfig, ConsumerMessages, DeliverPolicy, JetStreamClient, NatsConnection, ReplayPolicy, RetentionPolicy, StorageType, StreamConfig, StringCodec, connect } from 'nats';
import { configuration } from './config';

const server = {
    servers: configuration.serverUrl,
};

const tadpResult = {
    "evaluationID": "28bbe521-2649-459c-91f5-a3899656471b",
    "status": "NALT",
    "timestamp": "2023-05-23T23:05:52.733Z",
    "tadpResult": {
        "id": "001@1.0",
        "cfg": "1.0",
        "channelResult": [
            {
                "0": {
                    "result": 0,
                    "id": "001@1.0",
                    "cfg": "1.0",
                    "typologyResult": [
                        {
                            "id": "028@1.0",
                            "cfg": "1.0",
                            "result": 50,
                            "ruleResults": [
                                {
                                    "id": "003@1.0",
                                    "cfg": "1.0",
                                    "result": true,
                                    "reason": "asdf",
                                    "subRuleRef": "123"
                                },
                                {
                                    "id": "028@1.0",
                                    "cfg": "1.0",
                                    "result": true,
                                    "subRuleRef": "04",
                                    "reason": "The debtor is 50 or older"
                                }
                            ]
                        }
                    ]
                },
                "id": "",
                "cfg": "",
                "result": 0,
                "status": "",
                "typologyResult": []
            },
            {
                "result": 0,
                "id": "002@1.0",
                "cfg": "1.0",
                "typologyResult": [
                    {
                        "id": "028@1.0",
                        "cfg": "1.0",
                        "result": 100,
                        "ruleResults": [
                            {
                                "id": "003@1.0",
                                "cfg": "1.0",
                                "result": true,
                                "reason": "asdf",
                                "subRuleRef": "123"
                            },
                            {
                                "id": "028@1.0",
                                "cfg": "1.0",
                                "result": true,
                                "subRuleRef": "04",
                                "reason": "The debtor is 50 or older"
                            }
                        ]
                    }
                ],
                "status": "None"
            }
        ]
    }
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
        const consumerCfg: Partial<ConsumerConfig> = {
            ack_policy: AckPolicy.Explicit,
            durable_name: functionName,
        };
        console.log(`Durable Name: ${functionName}`);

        const typologies = configuration.typologyName.split(',');
        let consumerStreamNames: string[] = [];
        for (const typologyName of typologies) {
            const consumerStreamName = `TypologyResponse${typologyName.replace(/\./g, '_',)}`;
            consumerStreamNames.push(consumerStreamName);
            console.log(`Creating the consumer for ${consumerStreamName}`)
            await jsm.consumers.add(consumerStreamName, consumerCfg);
            console.log(`Created the consumer for ${consumerStreamName}`)
        }

        const js = natsConn.jetstream();

        for (const consumerStreamName of consumerStreamNames) {
            // Get a consumer instance for each rule to listen for new messages
            const consumer = await js.consumers.get(consumerStreamName, functionName);
            // create a simple consumer and iterate over messages matching the subscription
            const sub = await consumer.consume({ max_messages: 1 });

            subscribe(sub, js);
        }

        // close the connection
        // await closeConnection(natsConn, done);
    } catch (err) {
        console.log(`error connecting to ${JSON.stringify(server)}, with error: ${err}`);
        throw err;
    }
})();

async function subscribe(sub: ConsumerMessages, js: JetStreamClient) {
    for await (const m of sub) {
        console.log(`${Date.now().toLocaleString()} P:[${sub.getProcessed()}] S:[${m.seq}]  Q:[${m.subject}] Data Lenght: ${m.data.length}`);
        let request = m.json() as any;
        request["typologyResult"] = undefined;
        request["tadpResult"] = tadpResult;
        const resp = JSON.stringify(request);
        m.ack();
    }
    console.log("subscription closed");
}


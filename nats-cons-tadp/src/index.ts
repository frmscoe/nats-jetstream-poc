import { Codec, NatsConnection, StringCodec, Subscription, connect } from 'nats';
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
        const nc = await connect(server);
        console.log(`connected to ${nc.getServer()}`);
        // this promise indicates the client closed
        const done = nc.closed();
        // do something with the connection

        // create a codec
        const sc = StringCodec();
        // create a simple subscriber and iterate over messages
        // matching the subscription and queue
        const typologies = configuration.typologies.split(',');
        let subs: Subscription[] = [];
        for (const typologyName of typologies) {
            subs.push(nc.subscribe(`TypologyResponse${typologyName}`, { queue: `TypologyResponseQueue${configuration.functionName}` }));
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
        console.log(`${Date.now().toLocaleString()} [${sub.getProcessed()}] Q:[${m.subject}] Data Lenght: ${m.data.length}`);
        let request = m.json() as any;
        request["typologyResult"] = undefined;
        request["tadpResult"] = tadpResult;
        const resp = JSON.stringify(request);
    }
}


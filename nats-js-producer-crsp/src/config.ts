import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file into process.env if it exists. This is convenient for running locally.
dotenv.config({
    path: path.resolve(__dirname, '../.env'),
});

export interface IConfig {
    serverUrl: string;
    iterations: number;
    env: string;
    delay: number;
}

export const configuration: IConfig = {
    iterations: parseInt(process.env.ITERATIONS!, 10),
    env: <string>process.env.NODE_ENV,
    serverUrl: <string>process.env.SERVER_URL,
    delay: parseInt(process.env.DELAY!, 10),
}
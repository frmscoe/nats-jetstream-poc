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
    functionName: string;
    delay: number;
    typologies: string;
}

export const configuration: IConfig = {
    iterations: parseInt(process.env.ITERATIONS!, 10) || 1000,
    env: <string>process.env.NODE_ENV,
    serverUrl: <string>process.env.SERVER_URL,
    functionName: <string>process.env.FUNCTION_NAME,
    delay: parseInt(process.env.DELAY!, 10) || 100,
    typologies: <string>process.env.TYPOLOGIES,
}
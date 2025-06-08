import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { config } from './utils/config';
import MarketDataRouter from './route/v1/Upstox';
import AuthRouter from './route/v1/Auth';
import { connectToDatabase } from './managers/dbManager';
import { errorHandler } from './middleware/ErrorHandlerMiddleware';
import helmet from 'helmet';

dotenv.config();
const app = express();
const PORT = config.port;
app.use(helmet());
app.use(express.json());
app.use('/api/marketdatabroker/v1', MarketDataRouter);
app.use('/api/auth/v1', AuthRouter);
app.get('/healthcheck', (req: Request, res: Response) => {
    res.status(200).send('OK');
});

app.use(errorHandler);
app.listen(PORT, async () => {
    await connectToDatabase();
    console.log(
        `Server is running on port ${PORT} on ${config.mode ? 'Development' : 'Production'} mode`,
    );
});

// TODO
// Addeding Error Class
// Adding integration module where broker API keys, secret's and redirectURI can be added and access_code after OAuth Should be added
// Subscribing the websocket by getting the instrument Name[]
// Adding Socket IO for client side
// Build a intergration module to store brokers
// Implement Reconnection Logic in Upstox Ws
// Get the access code, bearer token client id, client secret and redirect uri from db

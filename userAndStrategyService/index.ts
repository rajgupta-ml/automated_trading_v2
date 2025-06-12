import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { config } from './utils/config';
import MarketDataRouter from './route/v1/broker';
import AuthRouter from './route/v1/Auth';
import { connectToDatabase } from './Services/dbService';
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
// Adding Socket IO for client side interaction
// Building a rule engine
// Candle conversion engine
// Adding formula like RSI and all those thing
// Implement Reconnection Logic in Upstox Ws
// Paper Trading Feature (Building Order book, Building MTM)

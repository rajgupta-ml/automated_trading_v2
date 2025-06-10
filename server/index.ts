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
// Adding the OHLC to redis and then into BullMQ a service to pooling the queue and save it into mongodb
// Adding Socket IO for client side
// Implement Reconnection Logic in Upstox Ws
// Add CRUD operation for integration

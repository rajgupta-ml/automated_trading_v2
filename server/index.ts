import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { config } from './utils/config';
import MarketDataRouter from './route/v1/Upstox';
import AuthRouter from './route/v1/Auth';
import { connectToDatabase } from './managers/dbManager';

dotenv.config();
const app = express();
const PORT = config.port;

app.use(express.json());
app.use('/api/marketdatabroker/v1', MarketDataRouter);
app.use('/api/auth/v1', AuthRouter);
app.get('/healthcheck', (req: Request, res: Response) => {
    res.status(200).send('OK');
});

app.listen(PORT, async () => {
    await connectToDatabase();
    console.log(
        `Server is running on port ${PORT} on ${config.mode ? 'Development' : 'Production'} mode`,
    );
});

// TODO
// Addeding Error Class and preetier.rc

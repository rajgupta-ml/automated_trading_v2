import express from 'express';
import UpstoxManager from '../../managers/upstoxManager';
import { UpstoxController } from '../../controller/UpstoxController';
import { authenticateJWT } from '../../middleware/AuthMiddleware';

const upstoxClient = new UpstoxManager();
const controller = new UpstoxController(upstoxClient);

const MarketDataRouter = express.Router();

MarketDataRouter.get('/auth-url', authenticateJWT, controller.getAuthUrl);
MarketDataRouter.get(
    '/access-code',
    authenticateJWT,
    controller.getAccessToken,
);
MarketDataRouter.get(
    '/establish-websocket',
    authenticateJWT,
    controller.establishWebsocket,
);
MarketDataRouter.get(
    '/search/instrument',
    authenticateJWT,
    controller.getInstrumentsDetails,
);
MarketDataRouter.post(
    '/subscribe/instrument',
    authenticateJWT,
    controller.userSubscribeInstrument,
);

export default MarketDataRouter;

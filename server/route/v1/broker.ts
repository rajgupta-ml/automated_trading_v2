import express from 'express';
import { BrokerController } from '../../controller/brokerController';
import {
    authenticateJWT,
    authenticateSessionToken,
} from '../../middleware/AuthMiddleware';
import { BrokerCredintialService } from '../../Services/brokerCredintialServices';
import { IntegrationFactory } from '../../factory/integrationFactory';

const integrationFactory = new IntegrationFactory();
const brokerCredintialService = new BrokerCredintialService(integrationFactory);
const controller = new BrokerController(brokerCredintialService);

const MarketDataRouter = express.Router();

MarketDataRouter.get(
    '/:broker/auth-url',
    authenticateJWT,
    controller.getAuthUrl,
);
MarketDataRouter.get(
    '/:broker/access-code',
    authenticateSessionToken,
    controller.getAccessToken,
);
MarketDataRouter.get(
    '/:broker/establish-websocket',
    authenticateJWT,
    controller.establishWebsocket,
);
MarketDataRouter.get(
    '/:broker/search/instrument',
    authenticateJWT,
    controller.getInstrumentsDetails,
);
MarketDataRouter.post(
    '/:broker/subscribe/instrument',
    authenticateJWT,
    controller.userSubscribeInstrument,
);

MarketDataRouter.post(
    '/:broker/add/',
    authenticateJWT,
    controller.addIntegration,
);

export default MarketDataRouter;

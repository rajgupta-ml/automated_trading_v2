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

// Instrument Subscription
MarketDataRouter.post(
    '/:broker/subscribe/instrument',
    authenticateJWT,
    controller.userSubscribeInstrument,
);

MarketDataRouter.delete(
    '/:broker/unsubscribe/instrument',
    authenticateJWT,
    controller.deleteSubscribedInstrument,
);

// Integration Crud
MarketDataRouter.post(
    '/:broker/add/',
    authenticateJWT,
    controller.addIntegration,
);
MarketDataRouter.patch(
    '/:broker/update',
    authenticateJWT,
    controller.updateIntegration,
);

MarketDataRouter.delete(
    '/:broker/',
    authenticateJWT,
    controller.deleteIntegration,
);

export default MarketDataRouter;

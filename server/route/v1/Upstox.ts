import express from "express";
import UpstoxManager from "../../managers/upstoxManager";
import { UpstoxController } from "../../controller/UpstoxController";

const upstoxClient = new UpstoxManager();
const controller = new UpstoxController(upstoxClient);

const MarketDataRouter = express.Router();


MarketDataRouter.get("/auth-url", controller.getAuthUrl);
MarketDataRouter.get("/access-code", controller.getAccessToken);
MarketDataRouter.get("/establish-websocket", controller.establishWebsocket);
MarketDataRouter.get("/search/instrument",controller.getInstrumentsDetails)


export default MarketDataRouter;

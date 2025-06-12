// Building a Smart connection Pool
// Talking to brokerService to eastablish connection 
import express from "express"
import dotenv from "dotenv";
import {config} from "./utils/config"
import authRouter from "./routes/v1/authRoute";
import { errorHandler } from "./middleware/ErrorHandlerMiddleware";

const app = express();
app.use(express.json());

app.use("/api/auth/v1", authRouter)

app.get("/healthCheck" , (req, res) => {
    res.status(200).send("ok");
})


app.use(errorHandler);
app.listen(config.express.port, () => {
    console.log(`marketDataService is running at port : ${config.express.port}`)
})
import { Router } from "express";
import { AuthController } from "../../controller/authController";

const authRouter = Router();

const authController = new AuthController();
authRouter.get("/generate-jwt", authController.generateJWT);


export default authRouter
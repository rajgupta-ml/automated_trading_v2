import express from 'express';
import { AuthController } from '../../controller/AuthenticationController';
import { authenticateJWT } from '../../middleware/AuthMiddleware';

const AuthRouter = express.Router();
const authController = new AuthController();

// Bind the methods properly
AuthRouter.post('/signup', authController.signup.bind(authController));
AuthRouter.post('/login', authController.login.bind(authController));
AuthRouter.put(
    '/update',
    authenticateJWT,
    authController.update.bind(authController),
);
AuthRouter.delete(
    '/delete',
    authenticateJWT,
    authController.delete.bind(authController),
);

export default AuthRouter;

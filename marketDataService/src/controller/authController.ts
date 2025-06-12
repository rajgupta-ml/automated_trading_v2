import type { NextFunction, Request, Response } from "express";
import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
  type Secret,
  type SignOptions,
} from "jsonwebtoken";
import { config } from "../utils/config";
import { AuthError } from "../error/authError";
import { ErrorMessages } from "../enums/message";
import { HttpStatusCode } from "../enums/httpStatusCode";

export class AuthController {
  generateJWT = (req: Request, res: Response, next: NextFunction) => {
    const serviceSecret = config.jwt.secret;
    const id: String | undefined = req.service?.id;

    if (id !== config.service.id) {
      return next(
        new AuthError(
          ErrorMessages.INVALID_SERVICE_ID,
          Number(HttpStatusCode.UNAUTHORIZED),
        ),
      );
    }
    const payload = {
      service: config.service.name,
      serviceId: config.service.id,
    };

    const expiresIn = config.jwt.expiresIn as SignOptions;
    try {
      const token = jwt.sign(payload, serviceSecret, expiresIn);
      res.status(200).json({
        success: true,
        token,
      });
    } catch (error) {
      console.error("Error generating JWT:", error);

      next(new AuthError(ErrorMessages.INTERNAL_SERVER_ERROR, 500));
    }
  };

  public verifyJWT(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    const serviceSecret: Secret = config.jwt.secret; // Explicitly type as Secret

    if (!serviceSecret) {
      console.error("JWT Secret is not configured for verification.");
      return next(new AuthError(ErrorMessages.INTERNAL_SERVER_ERROR, 500));
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AuthError(ErrorMessages.TOKEN_NOT_PROVIDED, 401));
    }
    const token = authHeader.split(" ")[1];

    if (!token) {
      return next(
        new AuthError(
          ErrorMessages.TOKEN_NOT_PROVIDED,
          Number(HttpStatusCode.UNAUTHORIZED),
        ),
      );
    }
    try {
      const decoded = jwt.verify(token, serviceSecret) as {
        service: { name: string; id: string };
        iat: number;
        exp: number;
      };

      req.service = decoded.service;

      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return next(new AuthError(ErrorMessages.TOKEN_EXPIRED, 401));
      } else if (error instanceof JsonWebTokenError) {
        return next(new AuthError(ErrorMessages.INVALID_TOKEN, 403));
      } else {
        console.error("Error verifying JWT:", error);
        return next(new AuthError(ErrorMessages.INTERNAL_SERVER_ERROR, 500));
      }
    }
  }
}

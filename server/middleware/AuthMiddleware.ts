import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import { AuthService } from '../Services/authService';
import { AuthError } from '../error/authError';
import { ErrorMessages } from '../enums/messages';
import { HttpStatusCode } from '../utils/httpStatusCode';
import { verifySessionToken } from '../Models/SessionToken';

const authService = new AuthService();
const jwtSecret = config.jwt.secret as string;

export const authenticateJWT = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthError(
            ErrorMessages.UNAUTHORIZED_ACCESS,
            HttpStatusCode.UNAUTHORIZED,
        );
    }

    const token = authHeader.split(' ')[1] as string;

    try {
        const blacklisted = await authService.isTokenBlacklisted(token);
        if (blacklisted) {
            throw new AuthError(
                ErrorMessages.TOKEN_INVALIDATED,
                HttpStatusCode.UNAUTHORIZED,
            );
        }

        const payload = jwt.verify(token, jwtSecret);
        (req as any).user = payload;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            await authService.blacklistToken(token, new Date());
            throw new AuthError(
                ErrorMessages.TOKEN_INVALIDATED,
                HttpStatusCode.UNAUTHORIZED,
            );
        }

        if (error instanceof AuthError) {
            throw error;
        }
        throw new AuthError(
            ErrorMessages.INTERNAL_SERVER_ERROR,
            HttpStatusCode.INTERNAL_SERVER_ERROR,
        );
    }
};

export const authenticateSessionToken = async (
    req: Request,
    response: Response,
    next: NextFunction,
) => {
    const state = req.query.state as string;

    if (!state) {
        return next(
            new AuthError(
                ErrorMessages.UNAUTHORIZED_ACCESS,
                HttpStatusCode.UNAUTHORIZED,
            ),
        );
    }

    try {
        const userId = await verifySessionToken(state);
        (req as any).user = { userId };
        next();
    } catch (error) {
        if (error instanceof AuthError) {
            return next(error);
        }

        return next(
            new AuthError(
                ErrorMessages.INTERNAL_SERVER_ERROR,
                HttpStatusCode.INTERNAL_SERVER_ERROR,
            ),
        );
    }
};

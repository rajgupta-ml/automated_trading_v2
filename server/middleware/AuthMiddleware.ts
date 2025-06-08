import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import { AuthService } from '../managers/AuthManager';
import { ApiError } from '../error/apiError';
import { ErrorMessages } from '../utils/messages';
import { HttpStatusCode } from '../utils/httpStatusCode';

const authService = new AuthService();
const jwtSecret = config.jwt.secret as string;

export const authenticateJWT = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(
            ErrorMessages.UNAUTHORIZED_ACCESS,
            HttpStatusCode.UNAUTHORIZED,
        );
    }

    const token = authHeader.split(' ')[1] as string;

    try {
        // Check if token is blacklisted
        const blacklisted = await authService.isTokenBlacklisted(token);
        if (blacklisted) {
            throw new ApiError(
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
            throw new ApiError(
                ErrorMessages.TOKEN_INVALIDATED,
                HttpStatusCode.UNAUTHORIZED,
            );
        }
        throw new ApiError(
            ErrorMessages.INTERNAL_SERVER_ERROR,
            HttpStatusCode.INTERNAL_SERVER_ERROR,
        );
    }
};

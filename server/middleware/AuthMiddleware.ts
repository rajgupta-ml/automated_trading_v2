import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import { AuthService } from '../managers/AuthManager';

const authService = new AuthService();
const jwtSecret = config.jwt.secret as string;

export const authenticateJWT = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            type: 'error',
            message: 'Authorization token required',
        });
        return; // Important: use return instead of return res.status()
    }

    const token = authHeader.split(' ')[1] as string;

    try {
        // Check if token is blacklisted
        const blacklisted = await authService.isTokenBlacklisted(token);
        if (blacklisted) {
            res.status(401).json({
                type: 'error',
                message: 'Token expired or invalidated',
            });
            return; // Important: use return instead of return res.status()
        }

        const payload = jwt.verify(token, jwtSecret);
        // Attach user info to req for downstream use if needed
        (req as any).user = payload;
        next(); // Call next() to continue to the next middleware/route handler
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            // Token expired - blacklist it in DB
            await authService.blacklistToken(token, new Date());
            res.status(401).json({ type: 'error', message: 'Token expired' });
            return; // Important: use return instead of return res.status()
        }
        res.status(401).json({ type: 'error', message: 'Invalid token' });
        return; // Important: use return instead of return res.status()
    }
};

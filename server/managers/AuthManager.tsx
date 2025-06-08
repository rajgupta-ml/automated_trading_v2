import jwt from 'jsonwebtoken';
import User, { type IUser } from '../Models/User';
import ExpiredToken from '../Models/ExpiredToken';
import { config } from '../utils/config';
import crypto from 'crypto';
import UpstoxManager from './upstoxManager';
import { ApiError } from '../error/apiError';
import { ErrorMessages } from '../utils/messages';
import { HttpStatusCode } from '../utils/httpStatusCode';
import mongoose from 'mongoose';

export class AuthService {
    private algo = config.crypto.algorithm;
    private secret: crypto.BinaryLike = config.crypto.secret || '';
    private jwtSecret = config.jwt.secret as string;

    private throwInternalError(error: unknown, context: string): never {
        console.error(`AuthService Internal Error in ${context}:`, error);
        throw new ApiError(
            ErrorMessages.INTERNAL_SERVER_ERROR,
            HttpStatusCode.INTERNAL_SERVER_ERROR,
        );
    }

    private hashPassword(password: string): string {
        try {
            return crypto
                .createHmac(this.algo, this.secret)
                .update(password)
                .digest('hex');
        } catch (hashError) {
            this.throwInternalError(hashError, 'hashPassword');
        }
    }

    async signup(username: string, password: string): Promise<IUser> {
        try {
            const hashedPassword = this.hashPassword(password);
            const user = new User({ username, password: hashedPassword });
            return await user.save();
        } catch (error: any) {
            if (error.code === 11000) {
                if (error.keyPattern && error.keyPattern.username) {
                    throw new ApiError(
                        ErrorMessages.USERNAME_ALREADY_EXISTS,
                        HttpStatusCode.CONFLICT,
                    );
                }
                throw new ApiError(
                    ErrorMessages.RESOURCE_ALREADY_EXISTS,
                    HttpStatusCode.CONFLICT,
                );
            }
            if (error instanceof mongoose.Error.ValidationError) {
                const messages = Object.values(error.errors)
                    .map((err: any) => err.message)
                    .join(', ');
                throw new ApiError(
                    ErrorMessages.VALIDATION_ERROR.replace(
                        '{details}',
                        messages,
                    ),
                    HttpStatusCode.BAD_REQUEST,
                );
            }
            if (error instanceof mongoose.Error) {
                this.throwInternalError(error, 'MongoDB signup operation');
            }
            this.throwInternalError(error, 'signup');
        }
    }

    async login(
        username: string,
        password: string,
    ): Promise<{ token: string }> {
        try {
            const user = await User.findOne({ username });

            if (!user) {
                throw new ApiError(
                    ErrorMessages.INVALID_CREDENTIALS,
                    HttpStatusCode.UNAUTHORIZED,
                );
            }

            const hashedPassword = this.hashPassword(password);
            if (user.password !== hashedPassword) {
                throw new ApiError(
                    ErrorMessages.INVALID_CREDENTIALS,
                    HttpStatusCode.UNAUTHORIZED,
                );
            }

            const token = jwt.sign(
                { userId: user._id, username: user.username },
                this.jwtSecret,
                { expiresIn: '1d' },
            );

            return { token };
        } catch (error: any) {
            if (error instanceof ApiError) {
                throw error;
            }
            if (error instanceof mongoose.Error) {
                this.throwInternalError(error, 'MongoDB login operation');
            }
            this.throwInternalError(error, 'login');
        }
    }

    async update(username: string, updates: Partial<IUser>): Promise<IUser> {
        try {
            const updateFields: Partial<IUser> = { ...updates };
            if (updates.password) {
                updateFields.password = this.hashPassword(updates.password);
            }

            const updatedUser = await User.findOneAndUpdate(
                { username },
                updateFields,
                { new: true },
            );

            if (!updatedUser) {
                throw new ApiError(
                    ErrorMessages.USER_NOT_FOUND,
                    HttpStatusCode.NOT_FOUND,
                );
            }
            return updatedUser;
        } catch (error: any) {
            if (error instanceof ApiError) {
                throw error;
            }
            if (error.code === 11000) {
                throw new ApiError(
                    ErrorMessages.RESOURCE_ALREADY_EXISTS,
                    HttpStatusCode.CONFLICT,
                );
            }
            if (error instanceof mongoose.Error.ValidationError) {
                const messages = Object.values(error.errors)
                    .map((err: any) => err.message)
                    .join(', ');
                throw new ApiError(
                    ErrorMessages.VALIDATION_ERROR.replace(
                        '{details}',
                        messages,
                    ),
                    HttpStatusCode.BAD_REQUEST,
                );
            }
            if (error instanceof mongoose.Error.CastError) {
                throw new ApiError(
                    ErrorMessages.INVALID_DATA_FORMAT, // Or a more specific message if context allows
                    HttpStatusCode.BAD_REQUEST,
                );
            }
            if (error instanceof mongoose.Error) {
                this.throwInternalError(error, 'MongoDB update operation');
            }
            this.throwInternalError(error, 'update');
        }
    }

    async delete(username: string): Promise<boolean> {
        try {
            const userToDelete = await User.findOne({ username });
            if (!userToDelete) {
                throw new ApiError(
                    ErrorMessages.USER_NOT_FOUND,
                    HttpStatusCode.NOT_FOUND,
                );
            }

            const userId = userToDelete._id;
            const result = await User.deleteOne({ username });

            if (result.deletedCount === 0) {
                this.throwInternalError(
                    new Error('User found but not deleted'),
                    'delete',
                );
            }

            try {
                await UpstoxManager.deleteUserSubscription(userId);
            } catch (upstoxError) {
                console.error(
                    `Warning: Failed to delete Upstox subscription for user ${userId}:`,
                    upstoxError,
                );
            }

            return true;
        } catch (error: any) {
            if (error instanceof ApiError) {
                throw error;
            }
            if (error instanceof mongoose.Error) {
                this.throwInternalError(error, 'MongoDB delete operation');
            }
            this.throwInternalError(error, 'delete');
        }
    }

    async blacklistToken(token: string, expiredAt: Date): Promise<void> {
        try {
            const expiredToken = new ExpiredToken({ token, expiredAt });
            await expiredToken.save();
        } catch (error: any) {
            if (error.code === 11000) {
                console.warn(
                    'Attempted to blacklist an already blacklisted token:',
                    token,
                );
            }
            if (error instanceof mongoose.Error) {
                this.throwInternalError(
                    error,
                    'MongoDB blacklistToken operation',
                );
            }
            this.throwInternalError(error, 'blacklistToken');
        }
    }

    async isTokenBlacklisted(token: string): Promise<boolean> {
        try {
            const found = await ExpiredToken.findOne({ token });
            return !!found;
        } catch (error: any) {
            if (error instanceof mongoose.Error) {
                this.throwInternalError(
                    error,
                    'MongoDB isTokenBlacklisted operation',
                );
            }
            this.throwInternalError(error, 'isTokenBlacklisted');
        }
    }
}

// AuthController.ts
import type { NextFunction, Request, Response } from 'express';
import { AuthService } from '../Services/authService';
import type { IUser } from '../Models/User';
import { ApiError } from '../error/apiError';
import { ErrorMessages, SuccessMessages } from '../enums/messages';
import { HttpStatusCode } from '../utils/httpStatusCode';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    async signup(
        request: Request,
        response: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const { username, password } = request.body;

            if (!username) {
                return next(
                    new ApiError(
                        ErrorMessages.USERNAME_REQUIRED,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            if (!password) {
                return next(
                    new ApiError(
                        ErrorMessages.PASSWORD_REQUIRED,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            const user = (await this.authService.signup(
                username,
                password,
            )) as IUser;

            response.status(Number(HttpStatusCode.CREATED)).json({
                success: true,
                message: SuccessMessages.USER_SIGNED_UP,
                user: {
                    userId: user._id,
                    username: user.username,
                },
            });
        } catch (error) {
            if (error instanceof ApiError) {
                return next(error);
            }
            return next(
                new ApiError(
                    ErrorMessages.INTERNAL_SERVER_ERROR,
                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                ),
            );
        }
    }

    async login(
        request: Request,
        response: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const { username, password } = request.body;

            if (!username && !password) {
                return next(
                    new ApiError(
                        ErrorMessages.USERNAME_AND_PASSWORD_REQUIRED,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            const result = await this.authService.login(username, password);

            if (!result) {
                return next(
                    new ApiError(
                        ErrorMessages.INVALID_CREDENTIALS,
                        HttpStatusCode.UNAUTHORIZED,
                    ),
                );
            }

            response.status(Number(HttpStatusCode.OK)).json({
                success: true,
                message: SuccessMessages.LOGIN_SUCCESSFUL,
                token: result.token,
            });
        } catch (error) {
            if (error instanceof ApiError) {
                return next(error);
            }
            return next(
                new ApiError(
                    ErrorMessages.INTERNAL_SERVER_ERROR,
                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                ),
            );
        }
    }

    async update(
        request: Request,
        response: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const { username, password, apiKey, apiSecret, redirectUri } =
                request.body;

            if (!username) {
                return next(
                    new ApiError(
                        ErrorMessages.USERNAME_REQUIRED,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            const updateFields: Partial<IUser> = {};
            if (password) updateFields.password = password;

            if (Object.keys(updateFields).length === 0) {
                return next(
                    new ApiError(
                        ErrorMessages.UPDATE_FIELDS_REQUIRED,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            const updatedUser = await this.authService.update(
                username,
                updateFields,
            );

            if (!updatedUser) {
                return next(
                    new ApiError(
                        ErrorMessages.USER_NOT_FOUND,
                        HttpStatusCode.NOT_FOUND,
                    ),
                );
            }

            response.status(Number(HttpStatusCode.OK)).json({
                success: true,
                message: SuccessMessages.USER_UPDATED,
                user: {
                    userId: updatedUser._id,
                    username: updatedUser.username,
                },
            });
        } catch (error) {
            if (error instanceof ApiError) {
                return next(error);
            }

            return next(
                new ApiError(
                    ErrorMessages.INTERNAL_SERVER_ERROR,
                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                ),
            );
        }
    }

    async delete(
        request: Request,
        response: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const { username } = request.body;

            if (!username) {
                return next(
                    new ApiError(
                        ErrorMessages.USERNAME_REQUIRED,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            const deleted = await this.authService.delete(username);

            if (!deleted) {
                return next(
                    new ApiError(
                        ErrorMessages.USER_NOT_FOUND,
                        HttpStatusCode.NOT_FOUND,
                    ),
                );
            }

            response.status(Number(HttpStatusCode.OK)).json({
                success: true,
                message: SuccessMessages.USER_DELETED,
            });
        } catch (error) {
            console.error('Error during delete:', error);
            if (error instanceof ApiError) {
                return next(error);
            }
            return next(
                new ApiError(
                    ErrorMessages.INTERNAL_SERVER_ERROR,
                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                ),
            );
        }
    }

    async logout(
        request: Request,
        response: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const token = request.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return next(
                    new ApiError(
                        ErrorMessages.TOKEN_REQUIRED,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            // Check if token is already blacklisted
            const isBlacklisted =
                await this.authService.isTokenBlacklisted(token);
            if (isBlacklisted) {
                return next(
                    new ApiError(
                        ErrorMessages.TOKEN_INVALIDATED,
                        HttpStatusCode.UNAUTHORIZED,
                    ),
                );
            }

            // Set expiration to current time (immediately expired)
            const expiredAt = new Date();
            await this.authService.blacklistToken(token, expiredAt);

            response.status(Number(HttpStatusCode.OK)).json({
                success: true,
                message: SuccessMessages.LOGOUT_SUCCESSFUL,
            });
        } catch (error) {
            console.error(error);
            if (error instanceof ApiError) {
                return next(error);
            }
            return next(
                new ApiError(
                    ErrorMessages.INTERNAL_SERVER_ERROR,
                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                ),
            );
        }
    }
}

// AuthController.ts
import type { Request, Response } from 'express';
import { AuthService } from '../managers/AuthManager';
import type { IUser } from '../Models/User';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    async signup(request: Request, response: Response): Promise<void> {
        try {
            const { username, password } = request.body;

            if (!username) {
                response.status(400).json({
                    type: 'error',
                    message: 'Username is required',
                });
                return;
            }

            if (!password) {
                response.status(400).json({
                    type: 'error',
                    message: 'Password is required',
                });
                return;
            }

            const user = await this.authService.signup(username, password);

            response.status(201).json({
                type: 'success',
                message: 'User signed up successfully',
                user: {
                    userId: user._id,
                    username: user.username,
                    apiKey: user.apiKey,
                    apiSecret: user.apiSecret,
                    redirectUri: user.redirectUri,
                },
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({
                type: 'error',
                error:
                    error instanceof Error
                        ? error.message
                        : 'Internal server error',
            });
        }
    }

    async login(request: Request, response: Response): Promise<void> {
        try {
            const { username, password } = request.body;

            if (!username || !password) {
                response.status(400).json({
                    type: 'error',
                    message: 'Username and password are required',
                });
                return;
            }

            const result = await this.authService.login(username, password);

            if (!result) {
                response.status(401).json({
                    type: 'error',
                    message: 'Invalid credentials',
                });
                return;
            }

            response.status(200).json({
                type: 'success',
                message: 'Login successful',
                token: result.token,
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({
                type: 'error',
                error:
                    error instanceof Error
                        ? error.message
                        : 'Internal server error',
            });
        }
    }

    async update(request: Request, response: Response): Promise<void> {
        try {
            const { username, password, apiKey, apiSecret, redirectUri } =
                request.body;

            if (!username) {
                response.status(400).json({
                    type: 'error',
                    message: 'Username is required for update',
                });
                return;
            }

            const updateFields: Partial<IUser> = {};
            if (password) updateFields.password = password;
            if (apiKey) updateFields.apiKey = apiKey;
            if (apiSecret) updateFields.apiSecret = apiSecret;
            if (redirectUri) updateFields.redirectUri = redirectUri;

            if (Object.keys(updateFields).length === 0) {
                response.status(400).json({
                    type: 'error',
                    message: 'At least one field is required for update',
                });
                return;
            }

            const updatedUser = await this.authService.update(
                username,
                updateFields,
            );

            if (!updatedUser) {
                response.status(404).json({
                    type: 'error',
                    message: 'User not found',
                });
                return;
            }

            response.status(200).json({
                type: 'success',
                message: 'User updated successfully',
                user: {
                    userId: updatedUser._id,
                    username: updatedUser.username,
                    apiKey: updatedUser.apiKey,
                    apiSecret: updatedUser.apiSecret,
                    redirectUri: updatedUser.redirectUri,
                },
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({
                type: 'error',
                error:
                    error instanceof Error
                        ? error.message
                        : 'Internal server error',
            });
        }
    }

    async delete(request: Request, response: Response): Promise<void> {
        try {
            const { username } = request.body;

            if (!username) {
                response.status(400).json({
                    type: 'error',
                    message: 'Username is required for deletion',
                });
                return;
            }

            const deleted = await this.authService.delete(username);

            if (!deleted) {
                response.status(404).json({
                    type: 'error',
                    message: 'User not found',
                });
                return;
            }

            response.status(200).json({
                type: 'success',
                message: 'User deleted successfully',
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({
                type: 'error',
                error:
                    error instanceof Error
                        ? error.message
                        : 'Internal server error',
            });
        }
    }

    async logout(request: Request, response: Response): Promise<void> {
        try {
            const token = request.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                response.status(400).json({
                    type: 'error',
                    message: 'Token is required for logout',
                });
                return;
            }

            // Check if token is already blacklisted
            const isBlacklisted =
                await this.authService.isTokenBlacklisted(token);
            if (isBlacklisted) {
                response.status(400).json({
                    type: 'error',
                    message: 'Token is already invalidated',
                });
                return;
            }

            // Set expiration to current time (immediately expired)
            const expiredAt = new Date();
            await this.authService.blacklistToken(token, expiredAt);

            response.status(200).json({
                type: 'success',
                message: 'Logged out successfully',
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({
                type: 'error',
                error:
                    error instanceof Error
                        ? error.message
                        : 'Internal server error',
            });
        }
    }
}

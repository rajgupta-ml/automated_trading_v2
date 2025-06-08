import type { Request, Response, NextFunction } from 'express';
import { AxiosError } from 'axios';
import type UpstoxManager from '../managers/upstoxManager';
import { ApiError } from '../error/apiError';
import { ErrorMessages, SuccessMessages } from '../utils/messages';
import { HttpStatusCode } from '../utils/httpStatusCode';

export class UpstoxController {
    constructor(private readonly upstoxClient: UpstoxManager) {}

    getAuthUrl = (req: Request, res: Response, next: NextFunction) => {
        try {
            const authUrl = this.upstoxClient.getUpstoxAuthUrl();
            res.status(Number(HttpStatusCode.OK)).json({
                success: true,
                message: SuccessMessages.UPSTOX_AUTH_URL_GENERATED,
                auth_url: authUrl,
            });
        } catch (error) {
            console.error('Error getting Upstox Auth URL:', error);
            next(
                new ApiError(
                    ErrorMessages.UPSTOX_AUTH_URL_FAILED,
                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                ),
            );
        }
    };

    getAccessToken = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const code = req.query.code as string;
            if (!code) {
                return next(
                    new ApiError(
                        ErrorMessages.UPSTOX_ACCESS_CODE_MISSING,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            await this.upstoxClient.getToken(code);
            res.status(Number(HttpStatusCode.OK)).json({
                success: true,
                message: SuccessMessages.UPSTOX_ACCESS_TOKEN_GENERATED,
            });
        } catch (error) {
            console.error('Error generating Upstox Access Token:', error);
            if (error instanceof ApiError) {
                return next(error);
            }
            if (error instanceof AxiosError) {
                const errorDetails =
                    error.response?.data?.message || error.message;
                return next(
                    new ApiError(
                        ErrorMessages.UPSTOX_TOKEN_GENERATION_FAILED.replace(
                            '{details}',
                            errorDetails,
                        ),
                        error.response?.status
                            ? (error.response
                                  .status as unknown as HttpStatusCode)
                            : HttpStatusCode.INTERNAL_SERVER_ERROR,
                    ),
                );
            }
            next(
                new ApiError(
                    ErrorMessages.UPSTOX_TOKEN_GENERATION_FAILED.replace(
                        '{details}',
                        'Unknown error',
                    ),
                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                ),
            );
        }
    };

    establishWebsocket = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            await this.upstoxClient.getLastTradingPriceForAllSubscribedStock();
            res.status(Number(HttpStatusCode.OK)).json({
                success: true,
                message: SuccessMessages.UPSTOX_WEBSOCKET_ESTABLISHED,
            });
        } catch (error) {
            console.error('Error establishing Upstox websocket:', error);
            if (error instanceof ApiError) {
                return next(error);
            }
            if (error instanceof AxiosError) {
                const errorDetails =
                    error.response?.data?.message || error.message;
                return next(
                    new ApiError(
                        ErrorMessages.UPSTOX_WEBSOCKET_ERROR +
                            `: ${errorDetails}`,
                        error.response?.status
                            ? (error.response
                                  .status as unknown as HttpStatusCode)
                            : HttpStatusCode.INTERNAL_SERVER_ERROR,
                    ),
                );
            }
            next(
                new ApiError(
                    ErrorMessages.UPSTOX_WEBSOCKET_ERROR,
                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                ),
            );
        }
    };

    userSubscribeInstrument = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        // Assuming a middleware handles JWT validation and attaches 'user' to req
        const user = (req as any).user;
        const instrument_key = req.body.instrument_key as string;

        if (!user || !user.userId) {
            // Check for user existence and userId
            return next(
                new ApiError(
                    ErrorMessages.MALFORMED_JWT,
                    HttpStatusCode.UNAUTHORIZED,
                ),
            );
        }

        if (!instrument_key) {
            return next(
                new ApiError(
                    ErrorMessages.INSTRUMENT_NAME_REQUIRED,
                    HttpStatusCode.BAD_REQUEST,
                ),
            );
        }

        try {
            await this.upstoxClient.userSubscribeInstrument(
                user.userId,
                instrument_key,
            );

            res.status(Number(HttpStatusCode.OK)).json({
                success: true,
                message: SuccessMessages.UPSTOX_INSTRUMENT_SUBSCRIBED,
            });
        } catch (error: any) {
            console.error('Error subscribing instrument:', error);
            if (error instanceof ApiError) {
                return next(error);
            }
            if (error instanceof AxiosError) {
                const errorDetails =
                    error.response?.data?.message || error.message;
                return next(
                    new ApiError(
                        ErrorMessages.UPSTOX_SUBSCRIPTION_FAILED +
                            `: ${errorDetails}`,
                        error.response?.status
                            ? (error.response
                                  .status as unknown as HttpStatusCode)
                            : HttpStatusCode.INTERNAL_SERVER_ERROR,
                    ),
                );
            }
            next(
                new ApiError(
                    ErrorMessages.UPSTOX_SUBSCRIPTION_FAILED,
                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                ),
            );
        }
    };

    getInstrumentsDetails = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const instrument_name = req.query.instrument_name as string;
            const limit = parseInt(req.query.limit as string) || 5;

            if (!instrument_name) {
                return next(
                    new ApiError(
                        ErrorMessages.INSTRUMENT_NAME_REQUIRED,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            const instrumentDetails =
                await this.upstoxClient.getInstrumetnDetails(
                    instrument_name,
                    limit,
                );

            res.status(Number(HttpStatusCode.OK)).json({
                success: true,
                message: SuccessMessages.UPSTOX_INSTRUMENT_DETAILS_FETCHED,
                instrument: instrumentDetails,
            });
        } catch (error) {
            console.error('Error getting instrument details:', error);
            if (error instanceof ApiError) {
                return next(error);
            }
            if (error instanceof AxiosError) {
                const errorDetails =
                    error.response?.data?.message || error.message;
                return next(
                    new ApiError(
                        ErrorMessages.UPSTOX_INSTRUMENT_DETAILS_FAILED +
                            `: ${errorDetails}`,
                        error.response?.status
                            ? (error.response
                                  .status as unknown as HttpStatusCode)
                            : HttpStatusCode.INTERNAL_SERVER_ERROR,
                    ),
                );
            }
            next(
                new ApiError(
                    ErrorMessages.UPSTOX_INSTRUMENT_DETAILS_FAILED,
                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                ),
            );
        }
    };
}

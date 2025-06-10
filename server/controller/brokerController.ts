import type { Request, Response, NextFunction } from 'express';
import { AxiosError } from 'axios';
import { ApiError } from '../error/apiError';
import { ErrorMessages, SuccessMessages } from '../enums/messages';
import { HttpStatusCode } from '../utils/httpStatusCode';
import type { BrokerCredintialService } from '../Services/brokerCredintialServices';
import type { ManagerConstructors } from '../factory/integrationFactory';
import type { IBrokerCredintials } from '../Models/IntegrationCredintials';
import { generateSessionToken } from '../Models/SessionToken';
export class BrokerController {
    constructor(
        private readonly brokerCredintialService: BrokerCredintialService,
    ) {}

    getAuthUrl = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const broker_name = req.params.broker as keyof ManagerConstructors;
            const user = (req as any).user.userId;
            if (!broker_name) {
                return next(
                    new ApiError(
                        ErrorMessages.BROKER_REQUIRED,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            if (!user) {
                return next(
                    new ApiError(
                        ErrorMessages.MALFORMED_JWT,
                        HttpStatusCode.UNAUTHORIZED,
                    ),
                );
            }

            if (!this.integrationSupport.includes(broker_name)) {
                return next(
                    new ApiError(
                        ErrorMessages.INTEGRATION_NOT_AVAILABLE,
                        HttpStatusCode.NOT_IMPLEMENTED,
                    ),
                );
            }

            const credintials =
                (await this.brokerCredintialService.getBrokerCredintials(
                    user,
                    broker_name,
                )) as IBrokerCredintials;
            const broker =
                this.brokerCredintialService.getInitializedBrokerManager(
                    broker_name,
                );

            if (!credintials) {
                return next(
                    new ApiError(
                        ErrorMessages.CREDINTIALS_NOT_AVAILABLE,
                        HttpStatusCode.SERVICE_UNAVAILABLE,
                    ),
                );
            }

            const authUrl = broker.getAuthUrl(credintials);

            const state = generateSessionToken(user);
            const authUrlWithState = `${authUrl}&state=${state}`;

            res.status(Number(HttpStatusCode.OK)).json({
                success: true,
                message: SuccessMessages.UPSTOX_AUTH_URL_GENERATED,
                auth_url: authUrlWithState,
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
            const broker_name = req.params.broker as keyof ManagerConstructors;
            const user = (req as any).user.userId;

            if (!broker_name) {
                return next(
                    new ApiError(
                        ErrorMessages.BROKER_REQUIRED,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            if (!user) {
                return next(
                    new ApiError(
                        ErrorMessages.MALFORMED_JWT,
                        HttpStatusCode.UNAUTHORIZED,
                    ),
                );
            }

            if (!code) {
                return next(
                    new ApiError(
                        ErrorMessages.UPSTOX_ACCESS_CODE_MISSING,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            if (!this.integrationSupport.includes(broker_name)) {
                return next(
                    new ApiError(
                        ErrorMessages.INTEGRATION_NOT_AVAILABLE,
                        HttpStatusCode.NOT_IMPLEMENTED,
                    ),
                );
            }

            const credintials =
                (await this.brokerCredintialService.getBrokerCredintials(
                    user,
                    broker_name,
                )) as IBrokerCredintials;
            const broker =
                this.brokerCredintialService.getInitializedBrokerManager(
                    broker_name,
                );

            if (!credintials) {
                return next(
                    new ApiError(
                        ErrorMessages.CREDINTIALS_NOT_AVAILABLE,
                        HttpStatusCode.SERVICE_UNAVAILABLE,
                    ),
                );
            }

            const accessToken = await broker.getToken(credintials, code)!;
            this.brokerCredintialService.updateBrokerCredintials(
                user,
                broker_name,
                { accessToken },
            );

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
            const broker_name = req.params.broker as keyof ManagerConstructors;
            const user = (req as any).user.userId;

            if (!broker_name) {
                return next(
                    new ApiError(
                        ErrorMessages.BROKER_REQUIRED,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            if (!user) {
                return next(
                    new ApiError(
                        ErrorMessages.MALFORMED_JWT,
                        HttpStatusCode.UNAUTHORIZED,
                    ),
                );
            }

            if (!this.integrationSupport.includes(broker_name)) {
                return next(
                    new ApiError(
                        ErrorMessages.INTEGRATION_NOT_AVAILABLE,
                        HttpStatusCode.NOT_IMPLEMENTED,
                    ),
                );
            }

            const credintials =
                (await this.brokerCredintialService.getBrokerCredintials(
                    user,
                    broker_name,
                )) as IBrokerCredintials;
            const broker =
                this.brokerCredintialService.getInitializedBrokerManager(
                    broker_name,
                );

            if (!credintials) {
                return next(
                    new ApiError(
                        ErrorMessages.CREDINTIALS_NOT_AVAILABLE,
                        HttpStatusCode.SERVICE_UNAVAILABLE,
                    ),
                );
            }

            if (!credintials.accessToken) {
                return next(
                    new ApiError(
                        ErrorMessages.ACCESS_TOKEN_NOT_AVAILABLE,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            await broker.establishMarketDataFeed(credintials.accessToken);
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

        const broker_name = req.params.broker as keyof ManagerConstructors;

        if (!broker_name) {
            return next(
                new ApiError(
                    ErrorMessages.BROKER_REQUIRED,
                    HttpStatusCode.BAD_REQUEST,
                ),
            );
        }

        if (!this.integrationSupport.includes(broker_name)) {
            return next(
                new ApiError(
                    ErrorMessages.INTEGRATION_NOT_AVAILABLE,
                    HttpStatusCode.NOT_IMPLEMENTED,
                ),
            );
        }

        const broker =
            this.brokerCredintialService.getInitializedBrokerManager(
                broker_name,
            );

        try {
            await broker.subscribeInstrument(user.userId, instrument_key);

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

    deleteSubscribedInstrument = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {};

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

            const broker_name = req.params.broker as keyof ManagerConstructors;

            if (!broker_name) {
                return next(
                    new ApiError(
                        ErrorMessages.BROKER_REQUIRED,
                        HttpStatusCode.BAD_REQUEST,
                    ),
                );
            }

            if (!this.integrationSupport.includes(broker_name)) {
                return next(
                    new ApiError(
                        ErrorMessages.INTEGRATION_NOT_AVAILABLE,
                        HttpStatusCode.NOT_IMPLEMENTED,
                    ),
                );
            }

            const broker =
                this.brokerCredintialService.getInitializedBrokerManager(
                    broker_name,
                );

            const instrumentDetails = await broker.getInstrumentDetails(
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

    addIntegration = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        const broker = req.params.broker as keyof ManagerConstructors;
        const user = (req as any).user.userId;
        const { apiKey, apiSecret, redirectUri } = req.body;
        if (!broker) {
            return next(
                new ApiError(
                    ErrorMessages.BROKER_REQUIRED,
                    HttpStatusCode.BAD_REQUEST,
                ),
            );
        }

        if (!user) {
            return next(
                new ApiError(
                    ErrorMessages.MALFORMED_JWT,
                    HttpStatusCode.UNAUTHORIZED,
                ),
            );
        }

        if (!(apiKey && apiSecret && redirectUri)) {
            return next(
                new ApiError(
                    ErrorMessages.MISSING_REQUIRED_SETTING,
                    HttpStatusCode.BAD_REQUEST,
                ),
            );
        }

        if (!this.integrationSupport.includes(broker)) {
            return next(
                new ApiError(
                    ErrorMessages.INTEGRATION_NOT_AVAILABLE,
                    HttpStatusCode.NOT_IMPLEMENTED,
                ),
            );
        }
        const credentials = {
            apiKey,
            apiSecret,
            redirectUri,
        };
        try {
            await this.brokerCredintialService.addBrokerCredintials(
                user,
                broker,
                credentials,
            );
            res.status(Number(HttpStatusCode.CREATED)).json({
                success: true,
                message: `${broker} ${SuccessMessages.BROKER_INTEGRATION}`,
            });
        } catch (error) {
            console.error('Error adding integration:', error);
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
    };

    updateIntegration = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {};
    getIntegration = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {};

    deleteIntegration = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {};

    private integrationSupport: (keyof ManagerConstructors)[] = ['upstox'];
}

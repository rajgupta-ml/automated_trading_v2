import axios, { type AxiosRequestConfig, AxiosError } from 'axios';
import { config } from '../utils/config';
import { WebSocket } from 'ws';
import { decodeProtoBuf } from '../utils/protobuf';
import { formatDate } from '../utils/utilityFn';
import { exactMatchSearch, prefixSearch } from '../search/searchEngine';
import UserSubscribedInstruments from '../Models/SubscribedInstruments';
import { convertStringToObjectId } from '../Services/dbService';
import mongoose from 'mongoose';

import { ApiError } from '../error/apiError';
import { ErrorMessages } from '../enums/messages';
import { HttpStatusCode } from '../utils/httpStatusCode';
import type { ApiManager } from '../factory/integrationFactory';
import type { IBrokerCredintials } from '../Models/IntegrationCredintials';

enum URLs {
    authorizationURL = 'authorizationURL',
    tokenURL = 'tokenURL',
    wsAuthURL = 'wsAuthURL',
    historicalData = 'historicalData',
}

export default class UpstoxManager implements ApiManager {
    private readonly API_ENDPOINT = 'https://api.upstox.com/v2';
    private readonly grant_type = 'authorization_code';

    private access_code: string | undefined =
        config.mode === 'dev' ? config.access_code : undefined;

    private throwInternalError(error: unknown, context: string): never {
        console.error(`UpstoxManager Internal Error in ${context}:`, error);
        throw new ApiError(
            ErrorMessages.INTERNAL_SERVER_ERROR,
            HttpStatusCode.INTERNAL_SERVER_ERROR,
        );
    }

    public getAuthUrl(credentials: IBrokerCredintials) {
        try {
            const { apiKey, apiSecret, redirectUri } = credentials;
            if (!(apiKey && apiSecret && redirectUri)) {
                throw new ApiError(
                    ErrorMessages.BROKER_CONNECTION_FAILED,
                    HttpStatusCode.BAD_REQUEST,
                );
            }
            const url = this.getURLs(URLs.authorizationURL, credentials);
            return url;
        } catch (error) {
            this.throwInternalError(error, 'getUpstoxAuthUrl');
        }
    }

    public async getToken(
        credentials: IBrokerCredintials,
        code: string,
    ): Promise<string> {
        const url = this.getURLs(URLs.tokenURL);
        const body = this.getBody(URLs.tokenURL, credentials, code);
        const requestConfig: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
        };

        if (!url || !body) {
            this.throwInternalError(
                new Error('URL or body is missing for getToken'),
                'getToken',
            );
        }

        try {
            const response = await axios.post(url, body, requestConfig);
            return response.data.access_token;
        } catch (error: any) {
            console.error('Error during Upstox token exchange:', error);
            if (error instanceof AxiosError) {
                const errorMessage =
                    error.response?.data?.message || error.message;
                const statusCode =
                    (error.response?.status as unknown as HttpStatusCode) ||
                    HttpStatusCode.INTERNAL_SERVER_ERROR;
                throw new ApiError(
                    ErrorMessages.UPSTOX_TOKEN_GENERATION_FAILED.replace(
                        '{details}',
                        errorMessage,
                    ),
                    statusCode,
                );
            }
            this.throwInternalError(error, 'getToken');
        }
    }

    public async establishMarketDataFeed(access_token: string): Promise<void> {
        let wsURL: string;
        try {
            wsURL = await this.getWsAuthURL();
        } catch (error) {
            throw error;
        }

        // --- Find the subscribed Instruments (This part needs actual fetching from DB for the user) ---
        // CURRENTLY, this fetches an arbitrary hardcoded instrument.
        // For a multi-user system, you'd need to fetch user-specific subscribed instruments here.
        // For demonstration, let's assume `getWsAuthURL` is successful and we're just setting up the WS.
        // Also, the WebSocket connection itself is client-side in a browser, or handled by a separate
        // server-side service if you're maintaining persistent connections.
        // For this manager, we're just demonstrating the *attempt* to establish.

        const wsConfig: WebSocket.ClientOptions = {
            headers: {
                'Api-Version': '2.0',
                Authorization: `Bearer ${access_token}`,
            },
        };

        try {
            const ws = new WebSocket(wsURL, wsConfig);

            ws.onopen = () => {
                console.log('Upstox WebSocket Connected');

                const data = {
                    guid: 'someguid',
                    method: 'sub',
                    data: {
                        mode: 'full',
                        instrumentKeys: ['NSE_EQ|INE669E01016'],
                    },
                };
                ws.send(Buffer.from(JSON.stringify(data)));
            };

            ws.onclose = () => {
                console.log('Upstox WebSocket Disconnected');
            };

            ws.onmessage = async (event) => {
                try {
                    let response = await decodeProtoBuf(event.data as Buffer);

                    console.log(
                        'Received market data:',
                        response.feeds
                            ? response.feeds['NSE_EQ|INE669E01016']?.ff
                            : 'No feeds',
                    );
                } catch (decodeError) {
                    console.error(
                        'Error decoding Protobuf message:',
                        decodeError,
                    );
                }
            };

            ws.onerror = (error) => {
                console.error('Upstox WebSocket error:', error);

                throw new ApiError(
                    ErrorMessages.UPSTOX_WEBSOCKET_ERROR + `: ${error.message}`,
                    HttpStatusCode.SERVICE_UNAVAILABLE, // Or INTERNAL_SERVER_ERROR if due to internal setup
                );

                // Reconnection Logic Should be added here
            };

            // To ensure the Promise resolves/rejects based on connection status (optional, for explicit handling)
            // You might need a more sophisticated mechanism involving event listeners for `open` and `error`
            // to fulfill/reject this Promise properly. For now, it just sets up handlers.
            return new Promise<void>((resolve, reject) => {
                ws.on('open', resolve);
                ws.on('error', reject);
            });
        } catch (error) {
            console.error('Failed to initialize WebSocket connection:', error);
            this.throwInternalError(
                error,
                'establishUpstoxSocketConnectionAndStreamMarketFeed',
            );
        }
    }

    public async getHistoricalData(): Promise<number> {
        const fromDate = formatDate(); // Current date
        const toDate = formatDate(7); // Date 7 days from now
        const instrumentKey = 'NSE_EQ|INE848E01016';
        const interval = 'day';
        const query = `${instrumentKey}/${interval}/${fromDate}/${toDate}`;
        const requestConfig: AxiosRequestConfig = {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${this.access_code}`,
            },
        };
        const url = this.getURLs(URLs.historicalData, undefined, query);

        if (!this.access_code) {
            throw new ApiError(
                ErrorMessages.UNAUTHORIZED_ACCESS,
                HttpStatusCode.UNAUTHORIZED,
            );
        }

        try {
            const response = await axios.get(url, requestConfig);
            if (
                !response.data ||
                !response.data.data ||
                !response.data.data.candles ||
                response.data.data.candles.length === 0
            ) {
                throw new ApiError(
                    ErrorMessages.MARKET_DATA_UNAVAILABLE,
                    HttpStatusCode.NOT_FOUND,
                );
            }
            const closePrice =
                response.data.data.candles[
                    response.data.data.candles.length - 1
                ][4];
            console.log('Close price for', instrumentKey, ':', closePrice);
            return closePrice;
        } catch (error: any) {
            console.error('Error getting historical data:', error);
            if (error instanceof AxiosError) {
                const errorMessage =
                    error.response?.data?.message || error.message;
                const statusCode =
                    (error.response?.status as unknown as HttpStatusCode) ||
                    HttpStatusCode.INTERNAL_SERVER_ERROR;
                throw new ApiError(
                    ErrorMessages.MARKET_DATA_UNAVAILABLE + `: ${errorMessage}`,
                    statusCode,
                );
            }
            this.throwInternalError(
                error,
                'getLastTradingPriceForAllSubscribedStock',
            );
        }
    }

    public async getInstrumentDetails(
        query: string,
        limit: number = 10,
    ): Promise<string[]> {
        try {
            const exactKey = await exactMatchSearch(query);
            if (exactKey.length > 0) {
                return exactKey;
            }

            const prefixKey = await prefixSearch(query, limit);
            if (prefixKey.length > 0) {
                return prefixKey;
            }

            return [];
        } catch (error) {
            this.throwInternalError(error, 'getInstrumetnDetails');
        }
    }

    public async subscribeInstrument(
        userId: string,
        instrument_name: string,
    ): Promise<void> {
        try {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw new ApiError(
                    ErrorMessages.INVALID_DATA_FORMAT,
                    HttpStatusCode.BAD_REQUEST,
                );
            }

            const instrument = await this.getInstrumentDetails(instrument_name);
            if (instrument.length === 0) {
                throw new ApiError(
                    ErrorMessages.INVALID_INSTRUMENT,
                    HttpStatusCode.NOT_FOUND,
                );
            }
            if (instrument.length !== 1) {
                throw new ApiError(
                    ErrorMessages.INVALID_INSTRUMENT +
                        ': Multiple instruments found, please be more specific.',
                    HttpStatusCode.BAD_REQUEST,
                );
            }

            await UserSubscribedInstruments.findOneAndUpdate(
                { userId: convertStringToObjectId(userId) },
                {
                    $addToSet: {
                        instrumentNames: instrument_name.toLowerCase(),
                    },
                },
                { new: true, upsert: true, runValidators: true },
            );
        } catch (error: any) {
            if (error instanceof ApiError) {
                throw error;
            }
            if (error.code === 11000) {
                throw new ApiError(
                    ErrorMessages.RESOURCE_ALREADY_EXISTS +
                        ': This instrument is already subscribed.',
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
                    ErrorMessages.INVALID_DATA_FORMAT +
                        ': Invalid User ID or Instrument Key format.',
                    HttpStatusCode.BAD_REQUEST,
                );
            }
            this.throwInternalError(error, 'userSubscribeInstrument');
        }
    }

    public async deleteSubscription(userId: string) {
        if (!userId) {
            throw new ApiError(
                ErrorMessages.MISSING_REQUIRED_SETTING.replace(
                    '{settingName}',
                    'User ID',
                ),
                HttpStatusCode.BAD_REQUEST,
            );
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(
                ErrorMessages.INVALID_DATA_FORMAT,
                HttpStatusCode.BAD_REQUEST,
            );
        }

        try {
            const userObjId = convertStringToObjectId(userId);
            const result = await UserSubscribedInstruments.findOneAndDelete({
                userId: userObjId,
            });

            if (!result) {
                throw new ApiError(
                    ErrorMessages.USER_NOT_FOUND +
                        ': No active subscription found for this user.', // Use USER_NOT_FOUND or a more specific message
                    HttpStatusCode.NOT_FOUND,
                );
            }
            return !!result;
        } catch (error: any) {
            if (error instanceof ApiError) {
                throw error; // Re-throw ApiError
            }
            if (error instanceof mongoose.Error.CastError) {
                throw new ApiError(
                    ErrorMessages.INVALID_DATA_FORMAT +
                        ': Invalid User ID format.',
                    HttpStatusCode.BAD_REQUEST,
                );
            }
            this.throwInternalError(error, 'deleteUserSubscription');
        }
    }

    private async getWsAuthURL(): Promise<string> {
        if (!this.access_code) {
            throw new ApiError(
                ErrorMessages.UNAUTHORIZED_ACCESS +
                    '. Upstox access token missing. Please re-authenticate.',
                HttpStatusCode.UNAUTHORIZED,
            );
        }
        const requestConfig: AxiosRequestConfig = {
            headers: {
                Authorization: `Bearer ${this.access_code}`,
                Accept: 'application/json',
            },
        };
        const url = this.getURLs(URLs.wsAuthURL);
        try {
            const response = await axios.get(url, requestConfig);
            if (
                !response.data ||
                !response.data.data ||
                !response.data.data.authorizedRedirectUri
            ) {
                throw new ApiError(
                    ErrorMessages.UPSTOX_WEBSOCKET_ERROR +
                        ': Missing authorizedRedirectUri from Upstox API response.',
                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                );
            }
            return response.data.data.authorizedRedirectUri;
        } catch (error: any) {
            console.error('Error getting Upstox WS Auth URL:', error);
            if (error instanceof AxiosError) {
                const errorMessage =
                    error.response?.data?.message || error.message;
                const statusCode =
                    (error.response?.status as unknown as HttpStatusCode) ||
                    HttpStatusCode.INTERNAL_SERVER_ERROR;
                throw new ApiError(
                    ErrorMessages.UPSTOX_AUTH_URL_FAILED.replace(
                        '{details}',
                        errorMessage,
                    ),
                    statusCode,
                );
            }
            this.throwInternalError(error, 'getWsAuthURL');
        }
    }

    private getURLs(
        Key: URLs,
        credentials?: IBrokerCredintials,
        query?: string,
    ): string {
        const URLS: { [key in URLs]: string } = {
            // Explicitly type keys for stricter checking
            [URLs.authorizationURL]: `${this.API_ENDPOINT}/login/authorization/dialog?client_id=${credentials?.apiKey}&redirect_uri=${credentials?.redirectUri}`,
            [URLs.tokenURL]: `${this.API_ENDPOINT}/login/authorization/token`,
            [URLs.wsAuthURL]: `${this.API_ENDPOINT}/feed/market-data-feed/authorize`,
            [URLs.historicalData]: `${this.API_ENDPOINT}/historical-candle/${query}`,
        };

        const result = URLS[Key];
        if (!result) {
            // This case should ideally not be hit if URLs enum and map are in sync
            throw new ApiError(
                ErrorMessages.INTERNAL_SERVER_ERROR +
                    `: Missing URL definition for key: ${Key}`,
                HttpStatusCode.INTERNAL_SERVER_ERROR,
            );
        }
        return result;
    }

    private getBody(
        Key: URLs, // Use URLs enum for Key
        credentials?: IBrokerCredintials,
        code?: string,
    ): Record<string, string> {
        if (!credentials) {
            throw new ApiError(
                ErrorMessages.UPSTOX_TOKEN_GENERATION_FAILED,
                HttpStatusCode.INTERNAL_SERVER_ERROR,
            );
        }
        const Body: { [key in URLs]?: Record<string, string> } = {
            [URLs.tokenURL]: {
                code:
                    code ??
                    (() => {
                        throw new ApiError(
                            ErrorMessages.UPSTOX_ACCESS_CODE_MISSING,
                            HttpStatusCode.INTERNAL_SERVER_ERROR,
                        ); // Internal error if `code` is expected but missing
                    })(),
                client_id: credentials?.apiKey,
                client_secret: credentials?.apiSecret,
                redirect_uri: credentials?.redirectUri,
                grant_type: this.grant_type,
            },
            // Add other body definitions if they exist for other URLs enum members
        };

        const result = Body[Key];
        if (!result) {
            throw new ApiError(
                ErrorMessages.INTERNAL_SERVER_ERROR +
                    `: No request body defined for key: ${Key}`,
                HttpStatusCode.INTERNAL_SERVER_ERROR,
            );
        }
        return result;
    }
}

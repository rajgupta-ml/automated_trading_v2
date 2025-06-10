import {
    IntegrationFactory,
    type ApiManager,
    type ManagerConstructors,
} from '../factory/integrationFactory';
import Intergration, {
    type IBrokerCredintials,
    type IUserIntegration,
} from '../Models/IntegrationCredintials';
import { ApiError } from '../error/apiError';
import { ErrorMessages, SuccessMessages } from '../enums/messages';
import { HttpStatusCode } from '../utils/httpStatusCode';
import { convertStringToObjectId } from '../Services/dbService';
import mongoose from 'mongoose';
import axios, { AxiosError } from 'axios';

export class BrokerCredintialService {
    constructor(private integrationFactory: IntegrationFactory) {}
    public getInitializedBrokerManager(
        broker_name: keyof ManagerConstructors,
    ): ApiManager {
        try {
            return this.integrationFactory.getManager(
                broker_name,
            ) as ApiManager;
        } catch (error: any) {
            console.error(
                `Failed to initialize broker manager for ${broker_name}:`,
                error,
            );

            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                ErrorMessages.INTERNAL_SERVER_ERROR +
                    `: Failed to load broker manager for ${broker_name}.`,
                HttpStatusCode.INTERNAL_SERVER_ERROR,
            );
        }
    }

    private async checkCredintials(
        credentials: IBrokerCredintials,
        broker_name: keyof ManagerConstructors,
    ): Promise<boolean> {
        try {
            const broker = this.getInitializedBrokerManager(broker_name);

            const url = broker.getAuthUrl(credentials);
            const response = await axios.get(url);

            return response.status === 200;
        } catch (error: any) {
            console.error(`Credential check failed for ${broker_name}:`, error);
            if (error instanceof ApiError) {
                throw error;
            }
            if (error instanceof AxiosError) {
                const errorMessage =
                    error.response?.data?.message || error.message;
                throw new ApiError(
                    ErrorMessages.BROKER_CONNECTION_FAILED +
                        `: ${errorMessage}`,
                    (error.response?.status as unknown as HttpStatusCode) ||
                        HttpStatusCode.INTERNAL_SERVER_ERROR,
                );
            }
            throw new ApiError(
                ErrorMessages.WRONG_CREDINTIALS,
                HttpStatusCode.BAD_REQUEST,
            );
        }
    }

    public async addBrokerCredintials(
        userId: string,
        broker: keyof ManagerConstructors,
        credentials: IBrokerCredintials,
    ): Promise<IUserIntegration> {
        try {
            // Validate credentials with the broker's API
            const isValid = await this.checkCredintials(credentials, broker);
            if (!isValid) {
                throw new ApiError(
                    ErrorMessages.WRONG_CREDINTIALS,
                    HttpStatusCode.BAD_REQUEST,
                );
            }

            const userIdObjectId = convertStringToObjectId(userId);

            const updatedIntegration = await Intergration.findOneAndUpdate(
                { userId: userIdObjectId },
                {
                    $set: { [`brokerIntegration.${broker}`]: credentials },
                },
                {
                    new: true, // Return the updated document
                    upsert: true, // Create the document if it doesn't exist
                    runValidators: true, // Run Mongoose validators on the update
                },
            );

            if (!updatedIntegration) {
                throw new ApiError(
                    ErrorMessages.DATABASE_OPERATION_FAILED,
                    HttpStatusCode.INTERNAL_SERVER_ERROR,
                );
            }

            return updatedIntegration;
        } catch (error: any) {
            console.error('Error in addBrokerCredintials (service):', error);
            if (error instanceof ApiError) {
                throw error; // Re-throw custom API errors
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
                        ': Invalid User ID format.',
                    HttpStatusCode.BAD_REQUEST,
                );
            }
            throw new ApiError(
                ErrorMessages.INTERNAL_SERVER_ERROR,
                HttpStatusCode.INTERNAL_SERVER_ERROR,
            );
        }
    }

    public async getBrokerCredintials(
        userId: string,
        broker: keyof ManagerConstructors,
    ): Promise<IBrokerCredintials> {
        // Parameter validation
        if (!broker) {
            throw new ApiError(
                ErrorMessages.BROKER_REQUIRED,
                HttpStatusCode.BAD_REQUEST,
            );
        }
        if (!userId) {
            // Assuming userId is already validated
            throw new ApiError(
                ErrorMessages.MALFORMED_JWT,
                HttpStatusCode.UNAUTHORIZED,
            );
        }

        try {
            const userIdObjectId = convertStringToObjectId(userId);
            const userIntegration = await Intergration.findOne({
                userId: userIdObjectId,
            });

            if (!userIntegration) {
                throw new ApiError(
                    ErrorMessages.USER_NOT_FOUND +
                        ': No integration found for this user.',
                    HttpStatusCode.NOT_FOUND,
                );
            }

            const credentials = userIntegration.brokerIntegration.get(broker);

            if (!credentials) {
                throw new ApiError(
                    ErrorMessages.RESOURCE_NOT_FOUND_DB +
                        `: No credentials found for broker: ${broker}.`,
                    HttpStatusCode.NOT_FOUND,
                );
            }

            return {
                apiKey: credentials.apiKey,
                apiSecret: credentials.apiSecret,
                redirectUri: credentials.redirectUri,
                accessToken: credentials.accessToken,
                refreshToken: credentials.refreshToken,
            };
        } catch (error: any) {
            console.error('Error in getBrokerCredintials (service):', error);
            if (error instanceof ApiError) {
                throw error;
            }
            if (error instanceof mongoose.Error.CastError) {
                throw new ApiError(
                    ErrorMessages.INVALID_DATA_FORMAT +
                        ': Invalid User ID format.',
                    HttpStatusCode.BAD_REQUEST,
                );
            }
            throw new ApiError(
                ErrorMessages.INTERNAL_SERVER_ERROR,
                HttpStatusCode.INTERNAL_SERVER_ERROR,
            );
        }
    }

    public async updateBrokerCredintials(
        userId: string,
        broker: keyof ManagerConstructors,
        updateFields: Partial<IBrokerCredintials>,
    ): Promise<IBrokerCredintials> {
        // Parameter validation
        if (!broker) {
            throw new ApiError(
                ErrorMessages.BROKER_REQUIRED,
                HttpStatusCode.BAD_REQUEST,
            );
        }
        if (!userId) {
            // Assuming userId is already validated
            throw new ApiError(
                ErrorMessages.MALFORMED_JWT,
                HttpStatusCode.UNAUTHORIZED,
            );
        }

        if (
            !(
                updateFields.apiKey ||
                updateFields.apiSecret ||
                updateFields.redirectUri ||
                updateFields.accessToken ||
                updateFields.refreshToken
            )
        ) {
            throw new ApiError(
                ErrorMessages.UPDATE_FIELDS_REQUIRED,
                HttpStatusCode.BAD_REQUEST,
            );
        }

        try {
            const userIdObjectId = convertStringToObjectId(userId);

            const mongooseUpdate: { [key: string]: any } = {};
            if (updateFields.apiKey !== undefined)
                mongooseUpdate[`brokerIntegration.${broker}.apiKey`] =
                    updateFields.apiKey;
            if (updateFields.apiSecret !== undefined)
                mongooseUpdate[`brokerIntegration.${broker}.apiSecret`] =
                    updateFields.apiSecret;
            if (updateFields.redirectUri !== undefined)
                mongooseUpdate[`brokerIntegration.${broker}.redirectUri`] =
                    updateFields.redirectUri;
            if (updateFields.accessToken !== undefined)
                mongooseUpdate[`brokerIntegration.${broker}.accessToken`] =
                    updateFields.accessToken;
            if (updateFields.refreshToken !== undefined)
                mongooseUpdate[`brokerIntegration.${broker}.refreshToken`] =
                    updateFields.refreshToken;

            const updatedIntegration = await Intergration.findOneAndUpdate(
                { userId: userIdObjectId },
                { $set: mongooseUpdate },
                { new: true, runValidators: true }, // Return the updated document and run validators
            );

            if (!updatedIntegration) {
                throw new ApiError(
                    ErrorMessages.USER_NOT_FOUND +
                        ': No integration found to update.',
                    HttpStatusCode.NOT_FOUND,
                );
            }
            if (!updatedIntegration.brokerIntegration.has(broker)) {
                // This indicates user found, but no credentials for this specific broker
                throw new ApiError(
                    ErrorMessages.RESOURCE_NOT_FOUND_DB +
                        `: No credentials found for broker: ${broker}.`,
                    HttpStatusCode.NOT_FOUND,
                );
            }

            const updatedCreds =
                updatedIntegration.brokerIntegration.get(broker)!; // Assert non-null after has() check
            return {
                apiKey: updatedCreds.apiKey
                    ? '******' + updatedCreds.apiKey.slice(-4)
                    : '******',
                apiSecret: updatedCreds.apiSecret
                    ? '******' + updatedCreds.apiSecret.slice(-4)
                    : '******',
                redirectUri: updatedCreds.redirectUri,
                accessToken: updatedCreds.accessToken
                    ? '******' + updatedCreds.accessToken.slice(-4)
                    : undefined,
                refreshToken: updatedCreds.refreshToken
                    ? '******' + updatedCreds.refreshToken.slice(-4)
                    : undefined,
            };
        } catch (error: any) {
            console.error('Error in UpdateBrokerCredintials (service):', error);
            if (error instanceof ApiError) {
                throw error;
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
                        ': Invalid User ID or data format.',
                    HttpStatusCode.BAD_REQUEST,
                );
            }
            throw new ApiError(
                ErrorMessages.INTERNAL_SERVER_ERROR,
                HttpStatusCode.INTERNAL_SERVER_ERROR,
            );
        }
    }

    public async deleteBrokerCredintials(
        userId: string,
        broker: keyof ManagerConstructors,
    ): Promise<boolean> {
        // Parameter validation
        if (!broker) {
            throw new ApiError(
                ErrorMessages.BROKER_REQUIRED,
                HttpStatusCode.BAD_REQUEST,
            );
        }
        if (!userId) {
            // Assuming userId is already validated
            throw new ApiError(
                ErrorMessages.MALFORMED_JWT,
                HttpStatusCode.UNAUTHORIZED,
            );
        }

        try {
            const userIdObjectId = convertStringToObjectId(userId);

            // Use $unset to remove a specific key from the Map
            const updatedIntegration = await Intergration.findOneAndUpdate(
                { userId: userIdObjectId },
                { $unset: { [`brokerIntegration.${broker}`]: '' } }, // Value for $unset doesn't matter
                { new: true }, // Return the updated document
            );

            if (!updatedIntegration) {
                throw new ApiError(
                    ErrorMessages.USER_NOT_FOUND +
                        ': No integration found to delete from.',
                    HttpStatusCode.NOT_FOUND,
                );
            }

            // Check if the broker was actually removed from the map
            if (updatedIntegration.brokerIntegration.has(broker)) {
                // This means the user document existed, but the specific broker was not found/removed
                throw new ApiError(
                    ErrorMessages.RESOURCE_NOT_FOUND_DB +
                        `: Credentials for broker ${broker} not found to delete.`,
                    HttpStatusCode.NOT_FOUND,
                );
            }

            return true; // Successfully deleted
        } catch (error: any) {
            console.error('Error in deleteBrokerCredintials (service):', error);
            if (error instanceof ApiError) {
                throw error;
            }
            if (error instanceof mongoose.Error.CastError) {
                throw new ApiError(
                    ErrorMessages.INVALID_DATA_FORMAT +
                        ': Invalid User ID format.',
                    HttpStatusCode.BAD_REQUEST,
                );
            }
            throw new ApiError(
                ErrorMessages.INTERNAL_SERVER_ERROR,
                HttpStatusCode.INTERNAL_SERVER_ERROR,
            );
        }
    }
}

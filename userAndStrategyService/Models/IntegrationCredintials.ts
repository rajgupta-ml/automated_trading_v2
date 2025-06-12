import mongoose, { Document, Schema } from 'mongoose';
import type { IUser } from './User';
export interface IBrokerCredintials {
    apiKey: string;
    apiSecret: string;
    redirectUri: string;
    accessToken?: string;
    refreshToken?: string;
}

export interface IUserIntegration extends Document {
    userId: mongoose.Types.ObjectId;
    brokerIntegration: Map<string, IBrokerCredintials>;
}

const UserIntegration: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            unique: true,
            ref: 'User',
        },

        brokerIntegration: {
            type: Map,
            of: {
                apiKey: { type: String, required: true },
                apiSecret: { type: String, required: true },
                redirectUri: { type: String, required: true },
                accessToken: { type: String },
                refreshToken: { type: String },
            },

            default: new Map(),
        },
    },
    {
        timestamps: true,
    },
);

const Intergration = mongoose.model<IUserIntegration>(
    'UserIntegration',
    UserIntegration,
);

export default Intergration;

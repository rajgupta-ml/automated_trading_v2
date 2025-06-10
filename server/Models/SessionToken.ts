import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';
import { AuthError } from '../error/authError';
import { ErrorMessages } from '../enums/messages';
import { HttpStatusCode } from '../utils/httpStatusCode';

export interface ISessionToken extends Document {
    userId: mongoose.Types.ObjectId;
    sessionToken: string;
    expireAt: Date;
}

const SessionTokenSchema = new Schema<ISessionToken>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    sessionToken: { type: String, required: true },
    expireAt: {
        type: Date,
        default: () => new Date(Date.now() + 60 * 1000),
        index: { expires: 0 },
    },
});

const SessionToken = mongoose.model<ISessionToken>(
    'SessionToken',
    SessionTokenSchema,
);

const generateSessionToken = (user: mongoose.Types.ObjectId) => {
    const state = crypto.randomBytes(32).toHex();

    const sessionToken = new SessionToken({
        userId: user,
        sessionToken: state,
    });

    sessionToken.save();

    return state;
};

const verifySessionToken = async (sessionToken: string) => {
    if (!sessionToken) {
        throw new AuthError(
            ErrorMessages.UNAUTHORIZED_ACCESS,
            HttpStatusCode.UNAUTHORIZED,
        );
    }
    const sessionTokenData = await SessionToken.findOne({ sessionToken });

    if (!sessionTokenData || !sessionTokenData.userId) {
        throw new AuthError(
            ErrorMessages.INVALID_SESSION_TOKEN,
            HttpStatusCode.UNAUTHORIZED,
        );
    }

    return sessionTokenData.userId;
};

export { SessionToken, generateSessionToken, verifySessionToken };

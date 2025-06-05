import mongoose, { Document, Schema } from 'mongoose';

export interface IExpiredToken extends Document {
    token: string;
    expiredAt: Date;
}

const ExpiredTokenSchema = new Schema<IExpiredToken>({
    token: { type: String, required: true, unique: true },
    expiredAt: { type: Date, required: true },
});

const ExpiredToken = mongoose.model<IExpiredToken>(
    'ExpiredToken',
    ExpiredTokenSchema,
);
export default ExpiredToken;

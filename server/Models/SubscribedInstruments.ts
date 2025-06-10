import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSubscribedInstruments extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    instrumentNames: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

const userSubscribedInstrumentsSchema = new Schema<IUserSubscribedInstruments>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true,
        },
        instrumentNames: { type: [String], default: [] },
    },
    {
        timestamps: true,
    },
);

const UserSubscribedInstruments = mongoose.model<IUserSubscribedInstruments>(
    'UserSubscribedInstruments',
    userSubscribedInstrumentsSchema,
);

const getInstruments = async (
    userId: mongoose.Types.ObjectId,
): Promise<IUserSubscribedInstruments | Promise<null>> => {
    const instrument = await UserSubscribedInstruments.findOne({ userId });
    if (!instrument || instrument.instrumentNames.length === 0) {
        return null;
    }

    return instrument;
};

export { UserSubscribedInstruments, getInstruments };

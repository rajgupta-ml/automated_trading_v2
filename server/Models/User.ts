import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string;
  apiKey?: string;
  apiSecret?: string;
  redirectUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    apiKey: { type: String },
    apiSecret: { type: String },
    redirectUri: { type: String }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model<IUser>("User", UserSchema);
export default User;

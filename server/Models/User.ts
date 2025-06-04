import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IUser extends Document {
  userId: string; // UUID
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
    userId: { type: String, default: uuidv4, unique: true }, // new UUID field
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

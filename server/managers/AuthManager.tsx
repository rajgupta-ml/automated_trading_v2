import jwt from "jsonwebtoken";
import User, {type IUser } from "../Models/User";
import ExpiredToken from "../Models/ExpiredToken";
import { config } from "../utils/config";
import crypto, { type HashOptions } from "crypto";

export class AuthService {
  private algo = config.crypto.algorithm;
  private secret = config.crypto.secret as HashOptions;
  private jwtSecret = config.jwt.secret as string;

  private hashPassword(password: string): string {
    return crypto.createHash(this.algo, this.secret).update(password).digest("hex");
  }

  async signup(username: string, password: string): Promise<IUser> {
    const hashedPassword = this.hashPassword(password);
    const user = new User({ username, password: hashedPassword });
    return user.save();
  }

  async login(username: string, password: string): Promise<{ token: string } | null> {
    const user = await User.findOne({ username });
    if (!user) return null;

    const hashedPassword = this.hashPassword(password);
    if (user.password !== hashedPassword) return null;


    const token = jwt.sign(
      { userId: user.userId, username: user.username },
      this.jwtSecret,
      { expiresIn: '1d' }
    );

    return { token };
  }

  async update(username: string, updates: Partial<IUser>): Promise<IUser | null> {
    const updateFields: Partial<IUser> = { ...updates };
    if (updates.password) {
      updateFields.password = this.hashPassword(updates.password);
    }
    return User.findOneAndUpdate({ username }, updateFields, { new: true });
  }

  async delete(username: string): Promise<boolean> {
    const result = await User.findOneAndDelete({ username });
    return !!result;
  }

  // Store expired token
  async blacklistToken(token: string, expiredAt: Date): Promise<void> {
    const expiredToken = new ExpiredToken({ token, expiredAt });
    await expiredToken.save();
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const found = await ExpiredToken.findOne({ token });
    return !!found;
  }
}

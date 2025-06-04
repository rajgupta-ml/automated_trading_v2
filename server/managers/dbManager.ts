// db/mongoose.ts
import mongoose from "mongoose";
import { config } from "../utils/config";

export const connectToDatabase = async () => {
  try {
    mongoose.set("strictQuery", true); // Add this line
    await mongoose.connect(config.db.uri, {
      dbName: "automatedTrading", // optional if URI includes db
    });

    console.log("✅ Connected to MongoDB via Mongoose");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

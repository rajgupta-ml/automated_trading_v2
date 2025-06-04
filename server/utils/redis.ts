import { createClient } from "redis";
import { config } from "./config";

export const connectToRedis = async ()  => {
    const client = createClient({ url: config.redis.uri });
  
    client.on("error", (err) => {
      console.error("❌ Redis error:", err);
    });
  
    await client.connect();
    console.log("✅ Redis connected");
    return client;
  }
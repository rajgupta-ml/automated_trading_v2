import { createClient, type RedisClientType } from "redis";

export const connectToRedis = async ()  => {
    const client = createClient({ url: "redis://localhost:6379/0" });
  
    client.on("error", (err) => {
      console.error("❌ Redis error:", err);
    });
  
    await client.connect();
    console.log("✅ Redis connected");
    return client;
  }
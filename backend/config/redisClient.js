import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL, {
  tls: { rejectUnauthorized: false },
});

redis.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

export default redis;
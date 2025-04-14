import redis from "../config/redisClient.js";
const CACHE_TTL = 120; // 2 minutes

export const cacheMiddleware = async (req, res, next) => {
  const cacheKey = `${req.path}-${JSON.stringify(req.query)}`;
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    console.log("Using Redis cache");
    return res.json(JSON.parse(cachedData));
  }

  // Save original res.json method
  const originalJson = res.json;
  res.json = function (data) {
    redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
    return originalJson.call(this, data);
  };

  next();
};
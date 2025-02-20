const Redis = require("ioredis");

const redis = new Redis({
    host: "redis-16801.c277.us-east-1-3.ec2.redns.redis-cloud.com",
    port: 16801,
    password: "fd6SKXS9UXnXQYZHDkdCEIQga9mlIHyX",
});

redis.on("connect", () => console.log("Connected to Redis Cloud"));
redis.on("error", (err) => console.error("Redis Error:", err));

module.exports = redis;

const Redis = require("ioredis");

const redis = new Redis({
    host: "redis-12845.c89.us-east-1-3.ec2.redns.redis-cloud.com",
    port: 12845,
    password: "qIcTTo2AmoddbNQCUtdinWE7wv8a6VCj",
});

redis.on("connect", () => console.log("Connected to Redis Cloud"));
redis.on("error", (err) => console.error("Redis Error:", err));

module.exports = redis;

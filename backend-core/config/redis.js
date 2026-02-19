const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {

        tls: process.env.REDIS_URL.startsWith('rediss'),
        rejectUnauthorized: false,

        reconnectStrategy: (retries) => {
            if (retries > 10) return new Error('Redis connection exhausted');
            return Math.min(retries * 100, 3000);
        }
    }
});

// Event Listeners for better debugging
redisClient.on('connect', () => console.log(' Redis Connecting...'));
redisClient.on('ready', () => console.log(' Redis Connected & Ready!'));
redisClient.on('error', (err) => console.error(' Redis Error:', err.message));

const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (err) {
        console.error(' Redis Connection Failed:', err.message);
    }
};

module.exports = { redisClient, connectRedis };
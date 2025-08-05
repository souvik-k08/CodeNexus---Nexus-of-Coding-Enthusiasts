const { createClient }  = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-15843.c256.us-east-1-2.ec2.redns.redis-cloud.com',
        port: 15843
    }
});

module.exports = redisClient;
import Redis from 'ioredis';

const { REDIS_ADDR } = process.env;

let redisClient: Redis | undefined;

if (REDIS_ADDR) {
  redisClient = new Redis(REDIS_ADDR);

  redisClient.on('error', (error: Error) => {
    if (error?.name === 'ECONNREFUSED' || error?.name === 'EAI_AGAIN') return;
    console.error(error);
  })
}

export default redisClient;

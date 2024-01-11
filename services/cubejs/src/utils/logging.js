import { devLogger } from "@cubejs-backend/server-core/dist/src/core/logger.js";
import redisClient from "./redis.js";

/**
 * Asynchronous function to log a message and an event.
 *
 * @param {string} message - The message to log.
 * @param {Object} event - The event to log.
 * @param {string} event.requestId - The ID of the request.
 * @param {string} event.path - The path of the request.
 * @param {Object} event.securityContext - The security context of the request.
 * @param {string} event.securityContext.userId - The ID of the user.
 * @param {string} event.securityContext.dataSourceId - The ID of the data source.
 * @returns {Promise} - A promise that resolves when the logging is complete.
 *
 * @throws {Error} - Throws an error if the Redis client is not ready or if the Redis command fails.
 */
export const logging = async (message, event) => {
  const requestId = event?.requestId;

  const log = devLogger("info")(message, event);

  if (log) {
    console.log(log);
  }

  if (redisClient?.status !== "ready") {
    console.warn(
      "Redis is disabled. To view logs in UI, set the REDIS_ADDR or check the connection."
    );
    return;
  }

  if (!requestId || requestId?.includes("scheduler")) {
    return;
  }

  const data = event;
  data.event = message;

  if (data.path) {
    data.path = data.path?.split("?")?.[0];
  }

  data.timestamp = new Date().toISOString();

  if (data?.securityContext) {
    data.userId = data.securityContext.userId;
    data.dataSourceId = data.securityContext.dataSourceId;

    delete data.securityContext;
  }

  await redisClient.xadd(
    "streams:cubejs-logs-stream",
    "*",
    "data",
    JSON.stringify(data)
  );
};

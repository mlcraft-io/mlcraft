import { fetchData } from './fetchDataset';
import sendExplorationScreenshot from './sendExplorationScreenshot';

import apiError from '../utils/apiError';
import generateUserAccessToken from '../utils/jwt';
import { fetchGraphQL } from '../utils/graphql';
import redisClient from '../utils/redis';

const explorationQuery = `
  query ($id: uuid!) {
    explorations_by_pk(id: $id) {
      id
      datasource_id
      user_id
      playground_state
    }
  }
`;

const checkAndTriggerAlert = async (alert) => {
  const result = {
    fired: false,
    locked: false,
    lockKey: null,
    lockValue: null,
    lockTTL: 0,
  };

  const {
    id,
    name,
    exploration,
    triggerConfig,
    deliveryType,
    deliveryConfig,
  } = alert;
  const { playground_state: playgroundState, id: explorationId, user_id: userId } = exploration;

  const lockKey = `alert:${id}:lock`;
  const lockValue = await redisClient.get(lockKey);

  if (lockValue) {
    const ttl = await redisClient.ttl(lockKey);

    result.locked = true;
    result.lockKey = lockKey;
    result.lockValue = lockValue;
    result.lockTTL = ttl;

    return result;
  }

  const requestTimeout = (parseInt(triggerConfig?.requestTimeout, 10) || 1) * 60;
  const timeoutOnFire = (parseInt(triggerConfig?.timeoutOnFire, 10) || 0) * 60;

  const lowerBound = parseFloat(triggerConfig.lowerBound, 10) || null;
  const upperBound = parseFloat(triggerConfig.upperBound, 10) || null;
  const measure = playgroundState?.measures?.[0];

  const authToken = await generateUserAccessToken(userId);

  if (!authToken) {
    throw new Error('Error while generating auth token');
  }

  await redisClient.set(lockKey, 'on request', 'EX', requestTimeout);

  let dataset = [];

  try {
    const { data } = (await fetchData(
      exploration,
      {
        userId,
      },
      authToken,
    ) || {});

    dataset = data;
  } catch (error) {
    await redisClient.del(lockKey);
    throw new Error(error);
  }

  const isMatched = !!dataset.find(row => {
    let isLowerBoundMatched = false;
    let isUpperBoundMatched = false;

    const value = parseFloat(row[measure], 10);

    if (lowerBound) {
      isLowerBoundMatched = value < lowerBound;
    }

    if (upperBound) {
      isUpperBoundMatched = value > upperBound;
    }
    
    return isLowerBoundMatched || isUpperBoundMatched;
  });

  if (!isMatched) {
    await redisClient.del(lockKey);
    return result;
  }

  const { error } = await sendExplorationScreenshot(null, {
    payload: {
      deliveryType,
      deliveryConfig,
      explorationId,
      name
    }
  });

  await redisClient.del(lockKey);

  if (error) {
    throw new Error(error);
  }

  if (timeoutOnFire > 0) {
    result.locked = true;
    result.lockKey = lockKey;
    result.lockValue = 'on fire';
    result.lockTTL = timeoutOnFire;

    await redisClient.set(lockKey, 'on fire', 'EX', timeoutOnFire);
  }

  result.fired = true;

  return result;
};

export default async (session, input) => {
  const { deliveryType, explorationId, deliveryConfig, triggerConfig, name, id } = input?.payload || {};

  const queryResult = await fetchGraphQL(explorationQuery, { id: explorationId });
  const exploration = queryResult?.data?.explorations_by_pk || {};

  const alert = {
    id,
    name,
    exploration,
    triggerConfig,
    deliveryType,
    deliveryConfig,
  };

  let result;

  try {
    result = await checkAndTriggerAlert(alert);
  } catch (error) {
    return apiError(error);
  }

  return { error: false, result };
};

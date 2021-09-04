import unchanged from 'unchanged';

import cubejsApi from '../utils/cubejsApi';
import logger from '../utils/logger';
import apiError from '../utils/apiError';
import { updatePlaygroundState } from '../utils/playgroundState';
import { fetchGraphQL } from '../utils/graphql';

const { get, getOr } = unchanged;

const explorationQuery = `
  query ($id: uuid!) {
    explorations_by_pk(id: $id) {
      id
      datasource_id
      playground_state
    }
  }
`;

export const fetchData = async (exploration, args = {}) => {
  let { playground_state: playgroundState } = exploration;

  const { 
    userId,
    renewQuery = true,
    validateMeta = true,
    format = 'json',
    limit,
    offset,
  } = args;

  if (limit) {
    playgroundState.limit = limit;
  }

  if (offset) {
    playgroundState.offset = offset;
  }

  const cubejs = cubejsApi({
    dataSourceId: exploration.datasource_id,
    userId: userId,
  });

  let updatedPlaygroundState = playgroundState;
  let skippedMembers = [];

  if (validateMeta) {
    const meta = await cubejs.meta();

    const normalizedMetaState = updatePlaygroundState(playgroundState, meta);

    updatedPlaygroundState = normalizedMetaState.updatedPlaygroundState;
    skippedMembers = normalizedMetaState.skippedMembers;
  }

  const cubeData = await cubejs.query(updatedPlaygroundState, format, {
    renewQuery,
  });

    console.log('cubeData')
    console.log(cubeData)
    console.log(updatedPlaygroundState)
    console.log(format)

  return {
    ...cubeData,
    annotation: {
      ...cubeData.annotation,
      skippedMembers
    }
  };
};

export default async (session, input) => {
  const { exploration_id: explorationId } = input || {};
  const userId = session?.['x-hasura-user-id'];

  try {
    const exploration = await fetchGraphQL(explorationQuery, { id: explorationId });

    const result = await fetchData(
      exploration?.data?.explorations_by_pk,
      {
        userId,
      }
    );

    return result;
  } catch (err) {
    logger.error(err);

    const isContinueWait = err?.progressResponse?.error;

    let progress = {
      loading: false,
    };

    if (isContinueWait) {
      progress = {
        loading: true,
        ...(err?.progressResponse?.stage),
      };
    } else {
      const errMessage = err.message || err;

      if (errMessage) {
        progress.error = errMessage;
      }
    }

    return {
      annotation: {
        skippedMembers: [],
        measures: {},
        dimensions: {},
        timeDimensions: {},
        segments: {},
      },
      data: [],
      progress,
    };
  }

  return false;
};

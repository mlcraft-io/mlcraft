import sendExplorationScreenshot from './sendExplorationScreenshot';

import apiError from '../utils/apiError';
import { fetchGraphQL } from '../utils/graphql';

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

export default async (session, input) => {
  const { explorationId, name, deliveryConfig, deliveryType } = input || {};

  const queryResult = await fetchGraphQL(explorationQuery, { id: explorationId });
  const exploration = queryResult?.data?.explorations_by_pk;

  if (!exploration) {
    return apiError('Exploration not found');
  }

  try {
    const { error } = await sendExplorationScreenshot({
      deliveryType,
      deliveryConfig,
      exploration,
      name: name
    });

    if (error) {
      return apiError(error);
    }
  } catch (e) {
    return apiError(e);
  }

  return { error: false, result: { fired: true } };
};

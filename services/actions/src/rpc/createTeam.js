import { createTeamMember, OWNER_ROLE } from './inviteTeamMember';

import { fetchGraphQL } from '../utils/graphql';
import apiError from '../utils/apiError';

const createTeamMutation = `
  mutation ($name: String) {
    insert_teams_one(object: { name: $name }) {
      id
      name
    }
  }
`;

const deleteTeamMutation = `
  mutation ($id: uuid!) {
    delete_teams_by_pk(id: $id) {
      id
    }
  }
`;

const updateAssetsMutation = `
  mutation ($userId: uuid!, $teamId: uuid!) {
    update_datasources(where: {_and: {team_id: {_is_null: true}, user_id: {_eq: $userId}}}, _set: {team_id: $teamId}) {
      affected_rows
    }
    update_dashboards(where: {_and: {team_id: {_is_null: true}}, user_id: {_eq: $userId}}, _set: {team_id: $teamId}) {
      affected_rows
    }
  }
`;

const createTeam = async ({ name }) => {
  const res = await fetchGraphQL(createTeamMutation, { name });
  return res?.data?.insert_teams_one;
};

export default async (session, input, headers) => {
  const { name } = input || {};
  const userId = session?.['x-hasura-user-id'];
  const authToken = headers?.authorization;

  let newTeam;

  try {
    newTeam = await createTeam({ name });
    const { id: teamId } = newTeam;

    if (!teamId) {
      throw new Error('No team created. Contact Administrator');
    }

    await createTeamMember({
      userId,
      teamId,
      role: OWNER_ROLE,
    });

    await fetchGraphQL(updateAssetsMutation, { teamId, userId }, authToken);

    return newTeam;
  } catch (err) {
    if (newTeam?.id) {
      await fetchGraphQL(deleteTeamMutation, { id: newTeam?.id });
    }

    return apiError(err);
  }
};

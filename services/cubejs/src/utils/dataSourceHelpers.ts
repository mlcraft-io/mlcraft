import { Version } from "../types/Version";
import { fetchGraphQL } from "./graphql";

const sourceFragment = `
  id
  name
  db_type
  db_params
  team_id
`;

const modelsFragment = `
  id
  name
  code
`;

const branchesFragment = `
  id
  name
  status
`;

const membersFragment = `
  members {
    id
    team_id
    member_roles {
      id
      team_role
      access_list {
        config
      }
    }
  }
`;

const versionsFragment = `
  versions (limit: 1, order_by: {created_at: desc}) {
    dataschemas {
      ${modelsFragment}
    }
  }
`;

const activeBranchModelsFragment = `
  branches(where: {status: {_eq: active}}) {
    ${branchesFragment}
    ${versionsFragment}
  }
`;

const selectedBranchModelsFragment = `
  branches_by_pk(id: $branchId) {
    ${branchesFragment}
    ${versionsFragment}
  }
`;

const userQuery = `
  query ($_or: [users_bool_exp!]) {
    users(where: {_or: $_or}, limit: 1) {
      datasources {
        ${sourceFragment}
        branches {
          ${branchesFragment}
          ${versionsFragment}
        }
      }
      ${membersFragment}
    }
  }
`;

const sourcesQuery = `
  {
    datasources {
      ${sourceFragment}
      ${activeBranchModelsFragment}
    }
  }
`;

const branchSchemasQuery = `
  query ($branchId: uuid!) {
    ${selectedBranchModelsFragment}
  }
`;

const upsertVersionMutation = `
  mutation ($object: versions_insert_input!) {
    insert_versions_one(
      object: $object
    ) {
      id
    }
  }
`;

const sqlCredentialsQuery = `
  query ($username: String!) {
    sql_credentials(where: {username: {_eq: $username}}) {
      id
      user_id
      user {
        ${membersFragment}
      }
      password
      username
      datasource {
        ${sourceFragment}
        ${activeBranchModelsFragment}
      }
    }
  }
`;

const dataschemasQuery = `
  query GetSchemas($_in: [uuid!]) {
    dataschemas(where: {id: {_in: $_in}}) {
      code
      name
      id
    }
  }
`;

export const findUser = async ({ userId }: ({ userId: string | undefined })) => {
  const where = {
    _or: [
      { id: { _eq: userId } },
      {
        members: {
          team: {
            members: {
              user_id: { _eq: userId },
            },
          },
        },
      },
    ],
  };

  const res = await fetchGraphQL(userQuery, {
    ...where,
  });

  const dataSources = res?.data?.users?.[0]?.datasources;
  const members = res?.data?.users?.[0]?.members;

  return {
    dataSources,
    members,
  };
};

export const findSqlCredentials = async (username: string) => {
  const res = await fetchGraphQL(sqlCredentialsQuery, { username });
  const sqlCredentials = res?.data?.sql_credentials?.[0];

  return sqlCredentials;
};

export const getDataSources = async () => {
  let res = await fetchGraphQL(sourcesQuery);
  res = res?.data?.datasources;

  return res;
};

export const createDataSchema = async (object: { authToken: string; version?: Version }) => {
  const { authToken, ...version } = object;

  let res = await fetchGraphQL(
    upsertVersionMutation,
    { object: version },
    authToken
  );
  res = res?.data?.insert_versions_one;

  return res;
};

export const findDataSchemas = async ({ branchId, authToken }: ({ branchId: string; authToken: string })) => {
  const res = await fetchGraphQL(branchSchemasQuery, { branchId }, authToken);

  const dataSchemas =
    res?.data?.branches_by_pk?.versions?.[0]?.dataschemas || [];

  return dataSchemas;
};

export const findDataSchemasByIds = async ({ ids }: ({ ids: string[] })) => {
  const res = await fetchGraphQL(dataschemasQuery, { _in: ids });

  const dataSchemas = res?.data?.dataschemas || [];

  return dataSchemas;
};

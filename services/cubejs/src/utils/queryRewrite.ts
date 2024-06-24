import { Query } from "@cubejs-backend/api-gateway";
import { Member } from "@cubejs-backend/api-gateway/dist/src/types/strings";
import { MemberExpression } from "@cubejs-backend/api-gateway/dist/src/types/query";

const getColumnsArray = (query: {
  dimensions?: (Member | MemberExpression)[];
  measures?: (Member | MemberExpression)[];
  segments?: (Member | MemberExpression)[];
}): string[] => [
  ...(query.dimensions || []).map(d => typeof d === 'string' ? d : d.name),
  ...(query.measures || []).map(m => typeof m === 'string' ? m : m.name),
  ...(query.segments || []).map(s => typeof s === 'string' ? s : s.name),
];

/**
 * Asynchronous function to rewrite a query based on the user's permissions.
 *
 * @param {Object} query - The query object.
 * @param {Object} context - The context object.
 * @param {Object} context.securityContext - The security context object.
 * @param {string} context.securityContext.dataSourceId - The ID of the data source.
 * @param {string} context.securityContext.userId - The ID of the user.
 * @param {Object} context.securityContext.config - The configuration object for the data source.
 * @param {string} context.securityContext.config.role - The role of the user.
 * @param {Object} context.securityContext.config.datasources - The datasources object for the data source.
 * @returns {Promise<Object>} - A promise that resolves to the rewritten query object.
 *
 * @throws {Error} - Throws an error if the user does not have access to the data source or to a specific cube.
 */
const queryRewrite = async (query: Query, { securityContext }: { securityContext: any }): Promise<Query> => {
  const { userScope } = securityContext;
  const { dataSourceAccessList, role } = userScope;

  if (["owner", "admin"].includes(role)) {
    return query;
  }

  if (!dataSourceAccessList) {
    throw new Error("403: You have no access to the datasource");
  }

  const queryNames = getColumnsArray(query as Query);
  const accessNames = Object.values(dataSourceAccessList as Record<string, Query>).reduce<string[]>(
    (acc, cube) => [...acc, ...getColumnsArray(cube)],
    []
  );

  queryNames.forEach((cn) => {
    if (!accessNames.includes(cn)) {
      throw new Error(`403: You have no access to "${cn}" cube property`);
    }
  });

  return query;
};

export default queryRewrite;

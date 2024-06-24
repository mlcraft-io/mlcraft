import { findSqlCredentials } from "./dataSourceHelpers";

import buildSecurityContext from "./buildSecurityContext";
import { getDataSourceAccessList } from "./defineUserScope";
import { SQLCredentials } from "../types/SQLCredenstials";

const buildSqlSecurityContext = (sqlCredentials: SQLCredentials | undefined) => {
  if (!sqlCredentials) {
    throw new Error("Incorrect user name or password");
  }

  const dataSourceId = sqlCredentials?.datasource?.id;
  const teamId = sqlCredentials?.datasource?.team_id;
  const allMembers = sqlCredentials?.user?.members;

  const dataSourceAccessList = getDataSourceAccessList(
    allMembers,
    dataSourceId,
    teamId
  );

  const dataSourceContext = buildSecurityContext(sqlCredentials?.datasource);

  return {
    dataSource: dataSourceContext,
    ...dataSourceAccessList,
  };
};

/**
 * Asynchronous function to check the SQL authentication for a user.
 *
 * @param {null} _ - Unused parameter.
 * @param {String} username - Name of the user.
 * @returns {Promise} - A promise that resolves to an object containing the password and the security context for the user.
 *
 * @throws {Error} - Throws an error if the SQL credentials for the user are not found.
 */
const checkSqlAuth = async (_: any, username: string) => {
  const sqlCredentials = await findSqlCredentials(username);

  return {
    password: sqlCredentials?.password,
    securityContext: {
      userId: sqlCredentials?.user_id,
      userScope: buildSqlSecurityContext(sqlCredentials),
    },
  };
};

export default checkSqlAuth;

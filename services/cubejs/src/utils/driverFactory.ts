import DriverDependencies from "@cubejs-backend/server-core/dist/src/core/DriverDependencies";
import VerticaDriver from "@cubejs-backend/vertica-driver";

import defineUserScope from "./defineUserScope";

const driverError = (err: any) => {
  console.error("Driver error:");

  const throwError = () => {
    throw new Error(err?.message || err);
  };

  return {
    tablesSchema: throwError,
    testConnection: throwError,
  };
};

/**
 * Factory function that creates a driver instance based on the provided security context and data source.
 * @param {Object} options - The options object.
 * @param {Object} options.securityContext - The security context object.
 * @param {Object} options.dataSource - The data source object.
 * @returns {Promise<Object>} A promise that resolves to the driver instance.
 */
const driverFactory = async ({ securityContext, dataSource }: ({ securityContext: any, dataSource: any })) => {
  const { userScope, user } = securityContext || {};

  let dbParams;
  let dbType;

  if (!dataSource || dataSource === "default") {
    dbParams = userScope.dataSource.dbParams;
    dbType = userScope.dataSource.dbType;
  } else {
    const nextUserScope = defineUserScope(
      user.dataSources,
      user.members,
      dataSource
    );

    dbParams = nextUserScope.dataSource.dbParams;
    dbType = nextUserScope.dataSource.dbType;
  }

  let driverModule;

  try {
    if (dbType === "vertica") {
      return new VerticaDriver(dbParams);
    }

    const dbDriver = DriverDependencies[dbType as keyof typeof DriverDependencies];
    driverModule = await import(dbDriver);

    if (dbType === "druid") {
      driverModule = driverModule.default;
    }

    if (dbType === "databricks-jdbc") {
      return new driverModule.DatabricksDriver(dbParams);
    }
  } catch (err) {
    return driverError(err);
  }

  const driverClass = new driverModule.default(dbParams);
  return driverClass;
};

export default driverFactory;

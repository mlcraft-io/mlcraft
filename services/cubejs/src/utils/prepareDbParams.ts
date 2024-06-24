import makeUrl from "./makeUrl";

import { DatabaseConfig } from "../types/DatabaseConfig";

const connParamValid = (port: number) => {
  const portValidation = port >= 0 && port < 65536;

  if (!portValidation) {
    throw new Error(`Port should be >= 0 and < 65536. Received ${port}.`);
  }
};

const MSSQL_DEFAULT_PORT = 1433;

/**
 * Prepares the database parameters based on the provided dbParams and dbType.
 * @param {string|object} dbParams - The database parameters. It can be either a JSON string or an object.
 * @param {string} dbType - The type of the database.
 * @returns {object} - The prepared database parameters.
 * @throws {Error} - If the dbParams are not found or incorrect, or if there are any parsing errors.
 */
const prepareDbParams = (dbParams: string | Object, dbType: string) => {
  if (!dbParams || !Object.keys(dbParams).length) {
    throw new Error("Datasource credentials not found or incorrect");
  }

  let parsedDbParams: { [key: string]: any } = {};

  if (typeof dbParams === "string") {
    try {
      parsedDbParams = JSON.parse(dbParams);
    } catch (err) {
      throw new Error("Can't parse dbParams");
    }
  } else if (typeof dbParams === "object") {
    parsedDbParams = dbParams;
  } else {
    throw new Error("Invalid dbParams type: expected a string or an object");
  }

  // clean empty/false keys because of sideeffects
  let dbConfig: DatabaseConfig = Object.keys(parsedDbParams || {})
    .filter((key: string) => !!parsedDbParams[key])
    .reduce((res: { [key: string]: any } , key) => ((res[key] = parsedDbParams[key]), res), {});

  if (dbConfig.port) {
    connParamValid(dbConfig.port);
  }

  switch (dbType) {
    case "bigquery":
      let keyFile = {};

      try {
        keyFile = JSON.parse(dbConfig.keyFile ||'');
      } catch (err) {
        throw new Error("Can't parse keyFile");
      }

      dbConfig = {
        ...dbConfig,
        credentials: { ...keyFile },
      };
      break;
    case "mssql":
      dbConfig = {
        ...dbConfig,
        server: dbConfig.host,
        port: typeof dbConfig.port === 'string' ? parseInt(dbConfig.port) : (dbConfig.port || MSSQL_DEFAULT_PORT),
      };
      break;
    case "clickhouse":
      const auth = [dbConfig.user, dbConfig.password].filter(Boolean).join(":");

      dbConfig = {
        host: dbConfig.host,
        port: dbConfig.port,
        auth,
        protocol: dbConfig.ssl ? "https:" : "http:",
        queryOptions: {
          database: dbConfig.database || "default",
        },
      };
      break;
    case "athena":
      dbConfig = {
        ...dbConfig,
        accessKeyId: dbConfig.awsKey,
        secretAccessKey: dbConfig.awsSecret,
        S3OutputLocation: dbConfig.awsS3OutputLocation,
        region: dbConfig.awsRegion,
      };
      break;
    case "elasticsearch":
      dbConfig = {
        ...dbConfig,
        queryFormat: "json",
        url: dbConfig?.url,
        auth: {
          username: dbConfig?.username,
          password: dbConfig?.password,
        },
      };

      if (dbConfig?.apiId && dbConfig?.apiKey) {
        dbConfig.auth = {
          ...(dbConfig?.auth || {}),
          apiKey: {
            id: dbConfig?.apiId,
            api_key: dbConfig?.apiKey,
          },
        };
      }
    case "snowflake":
      const account = [dbConfig.orgId, dbConfig.accountId].join("-");

      dbConfig = {
        ...dbConfig,
        account,
      };
      break;
    case "druid":
      dbConfig.url = makeUrl(dbConfig.host, dbConfig.port);
      break;
    case "ksql":
      dbConfig.url = makeUrl(dbConfig.host, dbConfig.port);
      break;
    case "firebolt":
      dbConfig.connection = {
        database: dbConfig?.database,
        username: dbConfig?.username,
        password: dbConfig?.password,
        engineName: dbConfig?.engineName,
      };
      break;
    default:
      break;
  }

  return dbConfig;
};

export default prepareDbParams;

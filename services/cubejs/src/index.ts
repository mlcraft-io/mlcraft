import ServerCore, { DatabaseType, CreateOptions, LoggerFn, DriverOptions } from "@cubejs-backend/server-core";
import { SQLServerOptions } from "@cubejs-backend/api-gateway";
import express, { Request, Response } from "express";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

import routes from "./routes/index";
import { logging } from "./utils/logging";

import { checkAuth } from "./utils/checkAuth";
import checkSqlAuth from "./utils/checkSqlAuth";
import driverFactory from "./utils/driverFactory";
import queryRewrite from "./utils/queryRewrite";
import repositoryFactory from "./utils/repositoryFactory";
import scheduledRefreshContexts from "./utils/scheduledRefreshContexts";

interface CubeStoreDriverOptions extends DriverOptions {
  host?: string;
  port?: number;
}

const {
  PORT = '',
  CUBEJS_SECRET = '',
  CUBEJS_SQL_PORT = '',
  CUBEJS_PG_SQL_PORT = '',
  CUBEJS_CUBESTORE_PORT = 3030,
  CUBEJS_CUBESTORE_HOST = 'cubestore',
  CUBEJS_TELEMETRY = false,
  CUBEJS_SCHEDULED_REFRESH = true,
  CUBEJS_REFRESH_TIMER = '60',
  CUBEJS_SQL_API = true,
} = process.env;

const port = parseInt(PORT, 10) || 4000;
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const dbType = ({ securityContext }: ({ securityContext: any })) =>
  securityContext?.userScope?.dataSource?.dbType || "none";
const contextToOrchestratorId = ({ securityContext }: ({ securityContext: any })) =>
  `CUBEJS_APP_${securityContext?.userScope?.dataSource?.dataSourceVersion}_${securityContext?.userScope?.dataSource?.schemaVersion}}`;

const contextToAppId = ({ securityContext }: ({ securityContext: any })) =>
  `CUBEJS_APP_${securityContext?.userScope?.dataSource?.dataSourceVersion}_${securityContext?.userScope?.dataSource?.schemaVersion}}`;

const schemaVersion = ({ securityContext }: ({ securityContext: any })) =>
  securityContext?.userScope?.dataSource?.schemaVersion;

const preAggregationsSchema = ({ securityContext }: ({ securityContext: any })) =>
  `pre_aggregations_${securityContext?.userScope?.dataSource?.preAggregationSchema}`;

const externalDriverFactory = () =>
  ServerCore.createDriver("cubestore", {
    host: CUBEJS_CUBESTORE_HOST,
    port: CUBEJS_CUBESTORE_PORT,
  } as CubeStoreDriverOptions);

const basePath = `/api`;

const options = {
  queryRewrite,
  contextToAppId,
  contextToOrchestratorId,
  dbType,
  devServer: false,
  checkAuth,
  apiSecret: CUBEJS_SECRET,
  basePath,
  schemaVersion,
  driverFactory,
  repositoryFactory,
  preAggregationsSchema,
  telemetry: CUBEJS_TELEMETRY,
  scheduledRefreshTimer:
    String(CUBEJS_SCHEDULED_REFRESH) !== "false"
      ? parseInt(CUBEJS_REFRESH_TIMER, 10)
      : undefined,
  scheduledRefreshContexts,
  externalDbType: "cubestore" as DatabaseType,
  externalDriverFactory,
  cacheAndQueueDriver: "cubestore",
  logger: logging as LoggerFn,
};

const sqlServerOptions = {
  pgSqlPort: parseInt(CUBEJS_PG_SQL_PORT, 10),
  sqlPort: parseInt(CUBEJS_SQL_PORT, 10),
  canSwitchSqlUser: () => false,
  checkSqlAuth,
};

const cubejs = new ServerCore(options as CreateOptions);

const file = fs.readFileSync("./src/swagger.yaml", "utf8");
const swaggerDocument = YAML.parse(file);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(routes({ basePath, cubejs }));

cubejs.initApp(app);

if (String(CUBEJS_SQL_API) === "true") {
  const sqlServer = cubejs.initSQLServer();
  sqlServer.init(sqlServerOptions as SQLServerOptions);
}

app.use((err: Error, _req: Request, res: Response) => {
  console.error(err.stack);

  res.status(500).send(err.message);
});

app.listen(port);

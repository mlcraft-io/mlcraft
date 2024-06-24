export type DatabaseConfig = {
  database?: string;
  host?: string;
  port?: number;
  keyFile?: string;
  credentials?: Object;
  server?: string;
  user?: string;
  username?: string;
  password?: string;
  auth?: Object;
  ssl?: boolean;
  protocol?: string;
  queryOptions?: {
    database?: string;
  };
  awsKey?: string;
  awsSecret?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  S3OutputLocation?: string;
  awsS3OutputLocation?: string;
  region?: string;
  awsRegion?: string;
  queryFormat?: string;
  url?: string;
  apiId?: string;
  apiKey?: string;
  connection?: Object;
  engineName?: string;
  orgId?: string;
  accountId?: string;
  account?: string;
}
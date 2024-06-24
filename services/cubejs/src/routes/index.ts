import express, { NextFunction, Request, Response } from "express";

import checkAuthMiddleware from "../utils/checkAuth";
import generateDataSchema from "./generateDataSchema";
import getSchema from "./getSchema";
import preAggregationPreview from "./preAggregationPreview";
import preAggregations from "./preAggregations";
import runSql from "./runSql";
import testConnection from "./testConnection";

import { ExtendedRequest } from "../types/ExtendedRequest";

const router = express.Router();

const extendedCheckAuth = async (req: Request, res: Response, next: NextFunction) => {
  await checkAuthMiddleware(req as ExtendedRequest, res, next);
};

export default ({ basePath, cubejs }: ({ basePath: string; cubejs: any })) => {
  router.post(`${basePath}/v1/run-sql`, extendedCheckAuth, (req: Request, res: Response) =>
    runSql(req as ExtendedRequest, res, cubejs)
  );

  router.get(`${basePath}/v1/test`, extendedCheckAuth, (req: Request, res: Response) =>
    testConnection(req as ExtendedRequest, res, cubejs)
  );

  router.get(
    `${basePath}/v1/get-schema`,
    extendedCheckAuth,
    async (req: Request, res: Response) => getSchema(req as ExtendedRequest, res, cubejs)
  );

  router.post(
    `${basePath}/v1/generate-models`,
    extendedCheckAuth,
    async (req: Request, res: Response) => generateDataSchema(req as ExtendedRequest, res, cubejs)
  );

  router.post(
    `${basePath}/v1/pre-aggregation-preview`,
    extendedCheckAuth,
    async (req: Request, res: Response) => preAggregationPreview(req as ExtendedRequest, res, cubejs)
  );

  router.get(
    `${basePath}/v1/pre-aggregations`,
    extendedCheckAuth,
    async (req: Request, res: Response) => preAggregations(req as ExtendedRequest, res, cubejs)
  );

  return router;
};

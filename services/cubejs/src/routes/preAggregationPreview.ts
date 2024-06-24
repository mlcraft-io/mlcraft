import { v4 as uuidv4 } from "uuid";
import { Response } from "express";

import { ExtendedRequest } from "../types/ExtendedRequest";

/**
 * Asynchronous function to get the pre-aggregation preview from Cube.js.
 *
 * @param {Object} req - The request object from the client.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.preAggregationId - The ID of the pre-aggregation.
 * @param {string} req.body.tableName - The name of the table.
 * @param {string} req.body.timezone - The timezone (default UTC).
 * @param {Object} req.securityContext - The security context from the request.
 * @param {Object} res - The response object to the client.
 * @param {Object} cubejs - The Cube.js server instance.
 * @returns {Promise} - A promise that resolves to the pre-aggregation preview.
 *
 * @throws {Error} - Throws an error if getting the pre-aggregation preview fails.
 */
export default async (req: ExtendedRequest, res: Response, cubejs: any) => {
  const { preAggregationId, tableName, timezone = "UTC" } = req.body || {};
  const apiGateway = cubejs.apiGateway();

  const context = {
    securityContext: {
      ...req.securityContext,
    },
    requestId: "preview-" + uuidv4(),
  };

  let previews: any;
  try {
    const query = {
      preAggregationId,
      timezone,
      versionEntry: {
        table_name: tableName,
      },
    };

    await apiGateway.getPreAggregationPreview({
      query,
      context,
      res: (result: any) => {
        previews = result;
      },
    });

    previews = previews?.preview?.data;
  } catch (e) {
    console.log(e);
  }

  res.json({ previews });
};

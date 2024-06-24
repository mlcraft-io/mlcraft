import { Response } from "express";
import { ExtendedRequest } from "../types/ExtendedRequest";

/**
 * Asynchronous function to get the pre-aggregation partitions from Cube.js.
 *
 * @param {Object} req - The request object from the client.
 * @param {Object} req.securityContext - The security context from the request.
 * @param {Object} res - The response object to the client.
 * @param {Object} cubejs - The Cube.js server instance.
 * @returns {Promise} - A promise that resolves to the pre-aggregation partitions.
 *
 * @throws {Error} - Throws an error if getting the pre-aggregation partitions fails.
 */
export default async (req: ExtendedRequest, res: Response, cubejs: any) => {
  const apiGateway = cubejs.apiGateway();

  const context = {
    securityContext: {
      ...req.securityContext,
    },
  };

  let preAggregations: any;
  await apiGateway.getPreAggregations({
    cacheOnly: false,
    context,
    res: (result: any) => {
      preAggregations = result;
    },
  });

  if (preAggregations.error) {
    res.json(preAggregations);
    return;
  }

  let partitions: any;
  try {
    const preAggregationIds = (preAggregations?.preAggregations || []).map(
      (p: any) => ({
        id: p.id,
      })
    );

    const query = {
      preAggregations: preAggregationIds,
    };

    await apiGateway.getPreAggregationPartitions({
      query,
      context,
      res: (result: any) => {
        partitions = result;
      },
    });

    partitions = partitions.preAggregationPartitions;
  } catch (e) {
    console.log(e);
  }

  res.json({ partitions });
};

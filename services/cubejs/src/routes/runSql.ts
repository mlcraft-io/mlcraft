import { Response } from 'express';
import { ExtendedRequest } from "../types/ExtendedRequest";

/**
 * Asynchronous function to run a SQL query using Cube.js.
 *
 * @param {Object} req - The request object from the client.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.query - The SQL query to run.
 * @param {Object} req.securityContext - The security context from the request.
 * @param {Object} res - The response object to the client.
 * @param {Object} cubejs - The Cube.js server instance.
 * @returns {Promise} - A promise that resolves to the result of the SQL query.
 *
 * @throws {Error} - Throws an error if running the SQL query fails.
 */
export default async (req: ExtendedRequest, res: Response, cubejs: any) => {
  const { securityContext } = req;
  const driver = await cubejs.options.driverFactory({ securityContext });

  if (!req.body.query) {
    res.status(400).json({
      code: "query_missing",
      message: "The query parameter is missing.",
    });

    return;
  }

  try {
    const rows = await driver.query(req.body.query);
    res.json(rows);
  } catch (err: any) {
    console.error(err);

    res.status(500).json({
      code: "run_sql_failed",
      message: err.message || err,
    });
  }
};

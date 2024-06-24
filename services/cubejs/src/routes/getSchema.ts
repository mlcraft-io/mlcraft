import { Response } from "express";
import { ExtendedRequest } from "../types/ExtendedRequest";

/**
 * Asynchronous function to get the schema from the database.
 *
 * @param {Object} req - The request object from the client.
 * @param {Object} req.securityContext - The security context from the request.
 * @param {Object} res - The response object to the client.
 * @param {Object} cubejs - The Cube.js server instance.
 * @returns {Promise} - A promise that resolves to the schema of the database.
 *
 * @throws {Error} - Throws an error if getting the schema fails.
 */

export default async (req: ExtendedRequest, res: Response, cubejs: any): Promise<any> => {
  const { securityContext } = req;
  const driver = await cubejs.options.driverFactory({ securityContext });

  try {
    const schema = await driver.tablesSchema();
    res.json(schema);
  } catch (err: any) {
    console.error(err);

    if (driver.release) {
      await driver.release();
    }

    res.status(500).json({
      code: "get_schema_failed",
      message: err.message,
    });
  }
};

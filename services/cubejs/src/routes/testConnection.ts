import { Response } from "express";
import { ExtendedRequest } from "../types/ExtendedRequest";

/**
 * Asynchronous function to test the database connection using Cube.js.
 *
 * @param {Object} req - The request object from the client.
 * @param {Object} req.securityContext - The security context from the request.
 * @param {Object} res - The response object to the client.
 * @param {Object} cubejs - The Cube.js server instance.
 * @returns {Promise} - A promise that resolves to a JSON object indicating the status of the connection.
 *
 * @throws {Error} - Throws an error if testing the connection fails.
 */
export default async (req: ExtendedRequest, res: Response, cubejs: any) => {
  const { securityContext } = req;
  const driver = await cubejs.options.driverFactory({ securityContext });

  try {
    await driver.testConnection();

    res.json({
      code: "ok",
      message: "Connection is OK",
    });
  } catch (err: any) {
    console.error(err);

    res.status(500).json({
      code: "test_connection_failed",
      message: err.message || err,
    });
  }
};

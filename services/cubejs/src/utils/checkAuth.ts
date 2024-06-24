import jwt, { Algorithm, JwtPayload } from "jsonwebtoken";
import { NextFunction, RequestHandler, Response } from "express";

import { findUser } from "./dataSourceHelpers";
import defineUserScope from "./defineUserScope";

import { Payload } from "../types/Hasura";
import { ExtendedRequest } from "../types/ExtendedRequest";

const { JWT_KEY = '', JWT_ALGORITHM = 'HS256' } = process.env;

interface ExtendedJwtPayload extends JwtPayload {
  hasura?: Payload;
}

/**
 * Checks the authorization of the request and sets the security context.
 *
 * @param {Object} req - The request object.
 * @throws {Error} If the Hasura Authorization token is not provided.
 * @throws {Error} If no x-hasura-datasource-id is provided in the headers.
 * @throws {Error} If there are no permissions for the specified data source.
 * @throws {Error} If there is no default branch for the specified data source.
 * @throws {Error} If the specified data source is not found.
 * @returns {Promise<void>} A promise that resolves when the security context is set.
 */
const checkAuth = async (req: ExtendedRequest) => {
  // Extract the authorization header from the request
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new Error("Provide Hasura Authorization token");
  }

  // Extract the data source ID from the request headers
  const dataSourceId = req.headers["x-hasura-datasource-id"];
  // Extract the branch ID from the request headers
  const branchId = req.headers["x-hasura-branch-id"] as string;
  // Extract the branch version ID from the request headers
  const branchVersionId = req.headers["x-hasura-branch-version-id"] as string;

  let jwtDecoded: ExtendedJwtPayload;
  let authToken;

  if (authHeader.startsWith("Bearer ")) {
    authToken = authHeader.split(" ")[1];
  } else {
    authToken = authHeader;
  }

  if (!authToken) {
    throw new Error("Provide Hasura Authorization token");
  }

  try {
    jwtDecoded = jwt.verify(authToken, JWT_KEY, {
      algorithms: [JWT_ALGORITHM as Algorithm],
    }) as ExtendedJwtPayload;
  } catch (err) {
    throw err;
  }

  const { "x-hasura-user-id": userId } = jwtDecoded?.hasura || {};

  if (!dataSourceId) {
    throw new Error(
      "400: No x-hasura-datasource-id provided, headers: " +
        JSON.stringify(req.headers)
    );
  }

  const user = await findUser({
    userId,
  });

  if (!user.dataSources?.length || !user.members?.length) {
    throw new Error(`404: user "${userId}" not found`);
  }

  const userScope = defineUserScope(
    user.dataSources,
    user.members,
    dataSourceId,
    branchId,
    branchVersionId
  );

  req.securityContext = {
    authToken,
    userId,
    userScope,
  };
};

const checkAuthMiddleware = async (req: ExtendedRequest, _res: Response, next: NextFunction) => {
  try {
    await checkAuth(req);
    next();
  } catch (err) {
    next(err);
  }
};

export { checkAuth };
export default checkAuthMiddleware;

import { Request } from "express";

export interface ExtendedRequest extends Request {
  securityContext: {
    authToken: string;
    userId: string | undefined;
    userScope: any;
  };
}
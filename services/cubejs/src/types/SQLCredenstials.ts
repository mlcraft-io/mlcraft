import { Datasource } from "./Datasource";

export type SQLCredentials = {
  datasource: Datasource;
  user: {
    members: string[];
  }
}
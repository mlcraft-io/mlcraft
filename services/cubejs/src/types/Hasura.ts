export type Headers = {
  "x-hasura-admin-secret"?: string;
  authorization?: string;
};

export type Payload = {
  "x-hasura-user-id": string;
};
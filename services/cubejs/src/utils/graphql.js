import fetch from "node-fetch";

const HASURA_ENDPOINT = process.env.HASURA_ENDPOINT;
const HASURA_GRAPHQL_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

export const fetchGraphQL = async (query, variables, authToken) => {
  const headers = {
    "x-hasura-admin-secret": HASURA_GRAPHQL_ADMIN_SECRET,
  };

  if (authToken) {
    headers.authorization = `Bearer ${authToken}`;
    delete headers["x-hasura-admin-secret"];
  }

  console.log(query);
  console.log("headers: ", headers);

  const result = await fetch(HASURA_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      query,
      variables,
    }),
    headers,
  });

  const res = await result.json();

  if (res.errors) {
    throw new Error(JSON.stringify(res.errors));
  }

  return res;
};

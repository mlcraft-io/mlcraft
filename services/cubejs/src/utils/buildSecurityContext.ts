import JSum from "jsum";

import createMd5Hex from "./md5Hex";
import prepareDbParams from "./prepareDbParams";

import { Datasource } from "../types/Datasource";
import { Branch } from "../types/Branch";
import { Version } from "../types/Version";

/**
 * Function to build the security context for a given data source.
 *
 * @param {Object} dataSource - The data source object.
 * @param {string} dataSource.id - The ID of the data source.
 * @param {string} dataSource.db_type - The type of the database.
 * @param {Object} dataSource.db_params - The parameters for the database connection.
 * @param {Array} dataSource.dataschemas - The data schemas for the data source.
 * @returns {Object} - The security context for the data source.
 *
 * @throws {Error} - Throws an error if no data source or no dbParams are provided.
 */
const buildSecurityContext = (
  dataSource: Datasource | undefined,
  branch?: Branch | undefined,
  version?: Version | undefined
) => {
  if (!dataSource) {
    throw new Error("No dataSource provided");
  }

  if (!dataSource?.db_params) {
    throw new Error("No dbParams provided");
  }

  const data = {
    dataSourceId: dataSource.id,
    dbType: dataSource.db_type?.toLowerCase(),
    dbParams: dataSource.db_params,
  };

  data.dbParams = prepareDbParams(data.dbParams, data.dbType);

  const dataSourceVersion = JSum.digest(data, "SHA256", "hex");

  const dataModels =
    version?.dataschemas ||
    branch?.versions?.[0]?.dataschemas ||
    dataSource.branches?.[0]?.versions?.[0]?.dataschemas ||
    [];

  const files = dataModels.map((schema: { id: any; }) => schema.id);

  const schemaVersion = createMd5Hex(files);
  const preAggregationSchema = createMd5Hex(data.dataSourceId);

  return {
    ...data,
    dataSourceVersion,
    preAggregationSchema,
    schemaVersion,
    files,
  };
};

export default buildSecurityContext;

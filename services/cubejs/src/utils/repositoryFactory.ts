import mapSchemaToFile from "./mapSchemaToFile";
import { findDataSchemasByIds } from "./dataSourceHelpers";

/**
 * Generates documentation for the repository factory.
 * @param {Object} options - The options for the repository factory.
 * @param {Object} options.securityContext - The security context.
 * @returns {Object} - The repository factory object.
 */
const repositoryFactory = ({ securityContext }: ({ securityContext: any })) => {
  return {
    /**
     * Retrieves the data schema files.
     * @returns {Array} - The data schema files.
     */
    dataSchemaFiles: async () => {
      const ids = securityContext?.userScope?.dataSource?.files;
      const dataSchemas = await findDataSchemasByIds({ ids });

      return dataSchemas.map(mapSchemaToFile);
    },
    localPath: () => 'schema',
  };
};

export default repositoryFactory;

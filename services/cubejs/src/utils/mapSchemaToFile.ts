/**
 * Function to map a schema to a file object.
 *
 * @param {Object} schema - The schema object.
 * @param {string} schema.name - The name of the schema.
 * @param {string} schema.code - The code of the schema.
 * @returns {Object} - The file object, which includes the file name, a read-only flag, and the content of the file.
 */
const mapSchemaToFile = (schema: { name: any; code: any; }) => ({
  fileName: schema.name,
  readOnly: true,
  content: schema.code,
});

export default mapSchemaToFile;

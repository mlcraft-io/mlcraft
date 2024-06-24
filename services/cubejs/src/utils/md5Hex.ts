import crypto from "crypto";

/**
 * Function to create an MD5 hash of the given data.
 *
 * @param {string|Object} data - The data to hash. If it's an object, it will be converted to a JSON string.
 * @returns {string} - The MD5 hash of the data, as a hexadecimal string.
 */
const createMd5Hex = (data: string) => {
  let source = data;

  if (typeof data === "object") {
    source = JSON.stringify(data);
  }

  const hex = crypto.createHash("md5").update(source).digest("hex");

  return hex;
};

export default createMd5Hex;

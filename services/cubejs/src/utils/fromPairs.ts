/**
 * Function to convert an array of key-value pairs into an object.
 *
 * @param {Array} pairs - An array of key-value pairs, where each pair is an array of two elements: the key and the value.
 * @returns {Object} - An object that contains the keys and values from the pairs.
 */
export default (pairs: [string, any][]): object => {
  const result: Record<string, any> = {};
  let idx = 0;

  while (idx < pairs.length) {
    result[pairs[idx][0]] = pairs[idx][1];
    idx += 1;
  }

  return result;
};

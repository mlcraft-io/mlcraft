const addHttpPrefix = (host: string) => {
  if (!host.startsWith("http://") && !host.startsWith("https://")) {
    return "http://" + host;
  }
  return host;
};

/**
 * Function to create a URL from a host and a port.
 *
 * @param {string|undefined} rawHost - The host for the URL, which may or may not start with "http://" or "https://".
 * @param {number|string} port - The port for the URL.
 * @returns {string} - The URL, which starts with "http://" or "https://", followed by the host and the port.
 */
const makeUrl = (rawHost: string | undefined, port: number | undefined) => {
  if (!rawHost || port) {
    return '';
  }
  const host = addHttpPrefix(rawHost);
  const url = [host, port].join(":");

  return url;
};

export default makeUrl;

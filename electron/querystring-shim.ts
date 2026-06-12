/**
 * @module querystring-shim
 * Webpack aliases the Node `querystring` module to this file in renderer
 * bundles. Only `parse` and `stringify` are implemented - the window entry
 * points parse their startup parameters from the location search, and the
 * login form encodes its POST body.
 *
 * note: Duplicate keys keep the last value instead of becoming an array;
 * note: the startup parameters never repeat keys.
 */

export function parse(input: string): { [key: string]: string | undefined } {
  const result: { [key: string]: string | undefined } = {};
  for (const [key, value] of new URLSearchParams(input)) result[key] = value;
  return result;
}

export function stringify(input: {
  [key: string]: string | number | boolean | undefined | null;
}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input))
    params.append(key, value === undefined || value === null ? '' : `${value}`);
  return params.toString();
}

export default { parse, stringify };

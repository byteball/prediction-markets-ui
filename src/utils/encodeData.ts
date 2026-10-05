/** JSON → base64 (UTF-8 safe), the `base64data` payload of Obyte payment URIs. */
export const encodeData = (data: unknown): string => {
  const sData = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(sData)));
};

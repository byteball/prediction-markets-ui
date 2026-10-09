export const encodeData = (data: unknown): string => {
  const sData = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(sData)));
};

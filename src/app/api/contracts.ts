export const initializeRoutePath = "/api/initialize";
export const configsRoutePath = "/api/configs";
export const filesRoutePath = (prefix?: string): string => {
  if (!prefix) {
    return "/api/files";
  }
  return `/api/files?${new URLSearchParams({ prefix }).toString()}`;
};

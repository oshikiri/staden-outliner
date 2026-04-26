export const filesRoutePath = (prefix?: string): string => {
  if (!prefix) {
    return "/api/files";
  }
  return `/api/files?${new URLSearchParams({ prefix }).toString()}`;
};

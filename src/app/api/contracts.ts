export const initializeRoutePath = "/api/initialize";
export const configsRoutePath = "/api/configs";
export const filesRoutePath = (prefix?: string): string => {
  if (!prefix) {
    return "/api/files";
  }
  return `/api/files?${new URLSearchParams({ prefix }).toString()}`;
};

export const pageRoutePath = (title: string): string => {
  return `/api/pages/${encodeURIComponent(title)}`;
};

export const pageBacklinksRoutePath = (title: string): string => {
  return `${pageRoutePath(title)}/backlinks`;
};

export const pageUpdateMarkdownRoutePath = (title: string): string => {
  return `${pageRoutePath(title)}/update_markdown`;
};

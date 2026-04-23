export interface Configs {
  favorites: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isConfigs(value: unknown): value is Configs {
  return (
    isRecord(value) &&
    Array.isArray(value.favorites) &&
    value.favorites.every((favorite) => typeof favorite === "string")
  );
}

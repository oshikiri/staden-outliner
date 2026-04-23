// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore?tab=readme-ov-file#_chunk
export function chunk<T>(input: T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new TypeError("chunk size must be a positive integer");
  }

  return input.reduce<T[][]>((acc, item, index) => {
    if (index % size === 0) {
      acc.push([item]);
      return acc;
    }

    acc[acc.length - 1].push(item);
    return acc;
  }, []);
}

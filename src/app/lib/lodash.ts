// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore?tab=readme-ov-file#_chunk
export function chunk<T>(input: T[], size: number): T[][] {
  if (size < 1) {
    return [];
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

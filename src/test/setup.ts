import { afterEach, jest, mock } from "bun:test";

afterEach(() => {
  jest.restoreAllMocks();
  mock.restore();
});

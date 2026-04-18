import { noContentResponse } from "../_shared/http";
import { initializeDatabase } from "./usecase";

export async function POST() {
  await initializeDatabase();
  return noContentResponse();
}

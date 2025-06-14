import { getAllConfigs } from "@/app/lib/file/config";

export async function GET() {
  const configs = await getAllConfigs();
  return new Response(JSON.stringify(configs), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

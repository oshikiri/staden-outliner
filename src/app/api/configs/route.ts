import { getAllConfigs } from "@/app/lib/file/config";

export async function GET() {
  const configs = await getAllConfigs();
  // RV: Consider adding cache headers (or Next revalidate) if configs rarely change.
  return new Response(JSON.stringify(configs), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

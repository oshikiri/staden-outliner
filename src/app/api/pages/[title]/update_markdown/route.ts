import { exportOnePageToMarkdown } from "@/app/lib/exporter/incremental_exporter";

type Props = {
  // @owner `params` should be a plain object in Next.js route handlers; using Promise forces `await` unnecessarily.
  params: Promise<{
    title: string;
  }>;
};

export async function POST(_req: Request, props: Props) {
  const { title } = await props.params;

  await exportOnePageToMarkdown(title);

  return new Response("{}", {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

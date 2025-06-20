import { exportOnePageToMarkdown } from "@/app/lib/exporter/incremental_exporter";

type Props = {
  params: Promise<{
    title: string;
  }>;
};

export async function GET(_req: Request, props: Props) {
  const { title } = await props.params;

  await exportOnePageToMarkdown(title);

  return new Response("{}", {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

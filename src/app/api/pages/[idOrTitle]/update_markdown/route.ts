import { exportOnePageToMarkdown } from "@/app/lib/exporter/incremental_exporter";

type Props = {
  params: Promise<{
    idOrTitle: string;
  }>;
};

export async function GET(_req: Request, props: Props) {
  const { idOrTitle } = await props.params;

  await exportOnePageToMarkdown(idOrTitle);

  return new Response("{}", {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

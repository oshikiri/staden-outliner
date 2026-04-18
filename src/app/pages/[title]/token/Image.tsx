import { JSX } from "react";

import { apiUrl } from "@/app/lib/client/api";
import { Image as ImageEntity } from "@/app/lib/markdown/token";

export function Image({ token }: { token: ImageEntity }): JSX.Element {
  return (
    // The image is served from a separate API origin, so Next's optimizer is not used here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={token.alt}
      src={apiUrl(`/api/images?path=${token.src}`)}
      width={Number(token.width || 100)}
      height={Number(token.height || 100)}
    />
  );
}

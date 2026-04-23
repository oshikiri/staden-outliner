import { JSX } from "react";

import { Image as ImageEntity } from "@/shared/markdown/token";

export function Image({ token }: { token: ImageEntity }): JSX.Element {
  return (
    <img
      alt={token.alt}
      src={`/api/images?path=${token.src}`}
      width={Number(token.width || 100)}
      height={Number(token.height || 100)}
    />
  );
}

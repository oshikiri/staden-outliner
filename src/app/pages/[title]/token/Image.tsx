import { JSX } from "react";
import NextImage from "next/image";

import { Image as ImageEntity } from "@/app/lib/markdown/token";

export function Image({ token }: { token: ImageEntity }): JSX.Element {
  return (
    <NextImage
      alt={token.alt}
      src={`/api/images?path=${token.src}`}
      width={Number(token.width || 100)}
      height={Number(token.height || 100)}
    />
  );
}

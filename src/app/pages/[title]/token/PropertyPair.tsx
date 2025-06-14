import { JSX } from "react";
import { PageRef, Token } from ".";
import {
  Token as TokenEntity,
  Text as TextEntity,
  PropertyPair as PropertyPairEntity,
  PageRef as PageRefEntity,
} from "@/app/lib/markdown/token";

function isText(token: TokenEntity): token is TextEntity {
  return token instanceof TextEntity;
}

export function PropertyPair({
  token,
}: {
  token: PropertyPairEntity;
}): JSX.Element {
  const disabledKeys = ["collapsed", "id"];
  if (isText(token.key) && disabledKeys.includes(token.key.textContent)) {
    return <></>;
  }

  return (
    <p
      className="
      bg-black/20
      my-0
    "
    >
      <PageRef pageref={new PageRefEntity(token.key.toText())} />
      ::{" "}
      {token.value.map((c, i) => (
        <Token key={i} token={c} />
      ))}
    </p>
  );
}

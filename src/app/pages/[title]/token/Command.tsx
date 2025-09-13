import { JSX } from "react";
import { Token } from ".";
import { Command as CommandEntity } from "@/app/lib/markdown/token";

export function Command({
  token,
}: {
  token: CommandEntity;
}): JSX.Element | null {
  if (token.name === "embed") {
    return (
      <div className="bg-gray-200">
        {token.resolvedContent?.map((c, i) => (
          <Token key={i} token={c} />
        ))}
      </div>
    );
  }
  // Return nothing if the name is unknown
  console.warn(`Unknown command name: ${token.name}`);
  return null;
}

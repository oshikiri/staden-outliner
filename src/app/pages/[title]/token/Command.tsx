import { JSX } from "react";
import { Token } from ".";
import { Command as CommandEntity } from "@/shared/markdown/token";
import { logWarn } from "@/shared/logger";

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
  logWarn(`Unknown command name: ${token.name}`);
  return null;
}

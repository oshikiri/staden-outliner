import { JSX, useState } from "react";

import { getErrorMessage } from "@/client/error";
import { pageRpc } from "@/client/rpc/page";
import { logError } from "@/shared/logger";

import { RpcErrorMessage } from "../RpcErrorMessage";

export function ReflectToMarkdown({
  pageTitle,
}: {
  pageTitle: string;
}): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onClick = () => {
    setIsLoading(true);
    setErrorMessage(null);
    void pageRpc
      .reflectMarkdown(pageTitle)
      .then(() => {
        setIsLoading(false);
      })
      .catch((error) => {
        logError("Failed to reflect markdown", error);
        setIsLoading(false);
        setErrorMessage(getErrorMessage(error, "Failed to reflect markdown"));
      });
  };

  return (
    <div>
      <button
        type="button"
        className="underline disabled:cursor-wait"
        disabled={isLoading}
        onClick={onClick}
      >
        {isLoading ? "Reflecting..." : "Reflect to markdown"}
      </button>
      {errorMessage ? (
        <RpcErrorMessage
          title="Failed to reflect markdown"
          message={errorMessage}
        />
      ) : null}
    </div>
  );
}

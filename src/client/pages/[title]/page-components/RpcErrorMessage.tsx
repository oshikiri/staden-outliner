import { JSX } from "react";

export function RpcErrorMessage({
  message,
  title,
}: {
  message: string;
  title: string;
}): JSX.Element {
  return (
    <div
      className="
        mt-2 rounded-md border border-red-500/30 bg-red-500/10
        px-3 py-2 text-sm text-red-700
      "
      role="alert"
    >
      <div className="font-medium">{title}</div>
      <div className="break-all">{message}</div>
    </div>
  );
}

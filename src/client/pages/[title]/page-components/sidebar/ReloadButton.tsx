import { JSX, useState } from "react";
import { systemRpc } from "@/client/rpc/system";

export function ReloadButton(): JSX.Element {
  const [reloadStatus, setReloadStatus] = useState("reload completed");
  const onClick = () => {
    setReloadStatus("reloading");
    systemRpc
      .initialize()
      .then(() => {
        setReloadStatus("reload completed");
      })
      .catch(() => {
        setReloadStatus("reload failed");
      });
  };
  return <div onClick={onClick}>{reloadStatus}</div>;
}

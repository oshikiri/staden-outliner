import { JSX, useState } from "react";
import { apiFetch } from "@/app/lib/client/api";

export function ReloadButton(): JSX.Element {
  const [reloadStatus, setReloadStatus] = useState("reload completed");
  const onClick = () => {
    setReloadStatus("reloading");
    apiFetch("/api/initialize", {
      method: "POST",
    }).then((response) => {
      if (!response.ok) {
        setReloadStatus("reload failed");
        return;
      }
      setReloadStatus("reload completed");
    });
  };
  return <div onClick={onClick}>{reloadStatus}</div>;
}

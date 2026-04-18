import { JSX, useState } from "react";
import { apiFetch } from "@/app/lib/client/api";
import {
  expectNoContentResponse,
  initializeRoutePath,
} from "@/app/api/contracts";

export function ReloadButton(): JSX.Element {
  const [reloadStatus, setReloadStatus] = useState("reload completed");
  const onClick = () => {
    setReloadStatus("reloading");
    apiFetch(initializeRoutePath, {
      method: "POST",
    })
      .then(expectNoContentResponse)
      .then(() => {
        setReloadStatus("reload completed");
      })
      .catch(() => {
        setReloadStatus("reload failed");
      });
  };
  return <div onClick={onClick}>{reloadStatus}</div>;
}

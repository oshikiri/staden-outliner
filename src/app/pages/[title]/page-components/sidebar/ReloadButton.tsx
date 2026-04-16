import { JSX, useState } from "react";

export function ReloadButton(): JSX.Element {
  const [reloadStatus, setReloadStatus] = useState("reload completed");
  const onClick = () => {
    setReloadStatus("reloading");
    fetch("/api/initialize", {
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

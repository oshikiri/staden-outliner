import { JSX, useState } from "react";

export function ReloadButton(): JSX.Element {
  const [reloadStatus, setReloadStatus] = useState("reload completed");
  const onClick = () => {
    fetch("/api/initialize", {
      method: "POST",
    }).then(() => {
      setReloadStatus("reload completed");
    });
    setReloadStatus("reloading");
  };
  return <div onClick={onClick}>{reloadStatus}</div>;
}

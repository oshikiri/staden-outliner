import { JSX, useState } from "react";

export function ReloadButton(): JSX.Element {
  const [reloadStatus, setReloadStatus] = useState("reload completed");
  const onClick = () => {
    // RV: Triggering DB initialization via a public GET is unsafe; restrict to authorized users and use POST.
    // RV: Missing error handling; update UI on failure and consider disabling button during request.
    fetch("/api/initialize").then(() => {
      setReloadStatus("reload completed");
    });
    setReloadStatus("reloading");
  };
  return <div onClick={onClick}>{reloadStatus}</div>;
}

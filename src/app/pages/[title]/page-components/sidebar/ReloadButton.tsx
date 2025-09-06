// RV: Mark as client component; hooks require 'use client'.
import { JSX, useState } from "react";

export function ReloadButton(): JSX.Element {
  const [reloadStatus, setReloadStatus] = useState("reload completed");
  const onClick = () => {
    fetch("/api/initialize").then(() => {
      setReloadStatus("reload completed");
    });
    setReloadStatus("reloading");
  };
  return <div onClick={onClick}>{reloadStatus}</div>;
}

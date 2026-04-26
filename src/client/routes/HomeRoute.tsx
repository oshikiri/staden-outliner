import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { StadenDate } from "@/shared/date";

export function HomeRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    const title = new StadenDate().format();
    navigate(`/pages/${encodeURIComponent(title)}`, { replace: true });
  }, [navigate]);

  return null;
}

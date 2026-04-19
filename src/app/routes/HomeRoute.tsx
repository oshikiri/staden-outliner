import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { HomeScreen } from "@/app/home/HomeScreen";

export function HomeRoute() {
  const navigate = useNavigate();

  const navigateToPage = useCallback(
    (path: string) => {
      navigate(path, { replace: true });
    },
    [navigate],
  );

  return <HomeScreen navigateToPage={navigateToPage} />;
}

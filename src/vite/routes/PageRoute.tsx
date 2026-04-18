import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";

import { PageScreen } from "@/app/pages/[title]/PageScreen";

export function PageRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const title = params.title ?? "";
  const pathname = location.pathname;
  const navigateToPage = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  if (!title) {
    return null;
  }

  return (
    <PageScreen
      title={title}
      pathname={pathname}
      navigateToPage={navigateToPage}
    />
  );
}

import { useLocation, useNavigate, useParams } from "react-router-dom";

import { PageScreen } from "@/client/pages/[title]/PageScreen";

export function PageRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const title = params.title ?? "";
  const pathname = location.pathname;

  if (!title) {
    return null;
  }

  return (
    <PageScreen title={title} pathname={pathname} navigateToPage={navigate} />
  );
}

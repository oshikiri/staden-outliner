import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { HomeRoute } from "@/app/routes/HomeRoute";
import { PageRoute } from "@/app/routes/PageRoute";

export function App() {
  return (
    <div className="min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/pages/:title" element={<PageRoute />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

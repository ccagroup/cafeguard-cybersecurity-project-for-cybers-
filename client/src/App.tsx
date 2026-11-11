import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import { Alerts } from "./pages/Alerts";
import { Attendants } from "./pages/Attendants";
import { Audit } from "./pages/Audit";
import { IncidentDetail } from "./pages/IncidentDetail";
import { Incidents } from "./pages/Incidents";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";
import { Stations } from "./pages/Stations";

// Heavy pages load on demand: the landing page brings animation code, the
// dashboard brings the chart library. Nobody downloads what they do not use.
const Landing = lazy(() => import("./pages/Landing").then((m) => ({ default: m.Landing })));
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));

function PageLoading() {
  return (
    <div className="page-loading" role="status">
      <span className="visually-hidden">Loading…</span>
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="stations" element={<Stations />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="incidents/:id" element={<IncidentDetail />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="audit" element={<Audit />} />
          <Route path="attendants" element={<Attendants />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import { Dashboard } from "./pages/Dashboard";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";
import { Placeholder } from "./pages/Placeholder";
import { Stations } from "./pages/Stations";

export function App() {
  return (
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
        <Route path="incidents" element={<Placeholder title="Incidents" />} />
        <Route path="incidents/:id" element={<Placeholder title="Incident" />} />
        <Route path="alerts" element={<Placeholder title="Alerts" />} />
        <Route path="audit" element={<Placeholder title="Audit trail" />} />
        <Route path="attendants" element={<Placeholder title="Attendants" />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

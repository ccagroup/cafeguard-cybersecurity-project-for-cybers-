import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="auth-page">
      <main className="auth-card">
        <h1>Page not found</h1>
        <p className="lede">The page you are looking for does not exist or has moved.</p>
        <Link className="btn btn-primary" to="/app">
          Go to the dashboard
        </Link>
      </main>
    </div>
  );
}

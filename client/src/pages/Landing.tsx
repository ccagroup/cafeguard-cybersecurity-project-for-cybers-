import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";
import { Logo } from "../components/Logo";

export function Landing() {
  usePageTitle("Protect customer accounts on shared PCs");
  return (
    <div className="auth-page">
      <Logo size={48} />
      <main className="auth-card">
        <h1>CaféGuard</h1>
        <p className="lede">The full landing page is built in a later step.</p>
        <Link className="btn btn-primary" to="/login">
          Sign in
        </Link>
      </main>
    </div>
  );
}

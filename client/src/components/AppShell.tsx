import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  ScrollText,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Logo } from "./Logo";

const links = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/stations", label: "Stations", icon: Monitor },
  { to: "/app/incidents", label: "Incidents", icon: ShieldAlert },
  { to: "/app/alerts", label: "Alerts", icon: Bell },
  { to: "/app/audit", label: "Audit trail", icon: ScrollText },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  const items = [
    ...links,
    ...(user?.role === "ADMIN"
      ? [{ to: "/app/attendants", label: "Attendants", icon: Users, end: false }]
      : []),
  ];

  return (
    <div className="shell">
      <a className="skip-link" href="#content">
        Skip to content
      </a>

      <header className="mobile-bar">
        <span className="brand">
          <Logo size={24} />
          CaféGuard
        </span>
        <button
          className="btn btn-secondary btn-small"
          aria-expanded={open}
          aria-controls="sidebar"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          {open ? "Close" : "Menu"}
        </button>
      </header>

      <aside id="sidebar" className={open ? "sidebar open" : "sidebar"}>
        <span className="brand">
          <Logo size={26} />
          CaféGuard
        </span>
        <nav aria-label="Main">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-link">
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div>
            <p className="user-name">{user?.name}</p>
            <p className="user-role">{user?.role === "ADMIN" ? "Admin" : "Attendant"}</p>
          </div>
          <button className="btn btn-secondary btn-small" onClick={() => void logout()}>
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <main id="content" className="main">
        <div className="main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

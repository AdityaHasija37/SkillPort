import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth.jsx";
import { Avatar, Logo } from "./ui.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // New page: close the mobile menu and start at the top.
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const links = [
    { to: "/", label: "Browse", end: true },
    user && { to: "/dashboard", label: "My learning" },
    user?.role === "instructor" && { to: "/teach", label: "Teach" },
  ].filter(Boolean);

  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="header">
        <div className="container header-inner">
          <Logo />
          <button type="button" className="menu-btn" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((o) => !o)}>
            <span className="sr-only">Menu</span>
            <span aria-hidden>{open ? "✕" : "☰"}</span>
          </button>
          <nav id="site-nav" className={`nav ${open ? "nav-open" : ""}`} aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
                {l.label}
              </NavLink>
            ))}
            <span className="nav-spacer" />
            {user ? (
              <>
                <Link to="/profile" className="nav-user">
                  <Avatar name={user.name} size={30} />
                  <span>{user.name.split(" ")[0]}</span>
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="nav-link">
                  Sign in
                </NavLink>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Join free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <Logo />
          <p className="muted">Learn. Share. Grow. Anyone can teach a course; everyone learns together.</p>
          <p className="muted small">
            <a href="https://github.com/AdityaHasija37/SkillPort">Source on GitHub</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

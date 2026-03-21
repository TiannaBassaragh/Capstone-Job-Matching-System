import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./styles/Sidebar.css";

const icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  matches: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  resume: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h5.5l3.5 3.5V14H4V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M9.5 2v4h4" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6 8.5h4M6 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  jobs: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 8h12" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  ),
  newjob: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h5.5l3.5 3.5V14H4V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M9.5 2v4h4" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 7.5v5M5.5 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  notifications: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2a4 4 0 00-4 4v3l-1 1.5h10L12 9V6a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

const candidateNav = [
  { id: "candidate", label: "Dashboard", icon: "dashboard", path: "/dashboard-c" },
  { label: "MAIN", section: true },
  { id: "matches", label: "My matches", icon: "matches", badge: "6", path: "/matches" },
  { id: "resume", label: "Upload resume", icon: "resume", path: "/upload-resume" },
  { label: "ACCOUNT", section: true },
  { id: "notifications", label: "Notifications", icon: "notifications", badge: "3", path: "/notifications" },
  { id: "settings", label: "Settings & profile", icon: "settings", path: "/settings" },
];

const employerNav = [
  { id: "employer", label: "Dashboard", icon: "dashboard", path: "/dashboard-e" },
  { label: "JOBS", section: true },
  { id: "jobs", label: "Job listings", icon: "jobs", badge: "2", badgeWarn: true, path: "/jobs" },
  { id: "newjob", label: "Post new job", icon: "newjob", path: "/jobs/new-job" },
  { label: "ACCOUNT", section: true },
  { id: "notifications", label: "Notifications", icon: "notifications", badge: "5", path: "/notifications" },
  { id: "settings", label: "Settings & profile", icon: "settings", path: "/settings" },
];

export default function Sidebar({
  userType = "candidate",
  userName = "Alex Johnson",
  userInitials = "AJ",
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const nav = userType === "candidate" ? candidateNav : employerNav;

  const handleNav = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      {/* Backdrop — clicking outside closes sidebar */}
      {open && <div className="sb-backdrop" onClick={() => setOpen(false)} />}

      {/* Floating toggle button — always visible */}
      <button
        className={`sb-toggle${open ? " sb-toggle--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? icons.close : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 5h12M3 9h12M3 13h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* Sidebar panel */}
      <aside className={`sb-panel${open ? " sb-panel--open" : ""}`}>

        <div className="sb-logo">
          <div className="sb-logo-mark">
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="5.5" cy="5.5" r="3" stroke="#fff" strokeWidth="1.4"/>
              <circle cx="10.5" cy="10.5" r="3" stroke="#93b8fb" strokeWidth="1.4"/>
              <path d="M7.5 7.5l1 1" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="sb-logo-name">Job Matcher ♡ </div>
            <div className="sb-logo-tag">{userType === "candidate" ? "Job seeker" : "Employer"}</div>
          </div>
        </div>

        <nav className="sb-nav">
          {nav.map((item, i) => {
            if (item.section) {
              return <div key={i} className="sb-section-label">{item.label}</div>;
            }
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                className={`sb-item${isActive ? " sb-item--active" : ""}`}
                onClick={() => handleNav(item.path)}
              >
                <span className="sb-icon">{icons[item.icon]}</span>
                {item.label}
                {item.badge && (
                  <span className={`sb-badge${item.badgeWarn ? " sb-badge--warn" : ""}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sb-footer">
          <div className="sb-user" onClick={() => handleNav('/settings/profile')}>
            <div className="sb-user-avatar">{userInitials}</div>
            <div>
              <div className="sb-user-name">{userName}</div>
              <div className="sb-user-role">{userType === "candidate" ? "Candidate" : "Employer"}</div>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}

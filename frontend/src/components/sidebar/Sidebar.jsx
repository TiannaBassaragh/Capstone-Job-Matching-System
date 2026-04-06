import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/format";
import { icons } from "./SidebarIcons";
import { candidateNav, employerNav } from "./SidebarData";
import "./Sidebar.css";

export default function Sidebar({}) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { auth, logout } = useAuth();

    const nav = auth.userType === "candidate" ? candidateNav : employerNav;

    const handleNav = (path) => {
        navigate(path);
        setOpen(false);
    }; 
    
    const handleLogout = () => {
        logout();
        navigate("/");
        setOpen(false);
    };

    return (
        <>
            {open && <div className="sb-backdrop" onClick={() => setOpen(false)} />}

            <button
                className={`sb-toggle${open ? " sb-toggle--open" : ""}`}
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? "Close menu" : "Open menu"}
            >
                {open ? icons.close : icons.menu}
            </button>

            <aside className={`sb-panel${open ? " sb-panel--open" : ""}`}>

                <button className="sb-logo"  onClick={() => handleNav("/")} aria-label="Go to home">
                    <div className="sb-logo-mark">{icons.logoMark}</div>
                    <div>
                        <div className="sb-logo-name">Job Matcher ♡</div>
                        <div className="sb-logo-tag">
                            {auth.userType === "candidate" ? "Job seeker" : "Employer"}
                        </div>
                    </div>
                </button>

                <nav className="sb-nav">
                    {nav.map((item, i) => {
                        if (item.section) {
                            return <div key={i} className="sb-section-label">{item.label}</div>;
                        }
                        return (
                            <button
                                key={item.id}
                                className={`sb-item${location.pathname === item.path ? " sb-item--active" : ""}`}
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
                    <div className="sb-user" onClick={() => handleNav("/settings/profile")}>
                        <div className="sb-user-avatar">
                            {auth.userName ? getInitials(auth.userName) : "–"}
                        </div>
                        <div>
                            <div className="sb-user-name">{auth.userName}</div>
                            <div className="sb-user-role">
                                {auth.userType === "candidate" ? "Candidate" : "Employer"}
                            </div>
                        </div>
                    </div>
                    
                    <button className="sb-item sb-logout" onClick={handleLogout}>
                        <span className="sb-icon">{icons.logout}</span>
                        Log out
                    </button>
                </div>

            </aside>
        </>
    );
}

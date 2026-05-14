import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { useQuestions } from "../../context/QuestionsContext";
import { getInitials } from "../../utils/format";
import { icons } from "./SidebarIcons";
import { candidateNav, employerNav } from "./SidebarData";
import "./Sidebar.css";

function isNavItemActive(item, pathname) {
    if (!item.path) return false;
    if (pathname === item.path) return true;
    // Highlight parent nav items when on a child route (e.g. /settings/profile highlights /settings)
    if (item.path !== "/" && pathname.startsWith(item.path + "/")) return true;
    return false;
}

export default function Sidebar() {
    const [open, setOpen]   = useState(false);
    const navigate          = useNavigate();
    const location          = useLocation();
    const { auth, logout }  = useAuth();
    const { unreadCount }   = useNotifications();
    const { openCount }     = useQuestions();

    const nav = auth.userType === "applicant" ? candidateNav : employerNav;

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
                onClick={() => setOpen(o => !o)}
                aria-label={open ? "Close menu" : "Open menu"}
            >
                {open ? icons.close : icons.menu}
            </button>

            <aside className={`sb-panel${open ? " sb-panel--open" : ""}`}>

                <button className="sb-logo" onClick={() => handleNav("/dashboard")} aria-label="Go to home">
                    <div className="sb-logo-mark">{icons.logoMark}</div>
                    <div>
                        <div className="sb-logo-name">Transparent Match</div>
                        <div className="sb-logo-tag">
                            {auth.userType === "applicant" ? "Job seeker" : "Recruiter"}
                        </div>
                    </div>
                </button>

                <nav className="sb-nav">
                    {nav.map((item, i) => {
                        if (item.section) {
                            return <div key={i} className="sb-section-label">{item.label}</div>;
                        }

                        const active = isNavItemActive(item, location.pathname);
                        const badge  = item.id === "notifications" && unreadCount > 0
                            ? String(unreadCount)
                            : item.id === "questions" && openCount > 0
                                ? String(openCount)
                                : item.badge;

                        return (
                            <button
                                key={item.id}
                                className={`sb-item${active ? " sb-item--active" : ""}`}
                                onClick={() => handleNav(item.path)}
                            >
                                <span className="sb-icon">{icons[item.icon]}</span>
                                {item.label}
                                {badge && (
                                    <span className={`sb-badge${item.badgeWarn ? " sb-badge--warn" : ""}`}>
                                        {badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="sb-footer">
                    <div className="sb-user" onClick={() => handleNav("/settings/profile")}>
                        <div className="sb-user-avatar">
                            {auth.avatar
                                ? <img src={auth.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                                : auth.userName ? getInitials(auth.userName) : "-"
                            }
                        </div>
                        <div>
                            <div className="sb-user-name">
                                {auth.userType === "recruiter" && auth.fName
                                    ? `${auth.fName} ${auth.lName}`.trim()
                                    : auth.userName}
                            </div>
                            <div className="sb-user-role">
                                {auth.userType === "applicant" ? "Applicant" : auth.companyName || "Recruiter"}
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

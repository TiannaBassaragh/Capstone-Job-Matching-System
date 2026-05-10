import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./SettingsNav.css";

export default function SettingsNav() {
    const { auth } = useAuth();
    const isCandidate = auth.userType === "candidate";

    const navItems = [
        { to: "/settings",         label: "General", icon: "ti-settings", end: true },
        { to: "/settings/profile", label: "Profile", icon: "ti-user"              },
        ...(isCandidate ? [{ to: "/settings/resume", label: "Resume", icon: "ti-file-text" }] : []),
    ];

    return (
        <nav className="settings-nav">
            {navItems.map(item => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                        `settings-nav-item${isActive ? " settings-nav-item--active" : ""}`
                    }
                >
                    <div className="settings-nav-indicator" />
                    <i className={`ti ${item.icon}`} aria-hidden="true" />
                    {item.label}
                </NavLink>
            ))}
        </nav>
    );
}
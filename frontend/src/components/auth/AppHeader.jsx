import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AppHeader() {
    const { auth } = useAuth();

    return (
        <header className="topbar">
            <div className="container topbar-inner">
                <Link to="/" className="brand-mark">Transparent Match</Link>
                <nav className="topnav">
                    {auth.loggedIn ? (
                        <>
                            <span style={{ fontSize: "0.93rem" }}>
                                Signed in as <strong>{auth.userName}</strong>
                            </span>
                            <Link to="/dashboard" style={{ fontWeight: 700, color: "var(--tm-blue)" }}>
                                Go to dashboard
                            </Link>
                        </>
                    ) : (
                        <>
                            <NavLink to="/sign-up">Sign up</NavLink>
                            <NavLink to="/sign-in">Sign in</NavLink>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}

import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AppHeader.css";

export default function AppHeader() {
    const { auth } = useAuth();

    return (
        <header className="topbar">
            <div className="container topbar-inner">
                <Link to="/" className="brand-mark">
                    <img src="/favicon.svg" alt="" width="24" height="24" style={{ borderRadius: "6px" }} />
                    Transparent Match
                </Link>
                <nav className="topnav">
                    {auth.loggedIn ? (
                        <>
                            <span className="topnav-username">{auth.userName}</span>
                            <Link to="/logout" className="topnav-logout">Log out</Link>
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
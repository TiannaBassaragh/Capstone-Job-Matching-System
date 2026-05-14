import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

export default function Register() {
    const navigate          = useNavigate();
    const { auth, register } = useAuth();

    const [fName,       setFName]       = useState("");
    const [lName,       setLName]       = useState("");
    const [email,       setEmail]       = useState("");
    const [password,    setPassword]    = useState("");
    const [accountType, setAccountType] = useState("applicant");
    const [companyName, setCompanyName] = useState("");
    const [error,       setError]       = useState("");
    const [loading,     setLoading]     = useState(false);

    if (auth.loggedIn) return <Navigate to="/dashboard" replace />;

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register({
                f_name:       fName,
                l_name:       lName,
                email,
                password,
                account_type: accountType,
                company_name: accountType === "recruiter" ? companyName : undefined,
            });
            navigate("/login");
        } catch (err) {
            setError(err.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">TM</div>
                    <h1 className="auth-title">Create account</h1>
                    <p className="auth-sub">Join Transparent Match</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}

                    <div className="auth-field">
                        <label className="auth-role-label">I am a</label>
                        <div className="auth-role-toggle">
                            <button
                                type="button"
                                className={`auth-role-btn ${accountType === "applicant" ? "active" : ""}`}
                                onClick={() => setAccountType("applicant")}
                            >
                                Candidate
                            </button>
                            <button
                                type="button"
                                className={`auth-role-btn ${accountType === "recruiter" ? "active" : ""}`}
                                onClick={() => setAccountType("recruiter")}
                            >
                                Recruiter
                            </button>
                        </div>
                    </div>

                    <div className="auth-field-row">
                        <div className="auth-field">
                            <label className="auth-label">First name</label>
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="Jane"
                                value={fName}
                                onChange={e => setFName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="auth-field">
                            <label className="auth-label">Last name</label>
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="Smith"
                                value={lName}
                                onChange={e => setLName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {accountType === "recruiter" && (
                        <div className="auth-field">
                            <label className="auth-label">Company name</label>
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="Acme Corp"
                                value={companyName}
                                onChange={e => setCompanyName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="auth-field">
                        <label className="auth-label">Email</label>
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label">Password</label>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="Choose a password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? "Creating account…" : "Create account"}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}

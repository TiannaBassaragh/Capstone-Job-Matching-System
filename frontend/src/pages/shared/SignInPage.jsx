import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AppHeader from "../../components/auth/AppHeader";
import AuthCard from "../../components/auth/AuthCard";
import { useAuth } from "../../context/AuthContext";

export default function SignInPage() {
    const navigate          = useNavigate();
    const location          = useLocation();
    const { login }         = useAuth();
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [error, setError]       = useState("");
    const [submitting, setSubmitting] = useState(false);

    const from = location.state?.from?.pathname ?? "/dashboard";

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || "Unable to sign in.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="tm-root">
            <AppHeader />
            <AuthCard title="Welcome back" subtitle="Sign in to your Transparent Match account.">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        Email address
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </label>
                    <label>
                        Password
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </label>
                    {error && <p className="form-error">{error}</p>}
                    <button className="button primary full" disabled={submitting}>
                        {submitting ? "Signing in..." : "Sign in"}
                    </button>
                    <p className="muted small center">
                        Need an account? <Link to="/sign-up">Create one</Link>
                    </p>
                </form>
            </AuthCard>
        </div>
    );
}

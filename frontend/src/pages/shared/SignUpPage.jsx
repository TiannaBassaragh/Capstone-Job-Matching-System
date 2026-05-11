import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "../../components/auth/AppHeader";
import AuthCard from "../../components/auth/AuthCard";
import { useAuth } from "../../context/AuthContext";

export default function SignUpPage() {
    const navigate       = useNavigate();
    const { register }   = useAuth();

    const [firstName,   setFirstName]   = useState("");
    const [lastName,    setLastName]    = useState("");
    const [email,       setEmail]       = useState("");
    const [password,    setPassword]    = useState("");
    const [companyName, setCompanyName] = useState("");
    const [accountType, setAccountType] = useState("applicant");
    const [error,       setError]       = useState("");
    const [submitting,  setSubmitting]  = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await register({
                f_name:       firstName,
                l_name:       lastName,
                email,
                password,
                account_type: accountType,
                company_name: companyName || undefined,
            });
            navigate("/sign-in");
        } catch (err) {
            setError(err.message || "Unable to create account.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="tm-root">
            <AppHeader />
            <AuthCard title="Create your account" subtitle="Register to get started with Transparent Match.">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        First name
                        <input value={firstName} onChange={e => setFirstName(e.target.value)} required />
                    </label>
                    <label>
                        Last name
                        <input value={lastName} onChange={e => setLastName(e.target.value)} required />
                    </label>
                    <label>
                        Email address
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </label>

                    <div className="segmented-row">
                        <button
                            type="button"
                            className={accountType === "applicant" ? "segment active" : "segment"}
                            onClick={() => setAccountType("applicant")}
                        >
                            Candidate
                        </button>
                        <button
                            type="button"
                            className={accountType === "recruiter" ? "segment active" : "segment"}
                            onClick={() => setAccountType("recruiter")}
                        >
                            Employer
                        </button>
                    </div>

                    {accountType === "recruiter" && (
                        <label>
                            Company name
                            <input value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                        </label>
                    )}

                    <label>
                        Password
                        <input type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required />
                    </label>

                    {error && <p className="form-error">{error}</p>}

                    <button className="button primary full" disabled={submitting}>
                        {submitting ? "Creating account..." : "Create account"}
                    </button>
                    <p className="muted small center">
                        Already have an account? <Link to="/sign-in">Sign in</Link>
                    </p>
                </form>
            </AuthCard>
        </div>
    );
}

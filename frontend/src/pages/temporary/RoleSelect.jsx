import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CandidateIcon, EmployerIcon, ArrowIcon } from "./RoleSelectIcons";
import "./RoleSelect.css";

// Seeded test accounts — password is testpass123 for all
const TEST_ACCOUNTS = {
    applicant: { email: "alice.chen@example.com",     password: "testpass123" },
    recruiter:  { email: "sarah.kim@techcorp.com",      password: "testpass123" },
};

export default function RoleSelect() {
    const navigate       = useNavigate();
    const { login }      = useAuth();
    const [loadingRole, setLoadingRole] = useState(null);
    const [error, setError]             = useState("");

    async function handleLogin(role) {
        setError("");
        setLoadingRole(role);
        try {
            const account = TEST_ACCOUNTS[role];
            await login(account.email, account.password);
            navigate("/dashboard");
        } catch (err) {
            setError(err.message || "Login failed.");
        } finally {
            setLoadingRole(null);
        }
    }

    return (
        <div className="rs-shell">
            <div className="rs-card">
                <div className="rs-header">
                    <div className="rs-logo">JM</div>
                    <h1 className="rs-title">Welcome to the Test Screen</h1>
                    <p className="rs-sub">Choose how you want to continue</p>
                </div>

                {error && <p className="form-error">{error}</p>}

                <div className="rs-options">
                    <button
                        className="rs-option"
                        onClick={() => handleLogin("applicant")}
                        disabled={loadingRole !== null}
                    >
                        <div className="rs-option-icon rs-option-icon--candidate">
                            <CandidateIcon />
                        </div>
                        <div className="rs-option-body">
                            <span className="rs-option-label">Candidate</span>
                            <span className="rs-option-desc">
                                {loadingRole === "applicant"
                                    ? "Logging in..."
                                    : "Browse jobs matched to your resume"}
                            </span>
                        </div>
                        <ArrowIcon />
                    </button>

                    <div className="rs-divider" />

                    <button
                        className="rs-option"
                        onClick={() => handleLogin("recruiter")}
                        disabled={loadingRole !== null}
                    >
                        <div className="rs-option-icon rs-option-icon--employer">
                            <EmployerIcon />
                        </div>
                        <div className="rs-option-body">
                            <span className="rs-option-label">Employer</span>
                            <span className="rs-option-desc">
                                {loadingRole === "employer"
                                    ? "Logging in..."
                                    : "Manage postings and view candidate matches"}
                            </span>
                        </div>
                        <ArrowIcon />
                    </button>
                </div>
            </div>
        </div>
    );
}
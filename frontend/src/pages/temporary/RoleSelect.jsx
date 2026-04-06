// TEMPORARY PAGE FOR USER MODAL TESTING
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CandidateIcon, EmployerIcon, ArrowIcon } from "./RoleSelectIcons";
import "./RoleSelect.css";

export default function RoleSelect() {
    const navigate = useNavigate();
    const { logout, loginAsCandidate, loginAsEmployer } = useAuth();

    useEffect(() => { logout(); }, []);

    return (
        <div className="rs-shell">
            <div className="rs-card">
                <div className="rs-header">
                    <div className="rs-logo">JM</div>
                    <h1 className="rs-title">Welcome to the Test Screen</h1>
                    <p className="rs-sub">Choose how you want to continue</p>
                </div>
                <div className="rs-options">
                    <button
                        className="rs-option"
                        onClick={() => { loginAsCandidate(); navigate("/dashboard"); }}
                    >
                        <div className="rs-option-icon rs-option-icon--candidate">
                            <CandidateIcon />
                        </div>
                        <div className="rs-option-body">
                            <span className="rs-option-label">Candidate</span>
                            <span className="rs-option-desc">Browse jobs matched to your resume</span>
                        </div>
                        <ArrowIcon />
                    </button>

                    <div className="rs-divider" />

                    <button
                        className="rs-option"
                        onClick={() => { loginAsEmployer(); navigate("/dashboard"); }}
                    >
                        <div className="rs-option-icon rs-option-icon--employer">
                            <EmployerIcon />
                        </div>
                        <div className="rs-option-body">
                            <span className="rs-option-label">Employer</span>
                            <span className="rs-option-desc">Manage postings and view candidate matches</span>
                        </div>
                        <ArrowIcon />
                    </button>
                </div>
            </div>
        </div>
    );
}

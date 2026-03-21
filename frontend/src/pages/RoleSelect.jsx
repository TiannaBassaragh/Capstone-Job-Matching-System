// TEMPORARY PAGE FOR USER MODAL TESTING
import { useNavigate } from "react-router-dom";
import "./styles/RoleSelect.css";

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="rs-shell">
      <div className="rs-card">
        <div className="rs-header">
          <div className="rs-logo">JM</div>
          <h1 className="rs-title">Welcome</h1>
          <p className="rs-sub">Choose how you want to continue</p>
        </div>
        <div className="rs-options">
          <button className="rs-option" onClick={() => navigate("/dashboard-c")}>
            <div className="rs-option-icon rs-option-icon--candidate">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                <path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div className="rs-option-body">
              <span className="rs-option-label">Candidate</span>
              <span className="rs-option-desc">Browse jobs matched to your resume</span>
            </div>
            <svg className="rs-option-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="rs-divider" />

          <button className="rs-option" onClick={() => navigate("/dashboard-e")}>
            <div className="rs-option-icon rs-option-icon--employer">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="3" y="7" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                <path d="M7 7V5a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
                <path d="M8 13h6M8 16h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="rs-option-body">
              <span className="rs-option-label">Employer</span>
              <span className="rs-option-desc">Manage postings and view candidate matches</span>
            </div>
            <svg className="rs-option-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

import { PanelCard, DangerZone } from "../../../components";
import { useAuth } from "../../../context/AuthContext";
import "./SettingsSection.css";

export default function GeneralSection() {
    const { auth } = useAuth();

    const handleUpdatePassword = () => {
        console.log("Clicked: update password");
    };

    return (
        <div className="settings-section">

            <PanelCard>
                <div className="section-label">Account</div>
                <div className="field">
                    <div className="field-label">Account type</div>
                    <div className="field-static">{auth.userType === "candidate" ? "Candidate" : "Employer"}</div>
                </div>
                <div className="field">
                    <div className="field-label">Email</div>
                    <div className="field-static muted">{auth.email || "Not set"}</div>
                </div>
            </PanelCard>

            <PanelCard>
                <div className="section-label">Password</div>
                <div className="field">
                    <div className="field-label">Current password</div>
                    <input type="password" className="field-input" placeholder="Enter current password" />
                </div>
                <div className="field">
                    <div className="field-label">New password</div>
                    <input type="password" className="field-input" placeholder="Enter new password" />
                </div>
                <div className="field">
                    <div className="field-label">Confirm new password</div>
                    <input type="password" className="field-input" placeholder="Confirm new password" />
                </div>
                <div className="field-actions">
                    <button type="button" className="save-btn" onClick={handleUpdatePassword}>
                        Update password
                    </button>
                </div>
            </PanelCard>

            <DangerZone />

        </div>
    );
}

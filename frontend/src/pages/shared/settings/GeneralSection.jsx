import { useState } from "react";
import { PanelCard, DangerZone } from "../../../components";
import { useAuth } from "../../../context/AuthContext";
import { userService } from "../../../lib/userService";
import "./SettingsSection.css";

export default function GeneralSection() {
    const { auth } = useAuth();

    const [currentPw, setCurrentPw] = useState("");
    const [newPw,     setNewPw]     = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [pwStatus,  setPwStatus]  = useState(null); // { type: "success"|"error", msg }
    const [saving,    setSaving]    = useState(false);

    const handleUpdatePassword = async () => {
        setPwStatus(null);

        if (!currentPw || !newPw) {
            setPwStatus({ type: "error", msg: "Please fill in both fields." });
            return;
        }
        if (newPw !== confirmPw) {
            setPwStatus({ type: "error", msg: "New passwords don't match." });
            return;
        }
        if (newPw.length < 6) {
            setPwStatus({ type: "error", msg: "New password must be at least 6 characters." });
            return;
        }

        setSaving(true);
        try {
            await userService.changePassword(currentPw, newPw);
            setPwStatus({ type: "success", msg: "Password updated." });
            setCurrentPw("");
            setNewPw("");
            setConfirmPw("");
        } catch (err) {
            setPwStatus({ type: "error", msg: err.message || "Failed to update password." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-section">

            <PanelCard>
                <div className="section-label">Account</div>
                <div className="field">
                    <div className="field-label">Account type</div>
                    <div className="field-static">
                        {auth.userType === "applicant" ? "Applicant" : "Recruiter"}
                    </div>
                </div>
                <div className="field">
                    <div className="field-label">Email</div>
                    <div className="field-static muted">{auth.email || "Not set"}</div>
                </div>
            </PanelCard>

            <PanelCard>
                <div className="section-label">Password</div>

                {pwStatus && (
                    <div className={`field-status field-status--${pwStatus.type}`}>
                        {pwStatus.msg}
                    </div>
                )}

                <div className="field">
                    <div className="field-label">Current password</div>
                    <input
                        type="password"
                        className="field-input"
                        placeholder="Enter current password"
                        value={currentPw}
                        onChange={e => setCurrentPw(e.target.value)}
                    />
                </div>
                <div className="field">
                    <div className="field-label">New password</div>
                    <input
                        type="password"
                        className="field-input"
                        placeholder="Enter new password"
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                    />
                </div>
                <div className="field">
                    <div className="field-label">Confirm new password</div>
                    <input
                        type="password"
                        className="field-input"
                        placeholder="Confirm new password"
                        value={confirmPw}
                        onChange={e => setConfirmPw(e.target.value)}
                    />
                </div>
                <div className="field-actions">
                    <button
                        type="button"
                        className="save-btn"
                        onClick={handleUpdatePassword}
                        disabled={saving}
                    >
                        {saving ? "Updating…" : "Update password"}
                    </button>
                </div>
            </PanelCard>

            <DangerZone />

        </div>
    );
}

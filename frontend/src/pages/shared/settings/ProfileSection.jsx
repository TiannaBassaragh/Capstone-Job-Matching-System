import { useState } from "react";
import { PanelCard } from "../../../components/cards";
import { getInitials } from "../../../utils";
import { useAuth } from "../../../context/AuthContext";
import { userService } from "../../../lib/userService";
import "./SettingsSection.css";

export default function ProfileSection() {
    const { auth } = useAuth();
    const isRecruiter = auth.userType === "recruiter";

    const nameParts = (auth.userName || "").split(" ");

    const [firstName,   setFirstName]   = useState(isRecruiter ? "" : nameParts[0] || "");
    const [lastName,    setLastName]    = useState(isRecruiter ? "" : nameParts.slice(1).join(" ") || "");
    const [companyName, setCompanyName] = useState(isRecruiter ? auth.userName || "" : "");
    const [headline,    setHeadline]    = useState("");
    const [bio,         setBio]         = useState("");
    const [status,      setStatus]      = useState(null);
    const [saving,      setSaving]      = useState(false);

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            await userService.updateProfile(auth.userId, {
                fName:       isRecruiter ? companyName : firstName,
                lName:       isRecruiter ? "" : lastName,
                email:       auth.email,
                companyName: isRecruiter ? companyName : null,
            });
            setStatus({ type: "success", msg: "Profile saved." });
        } catch (err) {
            setStatus({ type: "error", msg: err.message || "Failed to save profile." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-section">

            <PanelCard>
                <div className="section-label">Profile picture</div>
                <div className="avatar-row">
                    <div className="avatar">{getInitials(auth.userName)}</div>
                    <div className="avatar-actions">
                        <button type="button" className="ghost-btn">Upload photo</button>
                        <button type="button" className="ghost-btn">Remove</button>
                    </div>
                </div>
            </PanelCard>

            <PanelCard>
                <div className="section-label">
                    {isRecruiter ? "Company info" : "Personal info"}
                </div>

                {status && (
                    <div className={`field-status field-status--${status.type}`}>
                        {status.msg}
                    </div>
                )}

                {isRecruiter ? (
                    <div className="field">
                        <div className="field-label">Company name</div>
                        <input
                            type="text"
                            className="field-input"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                        />
                    </div>
                ) : (
                    <div className="field-row">
                        <div className="field">
                            <div className="field-label">First name</div>
                            <input
                                type="text"
                                className="field-input"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <div className="field-label">Last name</div>
                            <input
                                type="text"
                                className="field-input"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {!isRecruiter && (
                    <>
                        <div className="field">
                            <div className="field-label">Headline</div>
                            <input
                                type="text"
                                className="field-input"
                                placeholder="e.g. Senior Frontend Engineer"
                                value={headline}
                                onChange={e => setHeadline(e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <div className="field-label">Bio</div>
                            <textarea
                                className="field-textarea"
                                placeholder="Tell employers a bit about yourself…"
                                rows={4}
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                            />
                        </div>
                    </>
                )}

                <div className="field-actions">
                    <button
                        type="button"
                        className="save-btn"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                </div>
            </PanelCard>

        </div>
    );
}

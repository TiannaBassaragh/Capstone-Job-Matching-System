import { useState, useRef } from "react";
import { PanelCard } from "../../../components/cards";
import { getInitials } from "../../../utils";
import { useAuth } from "../../../context/AuthContext";
import { userService } from "../../../lib/userService";
import "./SettingsSection.css";

function AvatarUpload({ label, value, onChange, onRemove, fallbackName }) {
    const ref = useRef(null);
    return (
        <PanelCard>
            <div className="section-label">{label}</div>
            <div className="avatar-row">
                {value
                    ? <img src={value} alt="" className="avatar avatar--img" />
                    : <div className="avatar">{getInitials(fallbackName)}</div>
                }
                <div className="avatar-actions">
                    <input
                        ref={ref}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => onChange(ev.target.result);
                            reader.readAsDataURL(file);
                        }}
                    />
                    <button type="button" className="ghost-btn" onClick={() => ref.current?.click()}>
                        Upload photo
                    </button>
                    {value && (
                        <button type="button" className="ghost-btn" onClick={onRemove}>
                            Remove
                        </button>
                    )}
                </div>
            </div>
        </PanelCard>
    );
}

export default function ProfileSection() {
    const { auth, setAuth } = useAuth();
    const isRecruiter = auth.userType === "recruiter";

    const [firstName,    setFirstName]    = useState(auth.fName || "");
    const [lastName,     setLastName]     = useState(auth.lName || "");
    const [companyName,  setCompanyName]  = useState(auth.companyName || "");
    const [headline,     setHeadline]     = useState(auth.headline || "");
    const [bio,          setBio]          = useState(auth.bio || "");
    const [avatar,       setAvatar]       = useState(auth.avatar || null);
    const [logo,         setLogo]         = useState(auth.employerLogo || null);
    const [status,       setStatus]       = useState(null);
    const [saving,       setSaving]       = useState(false);

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            await userService.updateProfile(auth.userId, {
                fName:       firstName,
                lName:       lastName,
                email:       auth.email,
                companyName: isRecruiter ? companyName : undefined,
                avatar,
                logo:        isRecruiter ? logo : undefined,
            });
            if (!isRecruiter) {
                await userService.updateCandidateProfile({ headline, bio });
            }
            setAuth(prev => ({
                ...prev,
                fName:        firstName,
                lName:        lastName,
                userName:     isRecruiter ? companyName : `${firstName} ${lastName}`,
                companyName:  isRecruiter ? companyName : prev.companyName,
                avatar,
                employerLogo: isRecruiter ? logo : prev.employerLogo,
                headline,
                bio,
            }));
            setStatus({ type: "success", msg: "Profile saved." });
        } catch (err) {
            setStatus({ type: "error", msg: err.message || "Failed to save profile." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-section">

            <AvatarUpload
                label="Profile picture"
                value={avatar}
                onChange={setAvatar}
                onRemove={() => setAvatar(null)}
                fallbackName={isRecruiter ? companyName : `${firstName} ${lastName}`}
            />

            {isRecruiter && (
                <AvatarUpload
                    label="Company logo"
                    value={logo}
                    onChange={setLogo}
                    onRemove={() => setLogo(null)}
                    fallbackName={companyName}
                />
            )}

            <PanelCard>
                <div className="section-label">
                    {isRecruiter ? "Personal info" : "Personal info"}
                </div>

                {status && (
                    <div className={`field-status field-status--${status.type}`}>
                        {status.msg}
                    </div>
                )}

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

                {isRecruiter && (
                    <div className="field">
                        <div className="field-label">Company name</div>
                        <input
                            type="text"
                            className="field-input"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                        />
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

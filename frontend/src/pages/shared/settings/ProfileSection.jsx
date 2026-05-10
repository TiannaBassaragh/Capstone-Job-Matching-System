import { PanelCard } from "../../../components/cards";
import { getInitials } from "../../../utils";
import { useAuth } from "../../../context/AuthContext";
import "./SettingsSection.css";

export default function ProfileSection() {
    const { auth } = useAuth();

    const handleSave = () => {
        console.log("Clicked: save profile");
    };

    const handleUploadPhoto = () => {
        console.log("Clicked: upload photo");
    };

    return (
        <div className="settings-section">

            <PanelCard>
                <div className="section-label">Profile picture</div>
                <div className="avatar-row">
                    <div className="avatar">
                        {getInitials(auth.userName)}
                    </div>
                    <div className="avatar-actions">
                        <button type="button" className="ghost-btn" onClick={handleUploadPhoto}>Upload photo</button>
                        <button type="button" className="ghost-btn">Remove</button>
                    </div>
                </div>
            </PanelCard>

            <PanelCard>
                <div className="section-label">Personal info</div>
                <div className="field-row">
                    <div className="field">
                        <div className="field-label">First name</div>
                        <input type="text" className="field-input" defaultValue={auth.userName?.split(" ")[0] || ""} />
                    </div>
                    <div className="field">
                        <div className="field-label">Last name</div>
                        <input type="text" className="field-input" defaultValue={auth.userName?.split(" ")[1] || ""} />
                    </div>
                </div>
                <div className="field">
                    <div className="field-label">Headline</div>
                    <input type="text" className="field-input" placeholder="e.g. Senior Frontend Engineer" />
                </div>
                <div className="field">
                    <div className="field-label">Bio</div>
                    <textarea className="field-textarea" placeholder="Tell employers a bit about yourself…" rows={4} />
                </div>
                <div className="field-actions">
                    <button type="button" className="save-btn" onClick={handleSave}>
                        Save changes
                    </button>
                </div>
            </PanelCard>

        </div>
    );
}

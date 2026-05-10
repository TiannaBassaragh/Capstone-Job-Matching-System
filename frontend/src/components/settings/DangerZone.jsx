import "./DangerZone.css";

export default function DangerZone() {
    const handleDelete = () => {
        console.log("Clicked: delete account");
    };

    return (
        <div className="danger-zone">
            <div className="danger-header">
                <span className="danger-title">Danger zone</span>
            </div>
            <div className="danger-body">
                <p className="danger-desc">
                    Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button type="button" className="danger-btn" onClick={handleDelete}>
                    Delete account
                </button>
            </div>
        </div>
    );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../lib/userService";
import "./DangerZone.css";

export default function DangerZone() {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();
    const [confirming, setConfirming] = useState(false);
    const [deleting,   setDeleting]   = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await userService.deleteAccount(auth.userId);
            logout();
            navigate("/");
        } catch (err) {
            console.error("Delete account error:", err);
            setDeleting(false);
            setConfirming(false);
        }
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

                {!confirming ? (
                    <button
                        type="button"
                        className="danger-btn"
                        onClick={() => setConfirming(true)}
                    >
                        Delete account
                    </button>
                ) : (
                    <div className="danger-confirm">
                        <span className="danger-confirm-text">Are you sure?</span>
                        <button
                            type="button"
                            className="danger-btn"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting…" : "Yes, delete my account"}
                        </button>
                        <button
                            type="button"
                            className="danger-cancel"
                            onClick={() => setConfirming(false)}
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

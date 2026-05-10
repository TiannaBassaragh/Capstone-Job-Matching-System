import "./DeleteDialog.css";

export default function DeleteDialog({ title, body, confirmLabel = "Yes, delete it", onConfirm, onCancel, confirming }) {
    return (
        <div className="delete-overlay" onClick={onCancel}>
            <div className="delete-dialog" onClick={e => e.stopPropagation()}>
                <div className="delete-title">{title}</div>
                <p className="delete-body">{body}</p>
                <div className="delete-actions">
                    <button type="button" className="delete-cancel" onClick={onCancel} disabled={confirming}>
                        Cancel
                    </button>
                    <button type="button" className="delete-confirm" onClick={onConfirm} disabled={confirming}>
                        {confirming ? "Deleting…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

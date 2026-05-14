import { PanelCard } from "../cards";
import NotificationItem from "./NotificationItem";
import "./NotificationGroup.css";

export default function NotificationGroup({ label, notifications, onRead }) {
    if (notifications.length === 0) return null;

    return (
        <div className="notification-group">
            <div className="notification-group-label">{label}</div>
            <PanelCard>
                <div className="notification-group-list">
                    {notifications.map((n, i) => (
                        <div key={n.id}>
                            {i > 0 && <div className="notification-group-divider" />}
                            <NotificationItem notification={n} onRead={onRead} />
                        </div>
                    ))}
                </div>
            </PanelCard>
        </div>
    );
}

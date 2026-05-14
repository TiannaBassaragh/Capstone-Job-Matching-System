import { useNavigate } from "react-router-dom";
import { notificationTypeConfig } from "../../fake-data/NotificationData";
import "./NotificationItem.css";

export default function NotificationItem({ notification, onRead }) {
    const navigate = useNavigate();
    const config = notificationTypeConfig[notification.type] ?? notificationTypeConfig.system;

    const handleClick = () => {
        console.log("Clicked notification:", notification.title);
        if (!notification.read) onRead(notification.id);
        if (notification.link) navigate(notification.link);
    };

    return (
        <button
            type="button"
            className={`notification-item${!notification.read ? " notification-item--unread" : ""}`}
            onClick={handleClick}
        >
            <div
                className="notification-item-icon"
                style={{ background: config.bg, color: config.color }}
            >
                <i className={`ti ${config.icon}`} aria-hidden="true" />
            </div>
            <div className="notification-item-body">
                <div className={`notification-item-title${notification.read ? " notification-item-title--read" : ""}`}>
                    {notification.title}
                </div>
                <div className="notification-item-desc">{notification.desc}</div>
                <div className="notification-item-time">{notification.time}</div>
            </div>
            {!notification.read && <div className="notification-item-dot" />}
        </button>
    );
}

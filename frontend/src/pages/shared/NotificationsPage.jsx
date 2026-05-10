import { useState } from "react";
import { PageCard } from "../../components/cards";
import { NotificationGroup } from "../../components/notifications";
import { notifications as initialNotifications, groupLabels } from "../../fake-data/NotificationData";
import "./NotificationsPage.css";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(initialNotifications);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleRead = (id) => {
        console.log("Marked as read:", id);
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const handleMarkAllRead = () => {
        console.log("Clicked: mark all as read");
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const groups = Object.keys(groupLabels).map(key => ({
        key,
        label: groupLabels[key],
        notifications: notifications.filter(n => n.group === key),
    }));

    return (
        <PageCard breadcrumb="Notifications" title="Notifications">

            <div className="notifications-topbar">
                <span className="notifications-count">
                    {unreadCount > 0
                        ? <><strong>{unreadCount} unread</strong> · {notifications.length} total</>
                        : `${notifications.length} notifications · all read`
                    }
                </span>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        className="notifications-mark-all"
                        onClick={handleMarkAllRead}
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="notifications-list">
                {groups.map(group => (
                    <NotificationGroup
                        key={group.key}
                        label={group.label}
                        notifications={group.notifications}
                        onRead={handleRead}
                    />
                ))}
            </div>

        </PageCard>
    );
}

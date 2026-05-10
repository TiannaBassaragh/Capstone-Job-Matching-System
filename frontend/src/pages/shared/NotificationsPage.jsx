import { PageCard } from "../../components/cards";
import { NotificationGroup } from "../../components/notifications";
import { useNotifications } from "../../context/NotificationContext";
import { groupLabels } from "../../fake-data/NotificationData";
import "./NotificationsPage.css";

export default function NotificationsPage() {
    const { items, unreadCount, markRead, markAllRead, refresh } = useNotifications();

    const groups = Object.keys(groupLabels).map(key => ({
        key,
        label: groupLabels[key],
        notifications: items.filter(n => n.group === key),
    }));

    return (
        <PageCard breadcrumb="Notifications" title="Notifications">

            <div className="notifications-topbar">
                <span className="notifications-count">
                    {unreadCount > 0
                        ? <><strong>{unreadCount} unread</strong> &middot; {items.length} total</>
                        : `${items.length} notifications, all read`
                    }
                </span>
                <div className="notifications-actions">
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            className="notifications-mark-all"
                            onClick={markAllRead}
                        >
                            Mark all as read
                        </button>
                    )}
                    <button
                        type="button"
                        className="notifications-refresh"
                        onClick={refresh}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="notifications-list">
                {groups.map(group => (
                    <NotificationGroup
                        key={group.key}
                        label={group.label}
                        notifications={group.notifications}
                        onRead={markRead}
                    />
                ))}
            </div>

        </PageCard>
    );
}

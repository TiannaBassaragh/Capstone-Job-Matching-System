import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { notifications as seedData } from "../fake-data/NotificationData";

const NotificationContext = createContext(null);

const STORAGE_KEY = "notif_read_ids";

function loadReadIds() {
    try {
        return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
    } catch {
        return new Set();
    }
}

function saveReadIds(ids) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function NotificationProvider({ children }) {
    const [items, setItems] = useState(() => {
        const readIds = loadReadIds();
        return seedData.map(n => ({ ...n, read: readIds.has(n.id) ? true : n.read }));
    });

    const unreadCount = items.filter(n => !n.read).length;

    const markRead = useCallback((id) => {
        setItems(prev => {
            const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
            saveReadIds(new Set(next.filter(n => n.read).map(n => n.id)));
            return next;
        });
    }, []);

    const markAllRead = useCallback(() => {
        setItems(prev => {
            const next = prev.map(n => ({ ...n, read: true }));
            saveReadIds(new Set(next.map(n => n.id)));
            return next;
        });
    }, []);

    // Ready for backend: swap seedData for an API call here
    const refresh = useCallback(() => {
        const readIds = loadReadIds();
        setItems(seedData.map(n => ({ ...n, read: readIds.has(n.id) ? true : n.read })));
    }, []);

    return (
        <NotificationContext.Provider value={{ items, unreadCount, markRead, markAllRead, refresh }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}

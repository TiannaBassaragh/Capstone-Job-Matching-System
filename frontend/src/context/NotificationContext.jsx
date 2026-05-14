import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { notificationsService } from "../lib/notificationsService";
import { mapNotifications } from "../lib/mappers";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

const POLL_INTERVAL = 60_000;

export function NotificationProvider({ children }) {
    const { auth } = useAuth();
    const [items, setItems] = useState([]);
    const intervalRef = useRef(null);

    const refresh = useCallback(async () => {
        if (!auth.loggedIn) return;
        try {
            const raw = await notificationsService.getAll();
            setItems(mapNotifications(raw));
        } catch {
            // silently fail — notifications are non-critical
        }
    }, [auth.loggedIn]);

    useEffect(() => {
        refresh();
        intervalRef.current = setInterval(refresh, POLL_INTERVAL);
        return () => clearInterval(intervalRef.current);
    }, [refresh]);

    const unreadCount = items.filter(n => !n.read).length;

    const markRead = useCallback(async (id) => {
        setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        try { await notificationsService.markRead(id); } catch {}
    }, []);

    const markAllRead = useCallback(async () => {
        setItems(prev => prev.map(n => ({ ...n, read: true })));
        try { await notificationsService.markAllRead(); } catch {}
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

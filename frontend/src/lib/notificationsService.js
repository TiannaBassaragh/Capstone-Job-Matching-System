import { api } from "./api";

export const notificationsService = {
    getAll: async () => {
        return api.get("/notifications/");
    },

    markRead: async (notificationId) => {
        return api.patch(`/notifications/${notificationId}/read`, {});
    },

    markAllRead: async () => {
        return api.patch("/notifications/read-all", {});
    },
};

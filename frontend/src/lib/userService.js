// userService.js
import { api } from "./api";
import { mapUser } from "./mappers";

export const userService = {

    // GET /users/me
    getMe: async () => {
        const data = await api.get("/users/me");
        return mapUser(data);
    },

    // PUT /users/:userId
    updateProfile: async (userId, { fName, lName, email, companyName }) => {
        return api.put(`/users/${userId}`, {
            f_name:       fName,
            l_name:       lName,
            email,
            company_name: companyName,
        });
    },

    // POST /users/me/change-password
    changePassword: async (oldPassword, newPassword) => {
        return api.post("/users/me/change-password", {
            old_password: oldPassword,
            new_password: newPassword,
        });
    },

    // DELETE /users/:userId
    deleteAccount: async (userId) => {
        return api.delete(`/users/${userId}`);
    },
};

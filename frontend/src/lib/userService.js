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
    updateProfile: async (userId, { fName, lName, email, companyName, avatar, logo }) => {
        return api.put(`/users/${userId}`, {
            f_name:       fName,
            l_name:       lName,
            email,
            company_name: companyName ?? undefined,
            avatar:       avatar      ?? undefined,
            logo:         logo        ?? undefined,
        });
    },

    // PATCH /users/me/candidate-profile
    updateCandidateProfile: async ({ headline, bio }) => {
        return api.patch("/users/me/candidate-profile", { headline, bio });
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

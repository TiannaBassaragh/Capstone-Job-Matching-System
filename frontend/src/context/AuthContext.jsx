import { createContext, useContext, useEffect, useState } from "react";
import { authAPI, usersAPI } from "../lib/api";

const AuthContext = createContext(null);

const emptyAuth = {
    loggedIn: false,
    token: null,
    userId: null,
    userName: null,
    userType: null, // "applicant" | "recruiter"
    email: null,
};

function mapUserToAuth(user, token) {
    return {
        loggedIn:     true,
        token,
        userId:       user.user_id,
        userName:     user.account_type === "recruiter"
                          ? user.company_name
                          : `${user.f_name} ${user.l_name}`,
        fName:        user.f_name        ?? "",
        lName:        user.l_name        ?? "",
        userType:     user.account_type,
        email:        user.email,
        avatar:       user.avatar        ?? null,
        candidateId:  user.candidate_id  ?? null,
        employerId:   user.employer_id   ?? null,
        companyName:  user.company_name  ?? null,
        employerLogo: user.employer_logo ?? null,
        headline:     user.headline      ?? null,
        bio:          user.bio           ?? null,
    };
}

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(null);

    useEffect(() => {
        async function restoreSession() {
            const token = localStorage.getItem("auth_token");

            if (!token) {
                setAuth(emptyAuth);
                return;
            }

            try {
                const user = await usersAPI.getMe(token);
                setAuth(mapUserToAuth(user, token));
            } catch (error) {
                localStorage.removeItem("auth_token");
                setAuth(emptyAuth);
            }
        }

        restoreSession();
    }, []);

    async function login(email, password) {
        const tokenData = await authAPI.login({ email, password });

        localStorage.setItem("auth_token", tokenData.access_token);

        const user = await usersAPI.getMe(tokenData.access_token);
        const newAuth = mapUserToAuth(user, tokenData.access_token);

        setAuth(newAuth);
        return newAuth;
    }

    async function register(data) {
        return authAPI.register(data);
    }

    function logout() {
        localStorage.removeItem("auth_token");
        setAuth(emptyAuth);
    }

    if (auth === null) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ auth, setAuth, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
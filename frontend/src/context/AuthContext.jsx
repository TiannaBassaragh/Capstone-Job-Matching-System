import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(null)

    useEffect(() => {
        const saved = localStorage.getItem("auth");
        setAuth(saved ? JSON.parse(saved) : {
            loggedIn: false,
            userId: null,
            userType: null,       // "candidate" | "employer"
            userName: null
        });
    }, []);

    // Don't render anything until auth is resolved
    if (auth === null) return null;

    const setAndPersist = (newAuth) => {
        setAuth(newAuth);
        localStorage.setItem("auth", JSON.stringify(newAuth));
    };

    const loginAsCandidate = () => setAndPersist({
        loggedIn: true,
        userId: 1,
        userType: "candidate",
        userName: "Candi Date",
    });

    const loginAsEmployer = () => setAndPersist({
        loggedIn: true,
        userId: 2,
        userType: "employer",
        userName: "Company Inc.",
    });

    const logout = () => {
        localStorage.removeItem("auth");
        setAuth({
            loggedIn: false,
            userId: null,
            userType: null,
            userName: null,
        })
    };

    return (
        <AuthContext.Provider value={{ auth, loginAsCandidate, loginAsEmployer, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
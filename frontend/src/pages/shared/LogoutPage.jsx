import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LogoutPage() {
    const navigate   = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        logout();
        navigate("/", { replace: true });
    }, [logout, navigate]);

    return (
        <div className="tm-root">
            <main className="page-shell">
                <div className="container">
                    <div className="tm-panel" style={{ padding: "24px" }}>
                        Signing you out...
                    </div>
                </div>
            </main>
        </div>
    );
}

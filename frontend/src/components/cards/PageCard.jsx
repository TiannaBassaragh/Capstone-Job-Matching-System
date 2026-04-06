import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils";
import "./PageCard.css";

function Header({ breadcrumb, title }) {
    const { auth } = useAuth();
    const navigate = useNavigate();

    const userTypeLabel = {
        candidate: "Candidate",
        employer: "Employer",
    };

    return (
        <div className="header-bar">
            <div>
                <div className="page-breadcrumb">{breadcrumb}</div>
                <div className="page-title">{title}</div>
            </div>
            <div className="header-bar-right">
                <span className={`account-chip${auth.userType ? " ac-"+auth.userType : ""}`}>
                    {userTypeLabel[auth.userType]}
                </span>
                <div className="user-avatar-icon" onClick={() => navigate("/settings/profile")}>
                    {auth.userName ? getInitials(auth.userName) : "–"}
                </div>
            </div>
        </div>
    );
}

export default function PageCard({ 
    children, 
    breadcrumb = "Pages / Unnamed Page", 
    title = "A Page"
}) {
    
    return (
        <div className="content-wrapper">
            <div className="page-card">
                <Header breadcrumb={breadcrumb} title={title} />
                {children}
            </div>
        </div>
    );
}

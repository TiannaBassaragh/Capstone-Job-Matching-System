import { useNavigate } from "react-router-dom";
import { PanelCard } from "../cards";
import "./EmployerLinksPanel.css";

export default function EmployerLinksPanel() {
    const navigate = useNavigate();

    return (
        <PanelCard title="Manage jobs">
            <button
                type="button"
                className="employer-links-primary"
                onClick={() => navigate("/jobs")}
            >
                View all job listings →
            </button>
            <button
                type="button"
                className="employer-links-secondary"
                onClick={() => navigate("/new-job")}
            >
                + Post new job
            </button>
        </PanelCard>
    );
}

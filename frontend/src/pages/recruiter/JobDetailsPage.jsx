import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PageCard, PanelCard } from "../../components";
import { getInitials } from "../../utils";
import { allEmployerJobs } from "../../fake-data/DashboardData";
import { jobDescriptions, jobCandidates, jobActivity } from "../../fake-data/MatchData";
import OverviewSection from "./OverviewSection";
import CandidatesSection from "./CandidatesSection";
import "./JobDetailsPage.css";

const statusConfig = {
    active:   { label: "Active",        bg: "#E1F5EE", color: "#0F6E56" },
    expiring: { label: "Expiring soon", bg: "#FAEEDA", color: "#854F0B" },
    inactive: { label: "Inactive",      bg: "#F1EFE8", color: "#5F5E5A" },
};

export default function JobDetailsPage() {
    const { jobId }  = useParams();
    const navigate   = useNavigate();
    const location   = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.tab || "overview");

    const job         = allEmployerJobs.find(j => j.id === Number(jobId));
    const description = jobDescriptions[jobId] || jobDescriptions.default;
    const candidates  = jobCandidates[jobId]   || jobCandidates.default;
    const activity    = jobActivity[jobId]      || jobActivity.default;

    if (!job) {
        return (
            <PageCard breadcrumb="Jobs / Details" title="Job Details">
                <PanelCard>
                    <p style={{ color: "var(--muted)", fontSize: 13 }}>
                        Job not found.{" "}
                        <button onClick={() => navigate("/jobs")} style={{ color: "var(--acc)", fontWeight: 600 }}>
                            Go back to jobs.
                        </button>
                    </p>
                </PanelCard>
            </PageCard>
        );
    }

    const status = statusConfig[job.status] || statusConfig.active;

    const handleCandidateClick = (candidate) => {
        navigate(`/jobs/${jobId}/candidate/${candidate.id}`, { state: { candidate, jobId: job.id } });
    };

    return (
        <PageCard breadcrumb={`Jobs / ${job.title}`} title="Job Details">

            <PanelCard>
                <div className="job-header">
                    <div className="job-header-icon" style={{ background: job.bg, color: job.color }}>
                        {getInitials(job.userName)}
                    </div>
                    <div className="job-header-body">
                        <div className="job-header-title">
                            {job.title}
                            <span className="job-status-badge" style={{ background: status.bg, color: status.color }}>
                                {status.label}
                            </span>
                        </div>
                        <div className="job-header-meta">
                            {job.location} · {job.workType} · posted {job.postedDate}
                        </div>
                    </div>
                    <div className="job-header-actions">
                        <button type="button" className="header-btn" onClick={() => navigate("/jobs")}>
                            ← All jobs
                        </button>
                        <button type="button" className="header-btn" onClick={() => console.log("Clicked: edit job")}>
                            <i className="ti ti-edit" aria-hidden="true" /> Edit
                        </button>
                        <button type="button" className="header-btn header-btn--danger" onClick={() => console.log("Clicked: close posting")}>
                            <i className="ti ti-x" aria-hidden="true" /> Close posting
                        </button>
                    </div>
                </div>

                <div className="job-tabs">
                    <button
                        type="button"
                        className={`job-tab${activeTab === "overview" ? " job-tab--active" : ""}`}
                        onClick={() => setActiveTab("overview")}
                    >
                        Overview
                    </button>
                    <button
                        type="button"
                        className={`job-tab${activeTab === "candidates" ? " job-tab--active" : ""}`}
                        onClick={() => setActiveTab("candidates")}
                    >
                        Candidates
                        <span className="job-tab-badge">{job.matches}</span>
                    </button>
                </div>
            </PanelCard>

            {activeTab === "overview" && (
                <OverviewSection
                    job={job}
                    description={description}
                    candidates={candidates}
                    activity={activity}
                    onCandidateClick={handleCandidateClick}
                />
            )}

            {activeTab === "candidates" && (
                <CandidatesSection candidates={candidates} jobId={jobId} />
            )}

        </PageCard>
    );
}
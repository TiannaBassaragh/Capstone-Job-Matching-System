import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PageCard, PanelCard } from "../../components";
import { DeleteDialog } from "../../components/content";
import { getInitials } from "../../utils";
import { jobsService } from "../../lib/jobsService";
import OverviewSection from "./OverviewSection";
import CandidatesSection from "./CandidatesSection";
import "./JobDetailsPage.css";

const statusConfig = {
    active:   { label: "Active",        bg: "#E1F5EE", color: "#0F6E56" },
    expiring: { label: "Expiring soon", bg: "#FAEEDA", color: "#854F0B" },
    inactive: { label: "Inactive",      bg: "#F1EFE8", color: "#5F5E5A" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function JobDetailsPage() {
    const { jobId }  = useParams();
    const navigate   = useNavigate();
    const location   = useLocation();
    const [activeTab,    setActiveTab]    = useState(location.state?.tab || "overview");
    const [job,          setJob]          = useState(null);
    const [candidates,   setCandidates]   = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [showDelete,   setShowDelete]   = useState(false);
    const [deleting,     setDeleting]     = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [jobData, rankings] = await Promise.all([
                    jobsService.getJob(jobId),
                    jobsService.getJobRankings(jobId, 50),
                ]);
                setJob(jobData);
                // 7. Use match_score directly (already 0–1) × 100 for display
                setCandidates(rankings.map(c => ({
                    ...c,
                    score: c.score, // already mapped correctly in mapCandidateRanking
                })));
            } catch (err) {
                console.error("Job details load error:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [jobId]);

    const handleToggleStatus = async () => {
        if (!job) return;
        setTogglingStatus(true);
        try {
            const updated = await jobsService.setJobStatus(jobId, job.status === "inactive");
            setJob(prev => ({ ...prev, status: updated.is_active ? "active" : "inactive" }));
        } catch (err) {
            console.error("Status toggle error:", err);
        } finally {
            setTogglingStatus(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await jobsService.deleteJob(jobId);
            navigate("/jobs");
        } catch (err) {
            console.error("Delete error:", err);
            setDeleting(false);
            setShowDelete(false);
        }
    };

    if (loading) {
        return (
            <PageCard breadcrumb="Jobs / Details" title="Job Details">
                <PanelCard><p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p></PanelCard>
            </PageCard>
        );
    }

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
        navigate(`/jobs/${jobId}/candidate/${candidate.id}`, { state: { candidate, jobId } });
    };

    const activity = [
        { type: "posted",  text: "Job posting went live", time: job.postedDate },
        { type: "created", text: "Job posting created",   time: job.postedDate },
    ];

    return (
        <PageCard breadcrumb={`Jobs / ${job.title}`} title="Job Details">

            <PanelCard>
                <div className="job-header">
                    <div className="job-header-icon" style={{ background: job.bg, color: job.color }}>
                        {getInitials(job.title)}
                    </div>
                    <div className="job-header-body">
                        <div className="job-header-title">
                            {job.title}
                            <span className="job-status-badge" style={{ background: status.bg, color: status.color }}>
                                {status.label}
                            </span>
                        </div>
                        <div className="job-header-meta">posted {job.postedDate}</div>
                    </div>
                    <div className="job-header-actions">
                        <button type="button" className="header-btn" onClick={() => navigate("/jobs")}>
                            ← All jobs
                        </button>
                        <button type="button" className="header-btn"
                            onClick={() => navigate(`/new-job?edit=${jobId}`, { state: { job } })}>
                            Edit
                        </button>
                        <button type="button" className="header-btn"
                            onClick={handleToggleStatus}
                            disabled={togglingStatus}>
                            {job.status === "inactive" ? "Set active" : "Set inactive"}
                        </button>
                        <button type="button" className="header-btn header-btn--danger"
                            onClick={() => setShowDelete(true)}>
                            Delete posting
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
                        <span className="job-tab-badge">{candidates.length}</span>
                    </button>
                </div>
            </PanelCard>

            {activeTab === "overview" && (
                <OverviewSection
                    job={job}
                    description={job.description}
                    candidates={candidates}
                    activity={activity}
                    onCandidateClick={handleCandidateClick}
                />
            )}

            {activeTab === "candidates" && (
                <CandidatesSection
                    candidates={candidates}
                    jobId={jobId}
                    onShortlistChange={(candidateId, shortlisted) =>
                        setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, shortlisted } : c))
                    }
                />
            )}

            {showDelete && (
                <DeleteDialog
                    title="Delete job posting?"
                    body={`You're about to permanently delete "${job.title}". This cannot be undone and all associated matches will be removed.`}
                    confirmLabel="Yes, delete it"
                    onConfirm={handleDelete}
                    onCancel={() => setShowDelete(false)}
                    confirming={deleting}
                />
            )}

        </PageCard>
    );
}

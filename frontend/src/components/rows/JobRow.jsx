import { getInitials } from "../../utils";
import "./JobRow.css";

const statusConfig = {
    active:   { dot: "job-row-dot--active",   label: null },
    expiring: { dot: "job-row-dot--expiring", label: "Expiring soon" },
    inactive: { dot: "job-row-dot--inactive", label: null },
};

export default function JobRow({ job, onClick }) {
    const status = statusConfig[job.status] || statusConfig.active;

    return (
        <button
            type="button"
            className="job-row"
            onClick={() => {
                console.log("Clicked job:", job.title);
                if (onClick) onClick(job);
            }}
        >
            <div className="job-row-icon" style={{ background: job.bg, color: job.color }}>
                {getInitials(job.userName)}
            </div>
            <div className="job-row-body">
                <div className="job-row-title">
                    <span className={`job-row-dot ${status.dot}`} />
                    {job.title}
                </div>
                <div className="job-row-meta">
                    {[
                        job.location !== "N/A" ? job.location : null,
                        job.workType !== "N/A" ? job.workType : null,
                        `posted ${job.postedDate}`,
                    ].filter(Boolean).join(" · ")}
                </div>
            </div>
            <div className="job-row-chips">
                {job.newCount > 0 && (
                    <span className="job-row-chip job-row-chip--new">
                        +{job.newCount} new
                    </span>
                )}
                {job.status === "expiring" && (
                    <span className="job-row-chip job-row-chip--warn">
                        Expiring soon
                    </span>
                )}
                {job.matches > 0 && (
                    <span className="job-row-chip job-row-chip--match">
                        {job.matches} matched
                    </span>
                )}
            </div>
            <i className="ti ti-chevron-right job-row-chevron" aria-hidden="true" />
        </button>
    );
}
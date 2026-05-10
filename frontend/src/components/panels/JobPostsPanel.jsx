import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { filterJobs } from "../../utils/filter";
import { ListPanel } from "./";
import "./JobPostsPanel.css";


const filterOptions = [
    { key: "active",   label: "Active" },
    { key: "expiring", label: "Expiring" },
    { key: "inactive", label: "Inactive" },
    { key: "new",      label: "Has new" },
];

const DASHBOARD_LIMIT = 10;

export default function JobPostsPanel({ jobs = [], loading = false }) {
    const navigate = useNavigate();
    const [filterConfig, setFilterConfig] = useState({
        type: "preset",
        key: "active",
        label: "Active",
    });

    const filteredJobs = filterJobs(jobs, filterConfig)
        .slice(0, DASHBOARD_LIMIT)
        .map(j => ({
            ...j,
            meta: [
                    j.location !== "N/A" ? j.location : null,
                    j.workType !== "N/A" ? j.workType : null,
                    j.postedDate !== "N/A" ? `posted ${j.postedDate}` : null,
                ].filter(Boolean).join(" · ") || `posted ${j.postedDate}`,
        }));

    const handleNewJobPost = () => {
        console.log("Clicked: Post new job button");
        navigate("/new-job");
    }

    const handleJobPostClick = (job) => {
        console.log("Clicked:", job.title);
        navigate(`/jobs/${job.id}`);
    }

    return (
        <ListPanel
            title="Overall job postings"
            headerAction={
                <button 
                    type="button"
                    onClick={handleNewJobPost}
                >
                    + Post new job
                </button>
            }
            rows={filteredJobs}
            onRowClick={handleJobPostClick}
            filterConfig={filterConfig}
            onFilterChange={setFilterConfig}
            filterOptions={filterOptions}
            renderRight={(job) => (
                <>
                    {job.newCount > 0 && 
                        <span className="job-posts-new-tag">
                            +{job.newCount} new
                        </span>
                    }
                    <span
                        className={`job-posts-badge job-posts-badge--${job.status === "active" ? "active" : job.status === "expiring" ? "expiring" : "inactive"}`}
                    >
                        {job.status === "active" ? "Active" : job.status === "expiring" ? "Expiring soon" : "Inactive"}
                    </span>
                    {job.matches > 0 && (
                        <span className="job-posts-matches">
                            {job.matches} matches
                        </span>
                    )}
                </>
            )}
        />
    );
}
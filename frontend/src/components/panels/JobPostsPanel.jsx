import { useState } from 'react';
import { filterJobs } from "../../utils/filter";
import { ListPanel } from "./";
import "./JobPostsPanel.css";


const filterOptions = [
    { key: "all",      label: "All" },
    { key: "active",   label: "Active" },
    { key: "expiring", label: "Expiring" },
    { key: "inactive", label: "Inactive" },
    { key: "new",      label: "Has new" },
];
 
const customConditions = [
    { key: "matches",  label: "Min matches", unit: "matches", min: 0, max: 200, step: 5, initVal: 20 },
    { key: "newCount", label: "Min new",      unit: "new",     min: 0, max: 50,  step: 1, initVal: 1  },
];

export default function JobPostsPanel({ jobs = [] }) {
    const [filterConfig, setFilterConfig] = useState({
        type: "preset",
        key: "all",
        label: "All",
    });

    const filteredJobs = filterJobs(jobs, filterConfig)
        .map(j => ({
            ...j,
            meta: `${j.location} · ${j.workType} · posted ${j.postedDate}`,
        }));

    const handleNewJobPost = () => {
        console.log("Clicked: Post new job button");
    }

    const handleJobPostClick = (job) => {
        console.log("Clicked:", job.title);
        (job) => navigate(`/jobs/${job.id}`);
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
            customConditions={customConditions}
            renderRight={(job) => (
                <>
                    {job.newCount > 0 && 
                        <span className="job-posts-new-tag">
                            +{job.newCount} new
                        </span>
                    }
                    <span 
                        className={`job-posts-badge 
                            job-posts-badge--${
                                job.status === "active" 
                                ? "active" 
                                : "expiring"
                            }
                        `}
                    >
                        {job.status === "active" ? "Active" : "Expiring soon"}
                    </span>
                    <span className="job-posts-matches">
                        {job.matches} matches
                    </span>
                </>
            )}
        />
    );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageCard, PanelCard, JobRow, FilterBar } from "../../components";
import { filterJobs } from "../../utils/filter";
import { allEmployerJobs } from "../../fake-data/DashboardData";
import "./JobListingsPage.css";

const filterOptions = [
    { key: "active",   label: "Active" },
    { key: "new",      label: "Has new" },
    { key: "expiring", label: "Expiring" },
    { key: "inactive", label: "Inactive" },
    { key: "all",      label: "All" },
];

const sortOptions = [
    { key: "recent",  label: "Most recent" },
    { key: "matches", label: "Most matched" },
    { key: "new",     label: "Most new" },
    { key: "az",      label: "A – Z" },
];

const customConditions = [
    { key: "matches",  label: "Min matches", unit: "matches", min: 0, max: 200, step: 5,  initVal: 20 },
    { key: "newCount", label: "Min new",      unit: "new",     min: 0, max: 50,  step: 1,  initVal: 1  },
];

function JobList({ jobs, onJobClick }) {
    if (jobs.length === 0) {
        return <div className="empty">No jobs found.</div>;
    }
    return (
        <div className="rows">
            {jobs.map((job, i) => (
                <div key={job.id}>
                    {i > 0 && <div className="row-divider" />}
                    <JobRow job={job} onClick={onJobClick} />
                </div>
            ))}
        </div>
    );
}

export default function JobListingsPage() {
    const navigate = useNavigate();
    const [filterConfig, setFilterConfig] = useState({ type: "preset", key: "active", label: "Active" });
    const [search, setSearch]             = useState("");
    const [sortKey, setSortKey]           = useState("recent");

    const filtered = filterJobs(allEmployerJobs, filterConfig)
        .filter(j =>
            search === "" ||
            j.title.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (sortKey === "recent")  return new Date(b.postedDate) - new Date(a.postedDate);
            if (sortKey === "matches") return b.matches - a.matches;
            if (sortKey === "new")     return b.newCount - a.newCount;
            if (sortKey === "az")      return a.title.localeCompare(b.title);
            return 0;
        });

    const handleJobClick = (job) => navigate(`/jobs/${job.id}`);
    const handleNewJob   = () => navigate("/new-job");

    return (
        <PageCard breadcrumb="Jobs" title="Job Listings">
            <PanelCard>

                <div className="header">
                    <div className="header-left">
                        <span className="result-count">{filtered.length} jobs</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div className="search">
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                                <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
                                <path d="M8.5 8.5l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            </svg>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search by title…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className="new-job-btn"
                            onClick={handleNewJob}
                        >
                            + Post new job
                        </button>
                    </div>
                </div>

                <div className="controls">
                    <div className="controls-row">
                        <FilterBar
                            value={filterConfig}
                            onChange={(config) => setFilterConfig(config)}
                            filterOptions={filterOptions}
                            customConditions={customConditions}
                        />
                        <div className="sort">
                            <span className="sort-label">Sort:</span>
                            <select
                                className="sort-select"
                                value={sortKey}
                                onChange={e => setSortKey(e.target.value)}
                            >
                                {sortOptions.map(opt => (
                                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="rule" />

                <JobList jobs={filtered} onJobClick={handleJobClick} />

            </PanelCard>
        </PageCard>
    );
}

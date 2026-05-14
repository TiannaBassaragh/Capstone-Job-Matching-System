import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageCard, PanelCard, JobRow, FilterBar, SearchIcon } from "../../components";
import { filterJobs } from "../../utils/filter";
import { jobsService } from "../../lib/jobsService";
import "./JobListingsPage.css";

const filterOptions = [
    { key: "all",      label: "All" },
    { key: "active",   label: "Active" },
    { key: "expiring", label: "Expiring" },
    { key: "inactive", label: "Inactive" },
];

const sortOptions = [
    { key: "recent",  label: "Most recent" },
    { key: "matches", label: "Most matched" },
    { key: "az",      label: "A – Z" },
];

const customConditions = [
    { key: "matches", label: "Min matches", unit: "matches", min: 0, max: 200, step: 5, initVal: 20 },
];

function JobList({ jobs, onJobClick, loading }) {
    if (loading) return <div className="empty">Loading…</div>;
    if (jobs.length === 0) return <div className="empty">No jobs found.</div>;
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
    const [jobs,         setJobs]         = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [filterConfig, setFilterConfig] = useState({ type: "preset", key: "all", label: "All" });
    const [search,       setSearch]       = useState("");
    const [sortKey,      setSortKey]      = useState("recent");

    useEffect(() => {
        jobsService.getMyJobs()
            .then(setJobs)
            .catch(err => console.error("Jobs load error:", err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = filterJobs(jobs, filterConfig)
        .filter(j => search === "" || j.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortKey === "recent")  return new Date(b.postedDate) - new Date(a.postedDate);
            if (sortKey === "matches") return (b.matches || 0) - (a.matches || 0);
            if (sortKey === "az")      return a.title.localeCompare(b.title);
            return 0;
        });

    return (
        <PageCard breadcrumb="Jobs" title="Job Listings">
            <PanelCard>

                <div className="header">
                    <div className="header-left">
                        <span className="result-count">{loading ? "…" : `${filtered.length} jobs`}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div className="search">
                            <SearchIcon />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search by title…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button type="button" className="new-job-btn" onClick={() => navigate("/new-job")}>
                            + Post new job
                        </button>
                    </div>
                </div>

                <div className="controls">
                    <div className="controls-row">
                        <FilterBar
                            value={filterConfig}
                            onChange={setFilterConfig}
                            filterOptions={filterOptions}
                            customConditions={customConditions}
                        />
                        <div className="sort">
                            <span className="sort-label">Sort:</span>
                            <select className="sort-select" value={sortKey} onChange={e => setSortKey(e.target.value)}>
                                {sortOptions.map(opt => (
                                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="rule" />

                <JobList jobs={filtered} onJobClick={(job) => navigate(`/jobs/${job.id}`)} loading={loading} />

            </PanelCard>
        </PageCard>
    );
}
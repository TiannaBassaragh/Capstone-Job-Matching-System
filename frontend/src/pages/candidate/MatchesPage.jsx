import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageCard, PanelCard, DistributionBar, MatchRow, FilterBar } from "../../components";
import { filterMatches } from "../../utils";
import { candidateMatches } from "../../fake-data/DashboardData";
import { matchSkills } from "../../fake-data/MatchData";
import "./MatchesPage.css";

const filterOptions = [
    { key: "all",   label: "All" },
    { key: "80+",   label: "80%+ match" },
    { key: "60+",   label: "60%+ match" },
    { key: "top10", label: "Top 10" },
    { key: "new",   label: "New this week" },
];

const sortOptions = [
    { key: "score",  label: "Best match" },
    { key: "pay",    label: "Highest pay" },
    { key: "az",     label: "A – Z" },
    { key: "recent", label: "Most recent" },
];

const customConditions = [
    { key: "percent", label: "At least", unit: "% match", min: 0,  max: 100, step: 5,  initVal: 70 },
    { key: "top",     label: "Top",      unit: "results", min: 1,  max: 50,  step: 1,  initVal: 10 },
];

function MatchListPanel({ matches, skills, expandedId, onToggle, onViewDetails }) {
    return (
        <div className="rows">
            {matches.length === 0
                ? <div className="empty">No matches found.</div>
                : matches.map(match => (
                    <MatchRow
                        key={match.id}
                        match={match}
                        skills={skills[match.id] || { strong: [], partial: [] }}
                        isExpanded={expandedId === match.id}
                        onToggle={() => onToggle(match.id)}
                        onViewDetails={onViewDetails}
                    />
                ))
            }
        </div>
    );
}

export default function MatchesPage() {
    const navigate = useNavigate();
    const [expandedId,    setExpandedId]   = useState(null);
    const [filterConfig,  setFilterConfig] = useState({ type: "preset", key: "all", label: "All" });
    const [search,        setSearch]       = useState("");
    const [sortKey,       setSortKey]      = useState("score");

    const filtered = filterMatches(candidateMatches, filterConfig)
        .filter(m =>
            search === "" ||
            m.title.toLowerCase().includes(search.toLowerCase()) ||
            m.userName.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (sortKey === "score")  return b.score - a.score;
            if (sortKey === "pay")    return b.payHigh - a.payHigh;
            if (sortKey === "az")     return a.title.localeCompare(b.title);
            if (sortKey === "recent") return b.id - a.id;
            return 0;
        });

    const handleToggle      = (id)    => setExpandedId(prev => prev === id ? null : id);
    const handleViewDetails = (match) => navigate(`/matches/${match.id}`);

    return (
        <PageCard breadcrumb="Matches" title="Matches List">
            <PanelCard>

                <div className="header">
                    <div className="header-left">
                        <span className="result-count">{filtered.length} results</span>
                        <DistributionBar items={filtered} />
                    </div>
                    <div className="search">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
                            <path d="M8.5 8.5l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by title or company…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setExpandedId(null); }}
                        />
                    </div>
                </div>

                <div className="controls">
                    <div className="controls-row">
                        <FilterBar
                            value={filterConfig}
                            onChange={(config) => { setFilterConfig(config); setExpandedId(null); }}
                            filterOptions={filterOptions}
                            customConditions={customConditions}
                        />
                        <div className="sort">
                            <span className="sort-label">Sort:</span>
                            <select
                                className="sort-select"
                                value={sortKey}
                                onChange={e => { setSortKey(e.target.value); setExpandedId(null); }}
                            >
                                {sortOptions.map(opt => (
                                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="rule" />

                <MatchListPanel
                    matches={filtered}
                    skills={matchSkills}
                    expandedId={expandedId}
                    onToggle={handleToggle}
                    onViewDetails={handleViewDetails}
                />

            </PanelCard>
        </PageCard>
    );
}
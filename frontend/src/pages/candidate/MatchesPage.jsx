import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageCard, PanelCard, DistributionBar, MatchRow, FilterBar, SearchIcon } from "../../components";
import { filterMatches } from "../../utils";
import { matchesService } from "../../lib/matchesService";
import { mapGapProfileToSkills } from "../../lib/mappers";
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
    { key: "az",     label: "A – Z" },
    { key: "recent", label: "Most recent" },
];

const customConditions = [
    { key: "percent", label: "At least", unit: "% match", min: 0,  max: 100, step: 5,  initVal: 70 },
    { key: "top",     label: "Top",      unit: "results", min: 1,  max: 50,  step: 1,  initVal: 10 },
];

function MatchListPanel({ matches, skills, expandedId, onToggle, onViewDetails, loading }) {
    if (loading) return <div className="empty">Loading…</div>;
    if (matches.length === 0) return <div className="empty">No matches found.</div>;

    return (
        <div className="rows">
            {matches.map(match => (
                <MatchRow
                    key={match.id}
                    match={match}
                    skills={skills[match.id] || { strong: [], partial: [] }}
                    isExpanded={expandedId === match.id}
                    onToggle={() => onToggle(match.id)}
                    onViewDetails={onViewDetails}
                />
            ))}
        </div>
    );
}

export default function MatchesPage() {
    const navigate = useNavigate();

    const [matches,       setMatches]      = useState([]);
    const [loading,       setLoading]      = useState(true);
    const [expandedId,    setExpandedId]   = useState(null);
    const [filterConfig,  setFilterConfig] = useState({ type: "preset", key: "all", label: "All" });
    const [search,        setSearch]       = useState("");
    const [sortKey,       setSortKey]      = useState("score");

    useEffect(() => {
        matchesService.getRecommendations(50)
            .then(setMatches)
            .catch(err => console.error("Matches load error:", err))
            .finally(() => setLoading(false));
    }, []);

    // Derive skills map (gap_profile → { strong, partial, missing }) from the
    // loaded matches so MatchRow's expanded view doesn't need to re-fetch.
    const skillsByMatchId = matches.reduce((acc, m) => {
        acc[m.id] = mapGapProfileToSkills(m.gapProfile);
        return acc;
    }, {});

    const filtered = filterMatches(matches, filterConfig)
        .filter(m =>
            search === "" ||
            m.title.toLowerCase().includes(search.toLowerCase()) ||
            m.userName.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (sortKey === "score")  return b.score - a.score;
            if (sortKey === "az")     return a.title.localeCompare(b.title);
            if (sortKey === "recent") return b.id - a.id;
            return 0;
        });

    const handleToggle      = (id)    => setExpandedId(prev => prev === id ? null : id);
    const handleViewDetails = (match) => navigate(`/matches/${match.id}`, { state: { match } });

    return (
        <PageCard breadcrumb="Matches" title="Matches List">
            <PanelCard>

                <div className="header">
                    <div className="header-left">
                        <span className="result-count">
                            {loading ? "…" : `${filtered.length} results`}
                        </span>
                        <DistributionBar items={filtered} />
                    </div>
                    <div className="search">
                        <SearchIcon />
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
                    skills={skillsByMatchId}
                    expandedId={expandedId}
                    onToggle={handleToggle}
                    onViewDetails={handleViewDetails}
                    loading={loading}
                />

            </PanelCard>
        </PageCard>
    );
}

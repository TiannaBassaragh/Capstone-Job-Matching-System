import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PanelCard, FilterBar, CandidateRow } from "../../components";
import "./CandidatesSection.css";

const filterOptions = [
    { key: "all",   label: "All" },
    { key: "80+",   label: "80%+ match" },
    { key: "60+",   label: "60%+ match" },
    { key: "top10", label: "Top 10" },
    { key: "new",   label: "New this week" },
    { key: "short", label: "⭐ Shortlisted" },
];

const sortOptions = [
    { key: "score", label: "Best match" },
    { key: "az",    label: "A – Z" },
    { key: "new",   label: "New first" },
];

const customConditions = [
    { key: "percent", label: "At least", unit: "% match", min: 0,  max: 100, step: 5, initVal: 70 },
    { key: "top",     label: "Top",      unit: "results", min: 1,  max: 50,  step: 1, initVal: 10 },
];

export default function CandidatesSection({ candidates = [], jobId, onShortlistChange }) {
    const navigate = useNavigate();
    const [filterConfig, setFilterConfig] = useState({ type: "preset", key: "all", label: "All" });
    const [sortKey, setSortKey]           = useState("score");

    const filtered = candidates
        .filter(c => {
            if (filterConfig.type === "custom") {
                const { percent, top } = filterConfig.rules;
                const passPercent = percent.active ? c.score >= percent.value : true;
                return passPercent;
            }
            if (filterConfig.key === "80+")   return c.score >= 80;
            if (filterConfig.key === "60+")   return c.score >= 60;
            if (filterConfig.key === "new")   return c.isNew;
            if (filterConfig.key === "short") return c.shortlisted;
            return true;
        })
        .sort((a, b) => {
            if (sortKey === "score") return b.score - a.score;
            if (sortKey === "az")    return a.userName.localeCompare(b.userName);
            if (sortKey === "new")   return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
            return 0;
        })
        .slice(0, (() => {
            if (filterConfig.key === "top10") return 10;
            if (filterConfig.type === "custom" && filterConfig.rules?.top?.active) return filterConfig.rules.top.value;
            return undefined;
        })());

    const handleCandidateClick = (candidate) => {
        navigate(`/jobs/${jobId}/candidate/${candidate.id}`, { state: { candidate, jobId } });
    };

    return (
        <PanelCard>
            <div className="candidates-controls">
                <FilterBar
                    value={filterConfig}
                    onChange={setFilterConfig}
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

            <div className="candidates-rule" />

            <div className="candidates-list">
                {filtered.length === 0
                    ? <div className="candidates-empty">No candidates found.</div>
                    : filtered.map((c, i) => (
                        <div key={c.id}>
                            {i > 0 && <div className="candidates-divider" />}
                            <CandidateRow candidate={c} onClick={handleCandidateClick} onShortlistChange={onShortlistChange} />
                        </div>
                    ))
                }
            </div>
        </PanelCard>
    );
}
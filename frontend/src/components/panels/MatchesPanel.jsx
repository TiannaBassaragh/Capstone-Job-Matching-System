import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getScoreStyle, filterMatches } from "../../utils";
import { ListPanel } from "./";
import "./MatchesPanel.css";


const filterOptions = [
    { key: "top10", label: "Top 10" },
    { key: "80+",   label: "80%+ match" },
    { key: "60+",   label: "60%+ match" },
    { key: "new",   label: "New this week" },
];

const DASHBOARD_LIMIT = 10;

// const customConditions = [
//     { key: "percent", label: "At least", unit: "% match", min: 0,  max: 100, step: 5, initVal: 70 },
//     { key: "top",     label: "Top",   unit: "results", min: 1,  max: 50,  step: 1, initVal: 10 },
// ];
 
export default function MatchesPanel({ matches=[] }) {
    const navigate = useNavigate();

    const [filterConfig, setFilterConfig] = useState({
        type: "preset",
        key: "top10",
        label: "Top 10",
    });

    const filteredMatches = filterMatches(matches, filterConfig)
        .slice(0, DASHBOARD_LIMIT)
        .map(m => ({
            ...m,
            meta: `${m.userName} · ${m.location} · $${m.payLow}k – $${m.payHigh}k`,
        }));

    const handleFilterSelect = (key, label) => {
        setFilterConfig(prev =>
            prev.key === key
                ? { type: "preset", key: "top10", label: "Top 10" }
                : { type: "preset", key, label }
        );
    };

    const handleViewAllMatches = () => {
        console.log("Clicked: view all matches");
        navigate("/matches");
    }

    const handleMatchClick = (match) => {
        console.log("Clicked match:", match.title);
        navigate(`/matches/${match.id}`);
    }

    return (
        <ListPanel
            title="Your matches"
            headerAction={
                <button
                    type="button"
                    onClick={handleViewAllMatches}
                >
                    View all {matches.length} matches ↗
                </button>
            }
            rows={filteredMatches}
            onRowClick={handleMatchClick}
            filterConfig={filterConfig}
            onFilterChange={setFilterConfig}
            filterOptions={filterOptions}
            renderRight={(match) => {
                const { color, barColor } = getScoreStyle(match.score);
                return (
                    <div className="score-block">
                        <div className="score" style={{ color }}>{match.score}%</div>
                        <div className="score-bar">
                            <div 
                                className="score-fill" 
                                style={{ width: `${match.score}%`, background: barColor }} 
                            />
                        </div>
                    </div>
                );
            }}
        />
    );
}
import { useState } from "react";
import { getScoreStyle, filterMatches } from "../../utils";
import { ListPanel } from "./listpanel";
import "./MatchesPanel.css";


const filterOptions = [
    { key: "all",   label: "All" },
    { key: "80+",   label: "80%+ match" },
    { key: "60+",   label: "60%+ match" },
    { key: "top20", label: "Top 20" },
    { key: "new",   label: "New this week" },
];


const customConditions = [
    { key: "percent", label: "At least", unit: "% match", min: 0,  max: 100, step: 5, initVal: 70 },
    { key: "top",     label: "Top",   unit: "results", min: 1,  max: 50,  step: 1, initVal: 10 },
];
 
export default function MatchesPanel({ matches=[] }) {
    const [filterConfig, setFilterConfig] = useState({
        type: "preset",
        key: "all",
        label: "All",
    });

    const filteredMatches = filterMatches(matches, filterConfig);
    
    const handleViewAllMatches = () => {
        console.log("Clicked: view all matches");
    }

    const handleMatchClick = (job) => {
        console.log("Clicked:", job.title);
    }

    return (
        <ListPanel
            title="Your matches"
            headerAction={
                <button
                    type="button"
                    onClick={handleViewAllMatches}
                >
                    View all {matches.length} ↗
                </button>
            }
            rows={filteredMatches}
            onRowClick={handleMatchClick}
            filterConfig={filterConfig}
            onFilterChange={setFilterConfig}
            filterOptions={filterOptions}
            customConditions={customConditions}
            renderRight={(match) => {
                const { color, barColor } = getScoreStyle(match.score);
                return (
                    <div className="matches-score-block">
                        <div 
                            className="matches-score" 
                            style={{ color }}
                        >
                            {match.score}%
                        </div>
                        <div className="matches-score-bar">
                            <div 
                                className="matches-score-fill" 
                                style={{ 
                                    width: `${match.score}%`, 
                                    background: barColor 
                                }} 
                            />
                        </div>
                    </div>
                );
            }}
        />
    );
}
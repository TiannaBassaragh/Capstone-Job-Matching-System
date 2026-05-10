import { PanelCard } from "../cards";
import { getScoreStyle, getInitials } from '../../utils';
import "./TopCandidatesPanel.css";

export default function TopCandidatesPanel({ topCandidates=[] }) {
    return (
        <PanelCard title="Top candidates">
            <div className="top-candidates-list">
                {topCandidates.map((candidate, i) => {
                    const { color, barColor } = getScoreStyle(candidate.score);

                    return (
                        <div key={i}>
                            {i > 0 && <div className="top-candidates-divider" />}

                            <button
                                type="button"
                                className="top-candidates-row"
                                onClick={() => {
                                    console.log("Clicked:", candidate);
                                }}
                            >
                                <div
                                    className="top-candidates-avatar"
                                    style={{
                                        background: candidate.bg,
                                        color: candidate.color,
                                    }}
                                >
                                    {getInitials(candidate.userName)}
                                </div>

                                <div className="top-candidates-body">
                                    <div className="top-candidates-name">{candidate.userName}</div>
                                    <div className="top-candidates-meta">{candidate.job}</div>
                                </div>

                                <div className="top-candidates-score-block">
                                    <div
                                        className="top-candidates-score"
                                        style={{ color }}
                                    >
                                        {candidate.score}%
                                    </div>

                                    <div className="top-candidates-bar-track">
                                        <div
                                            className="top-candidates-bar-fill"
                                            style={{
                                                width: `${candidate.score}%`,
                                                background: barColor,
                                            }}
                                        />
                                    </div>
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </PanelCard>
    );
}
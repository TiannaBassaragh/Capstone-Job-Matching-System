import { useNavigate } from "react-router-dom";
import { PanelCard } from "../cards";
import { getScoreStyle, getInitials } from '../../utils';
import "./TopCandidatesPanel.css";

export default function TopCandidatesPanel({ topCandidates=[] }) {
    const navigate = useNavigate();

    return (
        <PanelCard title="Top candidates">
            <div className="top-candidates-list">
                {topCandidates.length === 0 && (
                    <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>
                        No candidates matched yet.
                    </div>
                )}
                {topCandidates.map((candidate, i) => {
                    const { color, barColor } = getScoreStyle(candidate.score);

                    return (
                        <div key={i}>
                            {i > 0 && <div className="top-candidates-divider" />}

                            <button
                                type="button"
                                className="top-candidates-row"
                                onClick={() => {
                                    console.log("Clicked:", candidate.userName);
                                    if (candidate.jobId) {
                                        navigate(`/jobs/${candidate.jobId}/candidate/${candidate.id}`);
                                    }
                                }}
                            >
                                <div
                                    className="top-candidates-avatar"
                                    style={{ background: candidate.bg, color: candidate.color }}
                                >
                                    {candidate.avatar
                                        ? <img src={candidate.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                                        : getInitials(candidate.userName)
                                    }
                                </div>

                                <div className="top-candidates-body">
                                    <div className="top-candidates-name">{candidate.userName}</div>
                                    <div className="top-candidates-meta">{candidate.job}</div>
                                </div>

                                <div className="top-candidates-score-block">
                                    <div className="top-candidates-score" style={{ color }}>
                                        {candidate.score > 0 ? `${candidate.score}%` : "—"}
                                    </div>
                                    <div className="top-candidates-bar-track">
                                        <div
                                            className="top-candidates-bar-fill"
                                            style={{ width: `${candidate.score ?? 0}%`, background: barColor }}
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
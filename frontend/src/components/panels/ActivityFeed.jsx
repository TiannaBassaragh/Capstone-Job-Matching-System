import { useState } from "react";
import { PanelCard } from "../cards";
import "./ActivityFeed.css";

const PREVIEW_COUNT = 3;

const dotColor = {
    match:   "#22a84a",
    posted:  "#4B7FE3",
    created: "#aab5c8",
};

export default function ActivityFeed({ activity = [] }) {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? activity : activity.slice(0, PREVIEW_COUNT);
    const hasMore = activity.length > PREVIEW_COUNT;

    return (
        <PanelCard>
            <div className="section-label">Activity</div>
            <div className="activity-list">
                {visible.map((item, i) => (
                    <div key={i} className="activity-item">
                        <div className="activity-dot" style={{ background: dotColor[item.type] || "#aab5c8" }} />
                        <div>
                            <div className="activity-text">{item.text}</div>
                            <div className="activity-time">{item.time}</div>
                        </div>
                    </div>
                ))}
            </div>
            {hasMore && (
                <button
                    type="button"
                    className="activity-toggle"
                    onClick={() => setExpanded(prev => !prev)}
                >
                    {expanded ? "Show less ↑" : `Show all ${activity.length} ↓`}
                </button>
            )}
        </PanelCard>
    );
}

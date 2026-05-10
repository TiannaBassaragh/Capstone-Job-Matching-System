import { PanelCard, DistributionBar, ActivityFeed, MatchStatsPanel, TopCandidatesPreview } from "../../components";
import "./OverviewSection.css";

export default function OverviewSection({ job, description, candidates, activity, onCandidateClick }) {
    return (
        <div className="overview-layout">

            <div className="overview-left">
                <PanelCard>
                    <div className="section-label">About the role</div>
                    <div className="facts">
                        <div className="fact-row">
                            <span className="fact-key">Work type</span>
                            <span className="fact-val">{job.workType}</span>
                        </div>
                        <div className="fact-row">
                            <span className="fact-key">Location</span>
                            <span className="fact-val">{job.location}</span>
                        </div>
                        <div className="fact-row">
                            <span className="fact-key">Posted</span>
                            <span className="fact-val">{job.postedDate}</span>
                        </div>
                    </div>
                    <p className="job-description">{description}</p>
                </PanelCard>

                <TopCandidatesPreview candidates={candidates} onCandidateClick={onCandidateClick} />
            </div>

            <div className="overview-right">
                <MatchStatsPanel job={job} candidates={candidates} />

                <PanelCard>
                    <div className="section-label">Score distribution</div>
                    <DistributionBar items={candidates} variant="list" />
                </PanelCard>

                <ActivityFeed activity={activity} />
            </div>

        </div>
    );
}

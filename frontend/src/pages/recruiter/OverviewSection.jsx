import {
    PanelCard,
    DistributionBar,
    ActivityFeed,
    MatchStatsPanel,
    TopCandidatesPreview,
    RoleFactsPanel,
} from "../../components";
import "./OverviewSection.css";

export default function OverviewSection({ job, description, candidates, activity, onCandidateClick }) {
    const facts = [
        { key: "Work type", value: job.workType  },
        { key: "Location",  value: job.location  },
        { key: "Posted",    value: job.postedDate },
    ];

    return (
        <div className="overview-layout">

            <div className="overview-left">
                <RoleFactsPanel facts={facts} description={description} />

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

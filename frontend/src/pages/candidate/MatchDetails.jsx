import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    PageCard, PanelCard,
    ScorePanel, CompetencyPanel, SkillsPanel, RecruiterPanel,
    MatchHeroPanel, RoleFactsPanel, MatchContextPanel,
} from "../../components";
import { matchesService } from "../../lib/matchesService";
import { formatTier } from "../../lib/mappers";
import { getCompetencyScores } from "../../utils";
import "./MatchDetails.css";

const NA = "N/A";

// Fallback recruiter card content — backend doesn't expose a per-match recruiter
// contact yet, so we show the company as a generic hiring team.
function makeRecruiterFallback(match) {
    return {
        userName: "Hiring team",
        title:    match.userName,            // company name
        email:    null,
    };
}

export default function MatchDetails() {
    const { matchId } = useParams();
    const navigate    = useNavigate();
    const location    = useLocation();

    const [match,       setMatch]       = useState(location.state?.match || null);
    const [explanation, setExplanation] = useState(null);
    const [loading,     setLoading]     = useState(!location.state?.match);

    // Load the match if we didn't get it from navigation state. We fall back to
    // /matches/recommendations + find-by-id because the bare /matches/:id
    // response doesn't include title / company name.
    useEffect(() => {
        if (match) return;

        async function load() {
            setLoading(true);
            try {
                const recs = await matchesService.getRecommendations(50);
                const found = recs.find(r => String(r.id) === String(matchId));
                if (found) setMatch(found);
            } catch (err) {
                console.error("MatchDetails load error:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [matchId, match]);

    // Load explanation separately — it's slow (LLM) so we don't want to block
    // the rest of the UI on it.
    useEffect(() => {
        if (!match || match.explanation) return;
        matchesService.getMatchExplanation(matchId)
            .then(setExplanation)
            .catch(() => setExplanation(null));
    }, [matchId, match]);

    if (loading) {
        return (
            <PageCard breadcrumb="Matches / Details" title="Match Details">
                <PanelCard><p className="muted-message">Loading…</p></PanelCard>
            </PageCard>
        );
    }

    if (!match) {
        return (
            <PageCard breadcrumb="Matches / Details" title="Match Details">
                <PanelCard>
                    <p className="muted-message">
                        Match not found.{" "}
                        <button onClick={() => navigate("/matches")} className="muted-message-link">
                            Go back to matches.
                        </button>
                    </p>
                </PanelCard>
            </PageCard>
        );
    }

    // Derived values
    const comps   = getCompetencyScores(match.score);
    const skills  = matchesService.getSkillsFromMatch(match);
    const why     = match.explanation || explanation || "Loading explanation…";
    const recruiter = makeRecruiterFallback(match);

    const competencyCounts = {
        strong:  comps.filter(c => c.value >= 80).length,
        partial: comps.filter(c => c.value >= 60 && c.value < 80).length,
        weak:    comps.filter(c => c.value < 60).length,
    };

    const strongest = [...comps].sort((a, b) => b.value - a.value)[0]?.label || NA;
    const weakest   = [...comps].sort((a, b) => a.value - b.value)[0]?.label || NA;

    const facts = [
        { key: "Work type", value: match.workType || NA },
        { key: "Location",  value: match.location  || NA },
        { key: "Tier",      value: formatTier(match.tier) },
    ];

    return (
        <PageCard breadcrumb={`Matches / ${match.userName} ${match.title}`} title="Match Details">
            <div className="match-details-layout">

                <div className="match-details-left">

                    <MatchHeroPanel
                        match={match}
                        onBack={() => navigate("/matches")}
                    />

                    <PanelCard>
                        <div className="section-label">Why this fits you</div>
                        <p className="why-text">{why}</p>
                    </PanelCard>

                    <RoleFactsPanel facts={facts} />

                    <CompetencyPanel competencies={comps} />

                    <SkillsPanel skills={skills} />

                </div>

                <div className="match-details-right">

                    <ScorePanel score={match.score} counts={competencyCounts} />

                    <RecruiterPanel recruiter={recruiter} jobTitle={match.title} />

                    <MatchContextPanel
                        score={match.score}
                        skills={skills}
                        strongest={strongest}
                        weakest={weakest}
                    />

                </div>
            </div>
        </PageCard>
    );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    PageCard, PanelCard,
    ScorePanel, CompetencyPanel, RecruiterPanel,
    MatchHeroPanel, RoleFactsPanel, MatchContextPanel,
} from "../../components";
import { matchesService } from "../../lib/matchesService";
import { jobsService } from "../../lib/jobsService";
import { formatTier } from "../../lib/mappers";
import "./MatchDetails.css";

const NA = "N/A";

function parseExplanation(text) {
    if (!text) return null;
    const lines = text.split("\n");
    const sections = [];
    let bullets = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (bullets) { sections.push({ type: "bullets", items: bullets }); bullets = null; }
            continue;
        }
        if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
            if (!bullets) bullets = [];
            bullets.push(trimmed.replace(/^[•\-]\s*/, ""));
        } else {
            if (bullets) { sections.push({ type: "bullets", items: bullets }); bullets = null; }
            sections.push({ type: "heading", text: trimmed });
        }
    }
    if (bullets) sections.push({ type: "bullets", items: bullets });
    return sections;
}

export default function MatchDetails() {
    const { matchId } = useParams();
    const navigate    = useNavigate();
    const location    = useLocation();

    const [match,       setMatch]       = useState(location.state?.match || null);
    const [explanation, setExplanation] = useState(null);
    const [jobTech,     setJobTech]     = useState([]);
    const [myTech,      setMyTech]      = useState([]);
    const [loading,     setLoading]     = useState(!location.state?.match);
    const [interested,  setInterested]  = useState(false);
    const [interestLoading, setInterestLoading] = useState(false);

    // Load the match if we didn't get it from navigation state. We fall back to
    // /matches/recommendations + find-by-id because the bare /matches/:id
    // response doesn't include title / company name.
    useEffect(() => {
        if (match) return;

        async function load() {
            setLoading(true);
            try {
                const recs = await matchesService.getRecommendations(200);
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

    // Sync interested state from match data
    useEffect(() => {
        if (match?.interested) setInterested(true);
    }, [match]);

    const handleInterest = async () => {
        if (interested || interestLoading) return;
        setInterestLoading(true);
        try {
            await matchesService.showInterest(matchId);
            setInterested(true);
        } catch (err) {
            console.error("Interest error:", err);
        } finally {
            setInterestLoading(false);
        }
    };

    // Load job tech keywords + candidate tech keywords
    useEffect(() => {
        if (!match) return;
        jobsService.getJobCompetencies(match.jobId)
            .then(data => setJobTech(data.techKeywords ?? []))
            .catch(() => {});
        matchesService.getMyCompetencies()
            .then(data => setMyTech(data.techKeywords ?? []))
            .catch(() => {});
    }, [match]);

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
    const scoredDimValues   = Object.values(match.gapProfile?.scored       ?? {});
    const undeterminedDims  = Object.values(match.gapProfile?.undetermined  ?? {});
    const absentDims        = Object.values(match.gapProfile?.absent        ?? {});

    // Competency bars — scored dims first (sorted by level), then undetermined, then absent
    const comps = [
        ...scoredDimValues
            .map(d => ({
                key:    d.name,
                label:  d.name,
                value:  Math.round(d.candidate_level ?? 0),
                desc:   d.category ?? "",
                status: (d.gap ?? 1) === 0 ? "met" : "gap",
            }))
            .sort((a, b) => b.value - a.value),
        ...undeterminedDims.map(d => ({
            key:    d.name,
            label:  d.name,
            value:  0,
            desc:   "",
            status: "undetermined",
        })),
        ...absentDims.map(d => ({
            key:    d.name,
            label:  d.name,
            value:  0,
            desc:   "",
            status: "absent",
        })),
    ];

    // Score panel counts
    // Strong  — meets or exceeds the job requirement (gap === 0)
    // Partial — present in resume but falls short of requirement (gap > 0)
    // Gap     — undetermined or absent from resume entirely
    const undeterminedCount = Object.keys(match.gapProfile?.undetermined ?? {}).length;
    const absentCount       = Object.keys(match.gapProfile?.absent       ?? {}).length;
    const competencyCounts = {
        strong:  scoredDimValues.filter(d => (d.gap ?? 1) === 0).length,
        partial: scoredDimValues.filter(d => (d.gap ?? 0) >  0).length,
        weak:    undeterminedCount + absentCount,
    };

    const whyText = match.explanation || explanation || null;
    const whySections = parseExplanation(whyText);
    const recruiter = {
        userName: match.recruiterName || match.userName,
        title:    match.recruiterName ? match.userName : null,
        avatar:   match.companyLogo   || null,
        email:    match.recruiterEmail || null,
    };

    const scoredComps = comps.filter(c => c.status === "met" || c.status === "gap");
    const strongest = scoredComps.length > 0 ? [...scoredComps].sort((a, b) => b.value - a.value)[0].label : NA;
    const weakest   = scoredComps.length > 0 ? [...scoredComps].sort((a, b) => a.value - b.value)[0].label : NA;

    const salary = match.payLow || match.payHigh
        ? [match.payLow, match.payHigh].filter(Boolean).map(n => `$${n.toLocaleString()}`).join(" – ")
        : null;

    const facts = [
        { key: "Work type",   value: match.workType  || NA },
        { key: "Location",    value: match.location   || NA },
        { key: "Experience",  value: match.experience || NA },
        salary && { key: "Salary",   value: salary },
        match.expiresAt && { key: "Closes",  value: new Date(match.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
        { key: "Tier",        value: formatTier(match.tier) },
    ].filter(Boolean);

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
                        {whySections
                            ? whySections.map((s, i) =>
                                s.type === "heading"
                                    ? <div key={i} className="why-heading">{s.text}</div>
                                    : <ul key={i} className="why-bullets">
                                        {s.items.map((item, j) => <li key={j}>{item}</li>)}
                                      </ul>
                              )
                            : <p className="why-text">Generating explanation…</p>
                        }
                    </PanelCard>

                    <RoleFactsPanel facts={facts} description={match.description} />

                    {comps.length > 0
                        ? <CompetencyPanel competencies={comps} />
                        : <PanelCard><p className="muted-message">Competency data not available yet.</p></PanelCard>
                    }

                </div>

                <div className="match-details-right">

                    <ScorePanel score={match.score} counts={competencyCounts} />

                    <RecruiterPanel recruiter={recruiter} jobTitle={match.title} />

                    <MatchContextPanel
                        score={match.score}
                        metCount={competencyCounts.strong}
                        totalCount={scoredDimValues.length + undeterminedDims.length + absentDims.length}
                        strongest={strongest}
                        weakest={weakest}
                    />

                    <PanelCard>
                        <button
                            className={`interest-btn${interested ? " interest-btn--active" : ""}`}
                            onClick={handleInterest}
                            disabled={interested || interestLoading}
                        >
                            <i className={`ti ${interested ? "ti-heart-filled" : "ti-heart"}`} />
                            {interested ? "Interest shown" : interestLoading ? "Sending..." : "Show interest"}
                        </button>
                        {match.shortlisted && (
                            <div className="shortlisted-badge">
                                <i className="ti ti-star-filled" /> Shortlisted by recruiter
                            </div>
                        )}
                    </PanelCard>

                    {jobTech.length > 0 && (
                        <PanelCard>
                            <div className="section-label">Required tech skills</div>
                            <div className="tech-skills-grid">
                                {jobTech.map(s => {
                                    const matched = myTech.some(t => t.toLowerCase() === s.toLowerCase());
                                    return (
                                        <span key={s} className={`tech-skill-chip${matched ? " tech-skill-chip--matched" : ""}`}>{s}</span>
                                    );
                                })}
                            </div>
                        </PanelCard>
                    )}

                </div>
            </div>
        </PageCard>
    );
}

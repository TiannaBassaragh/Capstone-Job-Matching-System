import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PageCard, PanelCard } from "../../components/cards";
import { CompetencyPanel, ScorePanel, CandidateProfilePanel } from "../../components/panels";
import { ResumeModal } from "../../components/content";
import { jobsService } from "../../lib/jobsService";
import { matchesService } from "../../lib/matchesService";
import "./CandidateDetailPage.css";

const NA = "N/A";

export default function CandidateDetailPage() {
    const { jobId, candidateId } = useParams();
    const navigate               = useNavigate();
    const location               = useLocation();

    const [showResume,   setShowResume]   = useState(false);
    const [resumeText,   setResumeText]   = useState(null);
    const [profile,      setProfile]      = useState(null);
    const [jobTitle,     setJobTitle]     = useState("");
    const [jobTech,      setJobTech]      = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [explanation,  setExplanation]  = useState(null);

    const stateCandidate = location.state?.candidate;

    useEffect(() => {
        Promise.all([
            jobsService.getCandidateProfile(candidateId),
            jobsService.getJob(jobId),
            jobsService.getJobCompetencies(jobId),
        ])
            .then(([profileData, jobData, jobCompData]) => {
                setProfile(profileData);
                setJobTitle(jobData.title);
                setJobTech(jobCompData.techKeywords ?? []);
                const jm = profileData?.matches?.find(m => m.job_id === Number(jobId));
                if (jm?.explanation) setExplanation(jm.explanation);
            })
            .catch(err => console.error("Candidate detail load error:", err))
            .finally(() => setLoading(false));
    }, [candidateId, jobId]);

    useEffect(() => {
        if (!profile || explanation) return;
        const jm = profile.matches?.find(m => m.job_id === Number(jobId));
        if (!jm) return;
        matchesService.getMatchExplanation(jm.match_id)
            .then(text => { if (text) setExplanation(text); })
            .catch(() => {});
    }, [profile, jobId, explanation]);

    const goBack = () => navigate(`/jobs/${jobId}`, { state: { tab: "candidates" } });

    const handleDownloadResume = async () => {
        try {
            await jobsService.downloadCandidateResume(candidateId);
        } catch (err) {
            console.error("Download error:", err);
        }
    };

    const handleViewResume = async () => {
        setShowResume(true);
        if (resumeText !== null) return;
        try {
            const text = await jobsService.getCandidateResumeText(candidateId);
            setResumeText(text);
        } catch (err) {
            console.error("Resume text error:", err);
            setResumeText("");
        }
    };

    if (loading && !stateCandidate) {
        return (
            <PageCard breadcrumb="Jobs / Candidate" title="Candidate Detail">
                <PanelCard><p className="muted-message">Loading…</p></PanelCard>
            </PageCard>
        );
    }

    // Pull what we can from the loaded profile, falling back to the candidate
    // data passed via router state (from the rankings list click-through).
    const name     = profile?.name          ?? stateCandidate?.userName ?? NA;
    const email    = profile?.email         ?? null;
    const avatar   = profile?.avatar        ?? stateCandidate?.avatar  ?? null;
    const techKeys = profile?.tech_keywords ?? [];
    const rawComps = profile?.competencies  ?? [];
    const matches  = profile?.matches       ?? [];

    const jobMatch = matches.find(m => m.job_id === Number(jobId));
    const score    = jobMatch
        ? Math.round((jobMatch.job_score || 0) * 100)
        : (stateCandidate?.score ?? 0);
    const tier = jobMatch?.qualification_tier ?? null;

    // Build a name → status map from the gap profile for this job
    const gapStatus = {};
    Object.values(jobMatch?.gap_profile?.scored       ?? {}).forEach(d => {
        gapStatus[d.name] = (d.gap ?? 1) === 0 ? "met" : "gap";
    });
    Object.values(jobMatch?.gap_profile?.undetermined ?? {}).forEach(d => {
        gapStatus[d.name] = "gap";
    });

    const existingNames = new Set(rawComps.map(c => c.competency_name));

    const comps = [
        ...rawComps.map(c => ({
            key:    c.competency_name,
            label:  c.competency_name,
            value:  c.level_score != null ? Math.round(c.level_score) : 0,
            desc:   c.category ?? "",
            status: gapStatus[c.competency_name] ?? null,
        })),
        ...Object.values(jobMatch?.gap_profile?.undetermined ?? {})
            .filter(d => !existingNames.has(d.name))
            .map(d => ({
                key:    d.name,
                label:  d.name,
                value:  0,
                desc:   "",
                status: "undetermined",
            })),
        ...Object.values(jobMatch?.gap_profile?.absent ?? {})
            .filter(d => !existingNames.has(d.name))
            .map(d => ({
                key:    d.name,
                label:  d.name,
                value:  0,
                desc:   "",
                status: "absent",
            })),
    ];

    const scoredDims        = Object.values(jobMatch?.gap_profile?.scored       ?? {});
    const undeterminedCount = Object.keys(jobMatch?.gap_profile?.undetermined   ?? {}).length;
    const absentCount       = Object.keys(jobMatch?.gap_profile?.absent         ?? {}).length;
    const metCount          = scoredDims.filter(d => d.gap === 0).length;
    const totalRequired     = scoredDims.length + undeterminedCount + absentCount;

    const competencyCounts = {
        strong:  scoredDims.filter(d => (d.gap ?? 1) === 0).length,
        partial: scoredDims.filter(d => (d.gap ?? 0) >  0).length,
        weak:    undeterminedCount + absentCount,
    };

    const scoredComps = comps.filter(c => c.status === "met" || c.status === "gap");
    const strongest = scoredComps.length > 0 ? [...scoredComps].sort((a, b) => b.value - a.value)[0].label : NA;
    const weakest   = scoredComps.length > 0 ? [...scoredComps].sort((a, b) => a.value - b.value)[0].label : NA;

    return (
        <PageCard breadcrumb={`Jobs / ${jobTitle || jobId} / Candidate / ${name}`} title="Candidate Detail">
            <div className="candidate-detail-layout">

                <div className="candidate-detail-left">
                    <CandidateProfilePanel
                        name={name}
                        tier={tier}
                        score={score}
                        avatar={avatar}
                        bg={stateCandidate?.bg    ?? "#EDF2FD"}
                        color={stateCandidate?.color ?? "#1D3E9E"}
                        techKeys={techKeys}
                        metCount={metCount}
                        scoredCount={totalRequired}
                        strongest={strongest}
                        weakest={weakest}
                        email={email}
                        candidateId={candidateId}
                        onViewResume={handleViewResume}
                        onDownloadResume={handleDownloadResume}
                        onBack={goBack}
                    />
                </div>

                <div className="candidate-detail-right">
                    <ScorePanel score={score} counts={competencyCounts} />
                    {jobMatch && (
                        <PanelCard>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>Match explanation</div>
                            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                                {explanation ?? "Generating explanation…"}
                            </p>
                        </PanelCard>
                    )}
                    {comps.length > 0
                        ? <CompetencyPanel competencies={comps} />
                        : <PanelCard>
                            <p className="muted-message-sm">Competency data not available yet.</p>
                          </PanelCard>
                    }
                    {jobTech.length > 0 && (
                        <PanelCard>
                            <div className="section-label">Required tech skills</div>
                            <div className="tech-skills-grid">
                                {jobTech.map(s => {
                                    const matched = techKeys.some(t => t.toLowerCase() === s.toLowerCase());
                                    return (
                                        <span key={s} className={`tech-skill-chip${matched ? " tech-skill-chip--matched" : ""}`}>{s}</span>
                                    );
                                })}
                            </div>
                        </PanelCard>
                    )}
                </div>
            </div>

            {showResume && (
                <ResumeModal
                    resume={{ fileName: `candidate_${candidateId}_resume.pdf`, pages: 1 }}
                    candidateName={name}
                    text={resumeText}
                    onDownload={handleDownloadResume}
                    onClose={() => setShowResume(false)}
                />
            )}
        </PageCard>
    );
}

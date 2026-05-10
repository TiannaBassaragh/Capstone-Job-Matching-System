import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PageCard, PanelCard } from "../../components/cards";
import { CompetencyPanel, ScorePanel, CandidateProfilePanel } from "../../components/panels";
import { ResumeModal } from "../../components/content";
import { jobsService } from "../../lib/jobsService";
import { mapGapProfileToSkills } from "../../lib/mappers";
import "./CandidateDetailPage.css";

const NA = "N/A";

export default function CandidateDetailPage() {
    const { jobId, candidateId } = useParams();
    const navigate               = useNavigate();
    const location               = useLocation();

    const [showResume, setShowResume] = useState(false);
    const [profile,    setProfile]    = useState(null);
    const [jobTitle,   setJobTitle]   = useState("");
    const [loading,    setLoading]    = useState(true);

    const stateCandidate = location.state?.candidate;

    useEffect(() => {
        Promise.all([
            jobsService.getCandidateProfile(candidateId),
            jobsService.getJob(jobId),
        ])
            .then(([profileData, jobData]) => {
                setProfile(profileData);
                setJobTitle(jobData.title);
            })
            .catch(err => console.error("Candidate detail load error:", err))
            .finally(() => setLoading(false));
    }, [candidateId, jobId]);

    const goBack = () => navigate(`/jobs/${jobId}`, { state: { tab: "candidates" } });

    const handleDownloadResume = async () => {
        try {
            await jobsService.downloadCandidateResume(candidateId);
        } catch (err) {
            console.error("Download error:", err);
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
    const techKeys = profile?.tech_keywords ?? [];
    const rawComps = profile?.competencies  ?? [];
    const matches  = profile?.matches       ?? [];

    const jobMatch = matches.find(m => m.job_id === Number(jobId));
    const score    = jobMatch
        ? Math.round((jobMatch.match_score || 0) * 100)
        : (stateCandidate?.score ?? 0);
    const tier = jobMatch?.qualification_tier ?? null;

    const comps = rawComps.map(c => ({
        key:   c.competency_name,
        label: c.competency_name,
        value: c.level_score != null ? Math.round(c.level_score) : 0,
        desc:  c.category ?? "",
    }));

    const skills = jobMatch?.gap_profile
        ? mapGapProfileToSkills(jobMatch.gap_profile)
        : { strong: techKeys.slice(0, 4), partial: techKeys.slice(4, 7), missing: [] };

    const competencyCounts = {
        strong:  comps.filter(c => c.value >= 80).length,
        partial: comps.filter(c => c.value >= 60 && c.value < 80).length,
        weak:    comps.filter(c => c.value < 60).length,
    };

    const strongest = comps.length > 0 ? [...comps].sort((a, b) => b.value - a.value)[0].label : NA;
    const weakest   = comps.length > 0 ? [...comps].sort((a, b) => a.value - b.value)[0].label : NA;

    return (
        <PageCard breadcrumb={`Jobs / ${jobTitle || jobId} / Candidate / ${name}`} title="Candidate Detail">
            <div className="candidate-detail-layout">

                <div className="candidate-detail-left">
                    <CandidateProfilePanel
                        name={name}
                        tier={tier}
                        score={score}
                        bg={stateCandidate?.bg    ?? "#EDF2FD"}
                        color={stateCandidate?.color ?? "#1D3E9E"}
                        techKeys={techKeys}
                        skills={skills}
                        strongest={strongest}
                        weakest={weakest}
                        candidateId={candidateId}
                        onViewResume={() => setShowResume(true)}
                        onDownloadResume={handleDownloadResume}
                        onBack={goBack}
                    />
                </div>

                <div className="candidate-detail-right">
                    <ScorePanel score={score} counts={competencyCounts} />
                    {comps.length > 0
                        ? <CompetencyPanel competencies={comps} />
                        : <PanelCard>
                            <p className="muted-message-sm">Competency data not available yet.</p>
                          </PanelCard>
                    }
                </div>
            </div>

            {showResume && (
                <ResumeModal
                    resume={{ fileName: `candidate_${candidateId}_resume.pdf`, pages: 1 }}
                    candidateName={name}
                    onClose={() => setShowResume(false)}
                />
            )}
        </PageCard>
    );
}

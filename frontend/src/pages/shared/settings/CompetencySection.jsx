import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { PanelCard } from "../../../components/cards";
import { CompetencyPanel } from "../../../components/panels";
import { matchesService } from "../../../lib/matchesService";
import { jobsService } from "../../../lib/jobsService";
import "./SettingsSection.css";

export default function CompetencySection() {
    const { auth } = useAuth();
    const isCandidate = auth.userType === "applicant";

    return isCandidate ? <CandidateView /> : <RecruiterView />;
}

function CandidateView() {
    const [loading, setLoading] = useState(true);
    const [techKeywords, setTechKeywords] = useState([]);
    const [competencies, setCompetencies] = useState([]);

    useEffect(() => {
        matchesService.getMyCompetencies()
            .then(data => {
                setTechKeywords(data.techKeywords ?? []);
                setCompetencies((data.competencies ?? []).map((c, i) => ({
                    ...c,
                    key:    `${c.label}-${i}`,
                    status: null,
                })));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <PanelCard><p className="muted-message">Loading...</p></PanelCard>;
    if (competencies.length === 0 && techKeywords.length === 0) {
        return <PanelCard><p className="muted-message">No competency data yet. Upload a resume to get started.</p></PanelCard>;
    }

    return (
        <div className="settings-section-stack">
            {techKeywords.length > 0 && (
                <PanelCard>
                    <div className="section-label">Tech skills extracted from resume</div>
                    <div className="tech-skills-grid" style={{ marginTop: 10 }}>
                        {techKeywords.map(s => (
                            <span key={s} className="tech-skill-chip">{s}</span>
                        ))}
                    </div>
                </PanelCard>
            )}
            {competencies.length > 0 && <CompetencyPanel competencies={competencies} />}
        </div>
    );
}

function RecruiterView() {
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [jobData, setJobData] = useState(null);
    const [jobLoading, setJobLoading] = useState(false);

    useEffect(() => {
        jobsService.getMyJobs()
            .then(data => {
                setJobs(data);
                if (data.length > 0) setSelectedJobId(data[0].id);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedJobId) return;
        setJobLoading(true);
        jobsService.getJobCompetencies(selectedJobId)
            .then(data => setJobData(data))
            .catch(() => setJobData(null))
            .finally(() => setJobLoading(false));
    }, [selectedJobId]);

    if (loading) return <PanelCard><p className="muted-message">Loading...</p></PanelCard>;
    if (jobs.length === 0) {
        return <PanelCard><p className="muted-message">No job posts yet. Create a job to see extracted competencies.</p></PanelCard>;
    }

    const techKeywords = jobData?.techKeywords ?? [];
    const competencies = (jobData?.competencies ?? []).map((c, i) => ({
        ...c,
        key:    `${c.label}-${i}`,
        status: null,
    }));

    return (
        <div className="settings-section-stack">
            <PanelCard>
                <div className="section-label">Select a job</div>
                <select
                    className="settings-select"
                    value={selectedJobId ?? ""}
                    onChange={e => setSelectedJobId(Number(e.target.value))}
                >
                    {jobs.map(j => (
                        <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                </select>
            </PanelCard>

            {jobLoading ? (
                <PanelCard><p className="muted-message">Loading...</p></PanelCard>
            ) : (
                <>
                    {techKeywords.length > 0 && (
                        <PanelCard>
                            <div className="section-label">Tech skills extracted from job description</div>
                            <div className="tech-skills-grid" style={{ marginTop: 10 }}>
                                {techKeywords.map(s => (
                                    <span key={s} className="tech-skill-chip">{s}</span>
                                ))}
                            </div>
                        </PanelCard>
                    )}
                    {competencies.length > 0 ? (
                        <CompetencyPanel competencies={competencies} />
                    ) : (
                        <PanelCard><p className="muted-message">No competencies extracted for this job.</p></PanelCard>
                    )}
                </>
            )}
        </div>
    );
}

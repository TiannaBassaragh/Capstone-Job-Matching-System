import { useState, useEffect, useRef, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMatching } from "../../context/MatchingContext";
import { WelcomeCard, StatsCard, PageCard } from "../../components/cards";
import {
    MatchesPanel,
    JobPostsPanel,
    TopCandidatesPanel,
    UploadPanel,
    EmployerLinksPanel,
} from "../../components/panels";
import { matchesService } from "../../lib/matchesService";
import { jobsService } from "../../lib/jobsService";
import { buildCandidateStats, buildEmployerStats } from "../../lib/dashboardStats";
import "./Dashboard.css";

const DASHBOARD_PREVIEW = 10;

export default function Dashboard() {
    const { auth }  = useAuth();
    const navigate  = useNavigate();
    const fileInputRef = useRef(null);
    const { matching, startPolling } = useMatching();

    const [matches,         setMatches]         = useState([]);
    const [totalMatches,    setTotalMatches]     = useState(0);
    const [jobs,            setJobs]            = useState([]);
    const [topCandidates,   setTopCandidates]   = useState([]);
    const [totalCandidates, setTotalCandidates] = useState(0);
    const [newMatchCount,   setNewMatchCount]   = useState(0);
    const [resume,          setResume]          = useState(null);
    const [loading,         setLoading]         = useState(true);

    const loadResume = () =>
        matchesService.getMyResume()
            .then(setResume)
            .catch(() => setResume(null));

    useEffect(() => {
        if (!auth?.userType) return;

        async function load() {
            setLoading(true);
            try {
                if (auth.userType === "applicant") {
                    // Load 50 to get the real total, show first 10 in the panel
                    const [recs, res] = await Promise.all([
                        matchesService.getRecommendations(200),
                        matchesService.getMyResume(),
                    ]);
                    const sorted = [...recs].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
                    setTotalMatches(sorted.length);
                    setMatches(sorted.slice(0, DASHBOARD_PREVIEW));
                    setResume(res);
                } else {
                    const jobList = await jobsService.getMyJobs();
                    setJobs(jobList);

                    const activeJobs = jobList.filter(j => j.status === "active" || j.status === "expiring");
                    const [stats, firstRankings] = await Promise.all([
                        jobsService.getEmployerStats(),
                        activeJobs.length > 0
                            ? jobsService.getJobRankings(activeJobs[0].id, 3)
                            : Promise.resolve([]),
                    ]);
                    setTotalCandidates(stats.total_candidates ?? 0);
                    setNewMatchCount(stats.new_this_week ?? 0);
                    if (activeJobs.length > 0) {
                        setTopCandidates(firstRankings.slice(0, 3).map(c => ({
                            ...c,
                            job:   activeJobs[0].title,
                            jobId: activeJobs[0].id,
                        })));
                    }
                }
            } catch (err) {
                console.error("Dashboard load error:", err);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [auth?.userType]);

    const refreshMatches = useCallback(async () => {
        try {
            const recs = await matchesService.getRecommendations(200);
            const sorted = [...recs].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
            setTotalMatches(sorted.length);
            setMatches(sorted.slice(0, DASHBOARD_PREVIEW));
        } catch {}
    }, []);

    if (!auth?.userType) return <Navigate to="/" replace />;

    const isCandidate = auth.userType === "applicant";
    const stats = isCandidate
        ? buildCandidateStats(matches, totalMatches)
        : buildEmployerStats(jobs, totalCandidates, newMatchCount);

    const greeting = isCandidate
        ? resume
            ? `Resume active · uploaded ${resume.uploadDate}`
            : "Upload your resume to start matching"
        : `${jobs.filter(j => j.status === "active" || j.status === "expiring").length} active postings`;

    const handleUploadFile = async (file) => {
        if (!file) return;
        try {
            await matchesService.uploadResume(file);
            await loadResume();
            startPolling(refreshMatches);
        } catch (err) {
            console.error("Resume upload error:", err);
        }
    };

    const handleDeleteResume = async () => {
        if (!resume?.resumeId) return;
        try {
            await matchesService.deleteResume(resume.resumeId);
            setResume(null);
            setMatches([]);
            setTotalMatches(0);
        } catch (err) {
            console.error("Resume delete error:", err);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <PageCard breadcrumb="Dashboard" title="Dashboard">

            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); }}
            />

            <WelcomeCard
                userName={auth.userType === "recruiter" && auth.fName
                    ? `${auth.fName} ${auth.lName}`.trim()
                    : auth.userName}
                greeting={greeting}
                stats={[]}
            />

            <div className="stats-row-wrapper">
                {stats.map((stat, i) => <StatsCard key={i} {...stat} />)}
            </div>

            {matching && (
                <div className="matching-banner">
                    <div className="matching-spinner" />
                    Matching in progress — results will appear automatically.
                </div>
            )}

            <div className="dash-main">
                {isCandidate
                    ? <MatchesPanel matches={matches} loading={loading} totalCount={totalMatches} />
                    : <JobPostsPanel jobs={jobs} loading={loading} />
                }

                <div className="dash-rcol">
                    {!isCandidate && <TopCandidatesPanel topCandidates={topCandidates} />}

                    {isCandidate
                        ? <UploadPanel
                                userType={auth.userType}
                                currentFileName={resume?.fileName ?? ""}
                                currentFileDate={resume ? `Uploaded ${resume.uploadDate}` : ""}
                                onUploadClick={handleUploadClick}
                                onDeleteResume={resume ? handleDeleteResume : undefined}
                            />
                        : <EmployerLinksPanel />
                    }
                </div>
            </div>

        </PageCard>
    );
}

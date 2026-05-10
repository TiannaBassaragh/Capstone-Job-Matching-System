import { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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

    const [matches,         setMatches]         = useState([]);
    const [totalMatches,    setTotalMatches]     = useState(0);
    const [jobs,            setJobs]            = useState([]);
    const [topCandidates,   setTopCandidates]   = useState([]);
    const [totalCandidates, setTotalCandidates] = useState(0);
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
                        matchesService.getRecommendations(50),
                        matchesService.getMyResume(),
                    ]);
                    setTotalMatches(recs.length);
                    setMatches(recs.slice(0, DASHBOARD_PREVIEW));
                    setResume(res);
                } else {
                    const jobList = await jobsService.getMyJobs();
                    setJobs(jobList);

                    const activeJobs = jobList.filter(j => j.status === "active");
                    if (activeJobs.length > 0) {
                        try {
                            const allRankings = await Promise.all(
                                activeJobs.map(j => jobsService.getJobRankings(j.id, 3))
                            );
                            const firstRankings = allRankings[0] ?? [];
                            setTopCandidates(firstRankings.slice(0, 3).map(c => ({
                                ...c,
                                job:   activeJobs[0].title,
                                jobId: activeJobs[0].id,
                            })));
                            const allIds = new Set(allRankings.flat().map(c => c.id));
                            setTotalCandidates(allIds.size);
                        } catch {
                            // rankings not ready yet
                        }
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

    if (!auth?.userType) return <Navigate to="/" replace />;

    const isCandidate = auth.userType === "applicant";
    const stats = isCandidate
        ? buildCandidateStats(matches, totalMatches)
        : buildEmployerStats(jobs, totalCandidates);

    const greeting = isCandidate
        ? resume
            ? `Resume active · uploaded ${resume.uploadDate}`
            : "Upload your resume to start matching"
        : `${jobs.filter(j => j.status === "active").length} active postings`;

    const handleUploadFile = async (file) => {
        if (!file) return;
        try {
            await matchesService.uploadResume(file);
            await loadResume();
        } catch (err) {
            console.error("Resume upload error:", err);
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

            <WelcomeCard userName={auth.userName} greeting={greeting} stats={[]} />

            <div className="stats-row-wrapper">
                {stats.map((stat, i) => <StatsCard key={i} {...stat} />)}
            </div>

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
                            />
                        : <EmployerLinksPanel />
                    }
                </div>
            </div>

        </PageCard>
    );
}

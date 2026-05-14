import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from "./context/AuthContext";
import './index.css';

import { Sidebar } from './components';
import {
    Landing, Login, Register,
    Dashboard,
    Matches, MatchDetails, QuestionsPage,
    JobListings, JobDetails, NewJobPage, CandidateDetail,
    Notifications, Settings,
    GeneralSection, ProfileSection, ResumeSection, CompetencySection,
    Template, ErrorPage
} from './pages';

// ── Guards ────────────────────────────────────────────────────────────────────

function RequireAuth({ user }) {
    const { auth } = useAuth();

    if (!auth.loggedIn) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
}

function RequireRole({ allowedRoles }) {
    const { auth } = useAuth();

    if (!auth.loggedIn) {
        return <Navigate to="/" replace />;
    }

    if (!allowedRoles.includes(auth.userType)) {
        return <Navigate to="/404" replace />;
    }
    return <Outlet />;
}

// ── Layout ────────────────────────────────────────────────────────────────────

function AppLayout() {
    return (
        <div className="App">
            <Sidebar />
            <Outlet />
        </div>
    );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
    const { auth } = useAuth();

    return (
        <BrowserRouter>
            <Routes>

                {/* Public routes */}
                <Route path="/"         element={<Landing />} />
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected */}
                <Route element={<RequireAuth />}>
                    <Route element={<AppLayout />}>

                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/settings" element={<Settings />}>
                            <Route index element={<GeneralSection />} />
                            <Route path="profile" element={<ProfileSection />} />
                            <Route element={<RequireRole allowedRoles={["applicant"]} />}>
                                <Route path="resume" element={<ResumeSection />} />
                            </Route>
                            <Route path="competencies" element={<CompetencySection />} />
                        </Route>

                        <Route path="/questions" element={<QuestionsPage />} />

                        <Route element={<RequireRole allowedRoles={["applicant"]} />}>
                            <Route path="/matches">
                                <Route index element={<Matches />} />
                                <Route path=":matchId" element={<MatchDetails />} />
                            </Route>
                        </Route>

                        <Route element={<RequireRole allowedRoles={["recruiter"]} />}>
                            <Route path="/jobs">
                                <Route index element={<JobListings />} />
                                <Route path=":jobId" element={<JobDetails />} />
                                <Route path=":jobId/candidate/:candidateId" element={<CandidateDetail />} />
                            </Route>
                            <Route path="/new-job" element={<NewJobPage />} />
                        </Route>
                    
                    </Route>
                </Route>
                
                <Route element={<AppLayout />}>
                    <Route path="/404" element={<ErrorPage />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

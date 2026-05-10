import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from "./context/AuthContext";
import './index.css';

import { Sidebar } from './components';
import { 
    Landing,
    Dashboard, 
    Matches, MatchDetails, 
    JobListings, JobDetails, NewJobPage, CandidateDetail,
    Notifications, Settings,
    GeneralSection, ProfileSection, ResumeSection,
    Template, ErrorPage
} from './pages';

// ── Guards ────────────────────────────────────────────────────────────────────

function RequireAuth({ user }) {
    if (!user.loggedIn) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
}

function RequireRole({ user, role }) {
    if (user.userType !== role) {
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
    const { auth: user } = useAuth();

    return (
        <BrowserRouter>
            <Routes>

                {/* Public route */}
                <Route path="/" element={<Landing />} />

                {/* Protected */}
                <Route element={<RequireAuth user={user} />}>
                    <Route element={<AppLayout />}>

                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/settings" element={<Settings />}>
                            <Route index element={<GeneralSection />} />
                            <Route path="profile" element={<ProfileSection />} />
                            <Route element={<RequireRole user={user} role="candidate" />}>
                                <Route path="resume" element={<ResumeSection />} />
                            </Route>
                        </Route>

                        <Route element={<RequireRole user={user} role="candidate" />}>
                            <Route path="/matches">
                                <Route index element={<Matches />} />
                                <Route path=":matchId" element={<MatchDetails />} />
                            </Route>
                        </Route>

                        <Route element={<RequireRole user={user} role="employer" />}>
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
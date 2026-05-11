import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from "./context/AuthContext";
import './index.css';

import { Sidebar } from './components';
import {
    Landing,
    SignInPage, SignUpPage, LogoutPage,
    Dashboard,
    Matches, MatchDetails, QuestionsPage,
    JobListings, JobDetails, NewJobPage, CandidateDetail,
    Notifications, Settings,
    GeneralSection, ProfileSection, ResumeSection,
    Template, ErrorPage
} from './pages';

// Redirects unauthenticated users to sign-in, preserving intended destination
function RequireAuth() {
    const { auth, isLoading } = useAuth();
    const location = useLocation();
    if (isLoading) return null;
    if (!auth.loggedIn) return <Navigate to="/sign-in" state={{ from: location }} replace />;
    return <Outlet />;
}

// Guards a route to a specific user role
function RequireRole({ allowedRoles }) {
    const { auth } = useAuth();
    if (!allowedRoles.includes(auth.userType)) return <Navigate to="/404" replace />;
    return <Outlet />;
}

// Wraps the authenticated app with the sidebar
function AppLayout() {
    return (
        <div className="App">
            <Sidebar />
            <Outlet />
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/sign-in" element={<SignInPage />} />
                <Route path="/sign-up" element={<SignUpPage />} />
                <Route path="/logout" element={<LogoutPage />} />

                {/* Authenticated app */}
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
                        </Route>

                        <Route element={<RequireRole allowedRoles={["applicant"]} />}>
                            <Route path="/matches">
                                <Route index element={<Matches />} />
                                <Route path=":matchId" element={<MatchDetails />} />
                            </Route>
                            <Route path="/questions" element={<QuestionsPage />} />
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

                {/* Error / fallback */}
                <Route element={<AppLayout />}>
                    <Route path="/404" element={<ErrorPage />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                </Route>

            </Routes>
        </BrowserRouter>
    );
}

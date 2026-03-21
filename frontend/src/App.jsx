import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';      // or .scss
import { 
  // Landing, AboutPage, ContactPage, ProfileCreation,
  CandidateDashboard, EmployerDashboard, Matches, MatchDetails, Notifications, Settings, Profile 
} from './pages';
import RoleSelect from "./pages/RoleSelect";
import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <BrowserRouter>
      <div className='App'>
        <Sidebar userType="candidate" userName="Alex Johnson" userInitials="AJ" />
        {/* wire from user state */}

        <Routes>

          {/* <Route path="/" element={<Navigate to="/dashboard" replace />} /> */}
          <Route path="/" element={<RoleSelect />} />
          <Route path="/dashboard-c" element={<CandidateDashboard />} />
          <Route path="/dashboard-e" element={<EmployerDashboard />} />
          
          <Route path="/matches">
            <Route index element={<Matches />} />
            <Route path="match-details" element={<MatchDetails />} />
          </Route>
          
          <Route path="/upload-resume" element={<Navigate to ="/" />} />

          <Route path="/notifications" element={<Notifications />} />
          
          <Route path="/settings">
            <Route index element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        
        </Routes>
      </div>
    </BrowserRouter>
  );
}
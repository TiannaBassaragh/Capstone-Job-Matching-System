import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';      // or .scss
import { Dashboard, Matches, MatchDetails, Notifications, Settings, Profile } from './pages';

export default function App() {
  return (
    <BrowserRouter>
      <div className='App'>
        <Routes>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/matches">
            <Route index element={<Matches />} />
            <Route path="match-details" element={<MatchDetails />} />
          </Route>
          
          <Route path="/notifications" element={<Notifications />} />
          
          <Route path="/settings">
            <Route index element={<Settings />} />
            <Route path="edit-profile" element={<Profile />} />
          </Route>
        
        </Routes>
      </div>
    </BrowserRouter>
  );
}
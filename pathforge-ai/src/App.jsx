import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import OverviewPage from './pages/dashboard/OverviewPage'
import ResumesPage from './pages/dashboard/ResumesPage'
import FindMentorPage from './pages/dashboard/FindMentorPage'
import SettingsPage from './pages/dashboard/SettingsPage'
import MockInterviewPage from './pages/dashboard/MockInterviewPage'
import MentorDashboard from './pages/dashboard/MentorDashboard'
import ChatPage from './pages/dashboard/ChatPage'
import StudentsPage from './pages/dashboard/StudentsPage'
import SessionsPage from './pages/dashboard/SessionsPage'
import { useAuthContext } from './context/AuthContext'

function RoleBasedOverview() {
  const { user } = useAuthContext();
  if (user?.role === 'mentor') return <MentorDashboard />;
  return <OverviewPage />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="overview" />} />
          <Route path="overview" element={<RoleBasedOverview />} />
          <Route path="resumes" element={<ResumesPage />} />
          <Route path="mentors" element={<FindMentorPage />} />
          <Route path="interview" element={<MockInterviewPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
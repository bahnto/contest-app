import { Routes, Route } from 'react-router-dom'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminContest from './pages/AdminContest.jsx'
import ContestJoin from './pages/ContestJoin.jsx'
import ParticipantDash from './pages/ParticipantDash.jsx'
import SubmitEntry from './pages/SubmitEntry.jsx'
import VoteCategory from './pages/VoteCategory.jsx'
import Results from './pages/Results.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      {/* Admin routes */}
      <Route path="/" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/contest/:contestId" element={<AdminContest />} />

      {/* Participant routes — all start from the share link */}
      <Route path="/contest/:contestId" element={<ContestJoin />} />
      <Route path="/contest/:contestId/play" element={<ParticipantDash />} />
      <Route path="/contest/:contestId/submit" element={<SubmitEntry />} />
      <Route path="/contest/:contestId/vote/:categoryId" element={<VoteCategory />} />
      <Route path="/contest/:contestId/results" element={<Results />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

import { Routes, Route } from 'react-router-dom';
import Layout from '@/pages/layout/Layout';
import { Toaster } from 'react-hot-toast';
import Dashboard from '@/pages/dashboard/Dashboard';
import Projects from '@/pages/project/Projects';
import Team from '@/pages/workspace/Team';
import Chat from '@/pages/chat/Chat';
import ProjectDetails from '@/pages/project/ProjectDetails';
import TaskDetails from '@/pages/task/TaskDetails';
import AcceptWorkspaceInvite from '@/pages/workspace/AcceptWorkspaceInvite';
import AuthPage from '@/pages/auth/Auth';
import RequireAuth from '@/components/auth/RequireAuth';
import SettingsPage from '@/pages/settings/Settings';
import SmartCalendar from '@/pages/calendar/SmartCalendar';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import TermsOfService from '@/pages/legal/TermsOfService';
import Landing from '@/pages/landing/Landing';
import { Analytics } from '@vercel/analytics/react'

const App = () => {
    return (
        <>
            <Toaster />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="accept-invite" element={<RequireAuth><AcceptWorkspaceInvite /></RequireAuth>} />
                
                {/* Protected Application Routes */}
                <Route element={<RequireAuth><Layout /></RequireAuth>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projectsDetail" element={<ProjectDetails />} />
                    <Route path="/taskDetails" element={<TaskDetails />} />
                    <Route path="/calendar" element={<SmartCalendar />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>
            </Routes>
            <Analytics />
        </>
    );
};

export default App;

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
import { Analytics } from '@vercel/analytics/react'

const App = () => {
    return (
        <>
            <Toaster />
            <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="accept-invite" element={<RequireAuth><AcceptWorkspaceInvite /></RequireAuth>} />
                <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
                    <Route index element={<Dashboard />} />
                    <Route path="team" element={<Team />} />
                    <Route path="chat" element={<Chat />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="projectsDetail" element={<ProjectDetails />} />
                    <Route path="taskDetails" element={<TaskDetails />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>
            </Routes>
            <Analytics />
        </>
    );
};

export default App;

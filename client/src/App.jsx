import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import Chat from "./pages/Chat";
import ProjectDetails from "./pages/ProjectDetails";
import TaskDetails from "./pages/TaskDetails";
import AcceptWorkspaceInvite from "./pages/AcceptWorkspaceInvite";
import AuthPage from "./pages/Auth";
import RequireAuth from "./components/RequireAuth";
import SettingsPage from "./pages/Settings";
import { Analytics } from "@vercel/analytics/react"

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

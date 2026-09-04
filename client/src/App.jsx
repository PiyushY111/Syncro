import { Routes, Route } from 'react-router-dom';
import Layout from '@/pages/layout/Layout';
import { Toaster } from 'react-hot-toast';
import GlobalConfirmModal from '@/components/common/GlobalConfirmModal';
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
import Portfolios from '@/pages/portfolio/Portfolios';
import PortfolioDetails from '@/pages/portfolio/PortfolioDetails';
import Inbox from '@/pages/inbox/Inbox';
import RolePortal from '@/pages/roles/RolePortal';
import AuditLogs from '@/pages/audit/AuditLogs';
import OwnerAuditControl from '@/pages/ownerAudit/OwnerAuditControl';
import Landing from '@/pages/landing/Landing';
import WhiteboardsPage from '@/pages/whiteboard/WhiteboardsPage';
import GatekeeperAdmin from '@/pages/admin/GatekeeperAdmin';
import PendingApprovalScreen from '@/pages/auth/PendingApprovalScreen';
import RequireSuperAdmin from '@/components/auth/RequireSuperAdmin';
import { Analytics } from '@vercel/analytics/react'

const App = () => {
    return (
        <>
            <Toaster />
            <GlobalConfirmModal />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/pending-approval" element={<PendingApprovalScreen />} />
                <Route path="accept-invite" element={<RequireAuth><AcceptWorkspaceInvite /></RequireAuth>} />
                
                {/* Protected Application Routes */}
                <Route element={<RequireAuth><Layout /></RequireAuth>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/inbox" element={<Inbox />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projectsDetail" element={<ProjectDetails />} />
                    <Route path="/portfolios" element={<Portfolios />} />
                    <Route path="/portfoliosDetail" element={<PortfolioDetails />} />
                    <Route path="/roles" element={<RolePortal />} />
                    <Route path="/audit-logs" element={<AuditLogs />} />
                    <Route path="/owner-audit" element={<OwnerAuditControl />} />
                    <Route path="/admin/gatekeeper" element={<RequireSuperAdmin><GatekeeperAdmin /></RequireSuperAdmin>} />
                    <Route path="/taskDetails" element={<TaskDetails />} />
                    <Route path="/calendar" element={<SmartCalendar />} />
                    <Route path="/whiteboards" element={<WhiteboardsPage />} />
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

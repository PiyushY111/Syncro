import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/pages/layout/Layout';
import { Toaster } from 'react-hot-toast';
import RequireAuth from '@/components/auth/RequireAuth';
import RequireSuperAdmin from '@/components/auth/RequireSuperAdmin';
import { Analytics } from '@vercel/analytics/react';
import { Loader2 } from 'lucide-react';

// Route-level code splitting for lightning-fast initial page loads
const Landing = lazy(() => import('@/pages/landing/Landing'));
const AuthPage = lazy(() => import('@/pages/auth/Auth'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/legal/TermsOfService'));
const PendingApprovalScreen = lazy(() => import('@/pages/auth/PendingApprovalScreen'));
const AcceptWorkspaceInvite = lazy(() => import('@/pages/workspace/AcceptWorkspaceInvite'));

const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Inbox = lazy(() => import('@/pages/inbox/Inbox'));
const Projects = lazy(() => import('@/pages/project/Projects'));
const ProjectDetails = lazy(() => import('@/pages/project/ProjectDetails'));
const Portfolios = lazy(() => import('@/pages/portfolio/Portfolios'));
const PortfolioDetails = lazy(() => import('@/pages/portfolio/PortfolioDetails'));
const RolePortal = lazy(() => import('@/pages/roles/RolePortal'));
const AuditLogs = lazy(() => import('@/pages/audit/AuditLogs'));
const OwnerAuditControl = lazy(() => import('@/pages/ownerAudit/OwnerAuditControl'));
const GatekeeperAdmin = lazy(() => import('@/pages/admin/GatekeeperAdmin'));
const TaskDetails = lazy(() => import('@/pages/task/TaskDetails'));
const SmartCalendar = lazy(() => import('@/pages/calendar/SmartCalendar'));
const WhiteboardsPage = lazy(() => import('@/pages/whiteboard/WhiteboardsPage'));
const Team = lazy(() => import('@/pages/workspace/Team'));
const Chat = lazy(() => import('@/pages/chat/Chat'));
const SettingsPage = lazy(() => import('@/pages/settings/Settings'));

const PageFallback = () => (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-transparent">
        <Loader2 className="size-8 animate-spin text-blue-500" />
    </div>
);

const App = () => {
    return (
        <>
            <Toaster />
            <Suspense fallback={<PageFallback />}>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
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
            </Suspense>
            <Analytics />
        </>
    );
};

export default App;

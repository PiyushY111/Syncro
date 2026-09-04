import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '@/configs/api';
import AuditLogHeader from './AuditLogHeader';
import AuditLogTable from './AuditLogTable';
import AuditDiffModal from './AuditDiffModal';
import AuditMetricsWidget from './AuditMetricsWidget';

export default function AuditDashboardView() {
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace);

    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [isOwner, setIsOwner] = useState(false);
    const [userRole, setUserRole] = useState('MEMBER');
    const [search, setSearch] = useState('');
    const [entityFilter, setEntityFilter] = useState('ALL');
    const [severityFilter, setSeverityFilter] = useState('ALL');
    const [selectedLog, setSelectedLog] = useState(null);
    const [isDiffOpen, setIsDiffOpen] = useState(false);

    const fetchAuditLogs = async () => {
        if (!currentWorkspace?.id) return;
        try {
            const res = await api.get(`/api/audit/workspace/${currentWorkspace.id}`, {
                params: { entityType: entityFilter, severity: severityFilter, search }
            });
            setLogs(res.data.logs || []);
            setTotal(res.data.total || 0);
            setIsOwner(res.data.isOwner || false);
            setUserRole(res.data.userRole || 'MEMBER');
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
    }, [currentWorkspace?.id, entityFilter, severityFilter, search]);

    return (
        <div className="space-y-5 max-w-6xl mx-auto">
            <AuditLogHeader
                search={search}
                setSearch={setSearch}
                entityFilter={entityFilter}
                setEntityFilter={setEntityFilter}
                severityFilter={severityFilter}
                setSeverityFilter={setSeverityFilter}
                isOwner={isOwner}
                userRole={userRole}
                workspaceId={currentWorkspace?.id}
            />

            <AuditMetricsWidget logs={logs} total={total} />

            <AuditLogTable
                logs={logs}
                onOpenDiff={(log) => { setSelectedLog(log); setIsDiffOpen(true); }}
            />

            <AuditDiffModal
                isOpen={isDiffOpen}
                onClose={() => setIsDiffOpen(false)}
                log={selectedLog}
                canRollback={isOwner || userRole === 'ADMIN'}
                onRollbackSuccess={fetchAuditLogs}
            />
        </div>
    );
}

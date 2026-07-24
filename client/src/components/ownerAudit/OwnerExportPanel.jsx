import { FileSpreadsheet, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OwnerExportPanel({ logs = [] }) {
    const handleExportCSV = () => {
        if (logs.length === 0) {
            toast.error('No logs available to export');
            return;
        }

        const headers = ['ID', 'Timestamp', 'Actor', 'Email', 'Action', 'Severity', 'EntityType', 'EntityName'];
        const rows = logs.map(l => [
            l.id,
            new Date(l.createdAt).toISOString(),
            `"${l.user?.name || 'User'}"`,
            l.user?.email || '',
            l.action,
            l.severity,
            l.entityType,
            `"${l.entityName || ''}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `syncro_audit_compliance_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('SOC2 Compliance CSV exported');
    };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-zinc-900 border border-purple-500/20 text-white text-xs">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300">
                    <FileSpreadsheet className="size-6" />
                </div>
                <div>
                    <h4 className="font-bold text-sm">Enterprise SOC2 / ISO Audit Report Package</h4>
                    <p className="text-[11px] text-zinc-300">Generate structured compliance exports for security audits and risk reviews</p>
                </div>
            </div>

            <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 font-bold transition shadow-md cursor-pointer"
            >
                <Download className="size-4" /> Export CSV Compliance Report
            </button>
        </div>
    );
}

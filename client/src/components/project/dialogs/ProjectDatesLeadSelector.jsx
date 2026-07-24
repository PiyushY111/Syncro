export default function ProjectDatesLeadSelector({ formData, setFormData, currentWorkspace }) {
    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm mb-1">Start Date</label>
                    <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-sm text-zinc-900 dark:text-zinc-200" />
                </div>
                <div>
                    <label className="block text-sm mb-1">End Date</label>
                    <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} min={formData.start_date && new Date(formData.start_date).toISOString().split('T')[0]} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-sm text-zinc-900 dark:text-zinc-200" />
                </div>
            </div>

            <div>
                <label className="block text-sm mb-1">Project Lead</label>
                <select value={formData.team_lead} onChange={(e) => setFormData({ ...formData, team_lead: e.target.value, team_members: e.target.value ? [...new Set([...formData.team_members, e.target.value])] : formData.team_members })} className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-sm text-zinc-900 dark:text-zinc-200">
                    <option value="">No lead</option>
                    {currentWorkspace?.members?.map((member) => (
                        <option key={member.user.email} value={member.user.email}>
                            {member.user.email}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
}

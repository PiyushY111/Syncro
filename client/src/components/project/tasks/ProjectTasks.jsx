/**
 * Project Tasks view: toolbar + list or board over the same filtered set, with a bulk-action bar.
 */
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Trash2, X } from 'lucide-react';
import { deleteTask, updateTask } from '@/features/workspaceSlice';
import api from '@/configs/api';
import TaskToolbar from '@/components/project/tasks/TaskToolbar';
import TaskList from '@/components/project/tasks/TaskList';
import ProjectKanban from '@/components/project/kanban/ProjectKanban';
import { EMPTY_TASK_FILTERS, filterTasks, getAssignees, getProjectStages, hasActiveFilters } from '@/components/project/detail/taskFiltering';

const VIEW_STORAGE_KEY = 'project_tasks_view';

const readViewMode = () => {
    try {
        return localStorage.getItem(VIEW_STORAGE_KEY) === 'board' ? 'board' : 'list';
    } catch {
        return 'list';
    }
};

function BulkBar({ count, onClear, onDelete }) {
    return (
        <div className="sticky bottom-4 z-20 mx-auto flex w-fit items-center gap-2 rounded-2xl bg-ink px-2 py-2 pl-4 text-sm text-white shadow-[0_20px_40px_-16px_rgba(0,0,0,0.6)] dark:bg-white dark:text-ink" role="region" aria-label="Bulk actions">
            <span className="font-data mr-2 font-medium">{count} selected</span>
            <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600">
                <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
            <button type="button" onClick={onClear} aria-label="Clear selection" className="rounded-xl p-1.5 opacity-70 hover:bg-white/10 hover:opacity-100 dark:hover:bg-black/5">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

/** @param {{ tasks: Array<object>, project: object }} props */
export default function ProjectTasks({ tasks, project }) {
    const dispatch = useDispatch();
    const [filters, setFilters] = useState(EMPTY_TASK_FILTERS);
    const [selectedIds, setSelectedIds] = useState([]);
    const [viewMode, setViewMode] = useState(readViewMode);

    const stages = useMemo(() => getProjectStages(project), [project]);
    const assignees = useMemo(() => getAssignees(tasks), [tasks]);
    const visibleTasks = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);
    const isFiltered = hasActiveFilters(filters);

    const changeViewMode = (mode) => {
        setViewMode(mode);
        try {
            localStorage.setItem(VIEW_STORAGE_KEY, mode);
        } catch {
            // Storage unavailable: the choice still applies for this visit.
        }
    };

    const handleStatusChange = async (taskId, status) => {
        const original = tasks.find((t) => t.id === taskId);
        if (!original || original.status === status) return;
        dispatch(updateTask({ ...original, status }));
        try {
            await api.put(`/api/tasks/${taskId}`, { status });
        } catch (error) {
            dispatch(updateTask(original));
            toast.error(error?.response?.data?.message || 'Could not update the task status');
        }
    };

    const handleDelete = async () => {
        const count = selectedIds.length;
        if (!window.confirm(`Delete ${count} task${count === 1 ? '' : 's'}? This can't be undone.`)) return;
        const toastId = toast.loading('Deleting…');
        try {
            await api.post('/api/tasks/delete', { tasksIds: selectedIds });
            dispatch(deleteTask(selectedIds));
            setSelectedIds([]);
            toast.success(`Deleted ${count} task${count === 1 ? '' : 's'}`, { id: toastId });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Could not delete the tasks', { id: toastId });
        }
    };

    return (
        <div className="space-y-4">
            <TaskToolbar
                filters={filters}
                onChange={setFilters}
                stages={stages}
                assignees={assignees}
                viewMode={viewMode}
                onViewModeChange={changeViewMode}
                resultCount={visibleTasks.length}
                totalCount={tasks.length}
            />

            {viewMode === 'board' ? (
                <ProjectKanban tasks={visibleTasks} project={project} />
            ) : (
                <TaskList
                    tasks={visibleTasks}
                    stages={stages}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onStatusChange={handleStatusChange}
                    isFiltered={isFiltered}
                    onClearFilters={() => setFilters(EMPTY_TASK_FILTERS)}
                />
            )}

            {viewMode === 'list' && selectedIds.length > 0 && (
                <BulkBar count={selectedIds.length} onClear={() => setSelectedIds([])} onDelete={handleDelete} />
            )}
        </div>
    );
}

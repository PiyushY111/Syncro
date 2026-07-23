import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteTask, updateTask } from '@/features/workspaceSlice';
import api from '@/configs/api';
import { useAuth } from '@/context/AuthContext';
import TaskFilters from '@/components/project/tasks/TaskFilters';
import TaskListView from '@/components/project/tasks/TaskListView';

export default function ProjectTasks({ tasks, project }) {
    const { token } = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [selectedTasks, setSelectedTasks] = useState([]);

    const [filters, setFilters] = useState({
        status: "",
        type: "",
        priority: "",
        assignee: "",
    });

    const assigneeList = useMemo(
        () => Array.from(new Set(tasks.map((t) => t.assignee?.name).filter(Boolean))),
        [tasks]
    );

    const stages = useMemo(() => project?.stages ? project.stages.split(",") : ["TODO", "IN_PROGRESS", "DONE"], [project]);

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const { status, type, priority, assignee } = filters;
            return (
                (!status || task.status === status) &&
                (!type || task.type === type) &&
                (!priority || task.priority === priority) &&
                (!assignee || task.assignee?.name === assignee)
            );
        });
    }, [filters, tasks]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            toast.loading("Updating status...");
            await api.put(`/api/tasks/${taskId}`, { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            let updatedTask = structuredClone(tasks.find((t) => t.id === taskId));
            updatedTask.status = newStatus;
            dispatch(updateTask(updatedTask));

            toast.dismissAll();
            toast.success("Task status updated successfully");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const handleDelete = async () => {
        try {
            const confirm = window.confirm("Are you sure you want to delete the selected tasks?");
            if (!confirm) return;
            toast.loading("Deleting tasks...");

            await api.post('/api/tasks/delete', { tasksIds: selectedTasks }, { headers: { Authorization: `Bearer ${token}` } });

            dispatch(deleteTask(selectedTasks));
            setSelectedTasks([]);

            toast.dismissAll();
            toast.success("Tasks deleted successfully");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    return (
        <div>
            <TaskFilters
                filters={filters}
                setFilters={setFilters}
                handleFilterChange={handleFilterChange}
                assigneeList={assigneeList}
                project={project}
                selectedTasks={selectedTasks}
                handleDelete={handleDelete}
            />

            <TaskListView
                filteredTasks={filteredTasks}
                selectedTasks={selectedTasks}
                setSelectedTasks={setSelectedTasks}
                tasks={tasks}
                stages={stages}
                handleStatusChange={handleStatusChange}
                navigate={navigate}
            />
        </div>
    );
}

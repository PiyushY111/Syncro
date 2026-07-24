import { useState, useEffect } from 'react';
import TaskInfoCardView from './TaskInfoCardView';
import TaskInfoCardEdit from './TaskInfoCardEdit';

export default function TaskInfoCard({ task, project, onUpdate, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: "",
        description: "",
        status: "",
        type: "",
        priority: "",
        assigneeId: "",
        start_date: "",
        due_date: "",
    });

    useEffect(() => {
        if (task) {
            setEditData({
                title: task.title || "",
                description: task.description || "",
                status: task.status || "TODO",
                type: task.type || "TASK",
                priority: task.priority || "MEDIUM",
                assigneeId: task.assigneeId || "",
                start_date: task.start_date ? new Date(task.start_date).toISOString().substring(0, 10) : "",
                due_date: task.due_date ? new Date(task.due_date).toISOString().substring(0, 10) : "",
            });
        }
    }, [task, isEditing]);

    if (!task) return null;

    const teamMembers = project?.members || [];
    const stages = project?.stages ? project.stages.split(",") : ["TODO", "IN_PROGRESS", "DONE"];

    const handleSave = () => {
        if (!editData.title.trim()) {
            alert("Title is required");
            return;
        }
        if (!editData.due_date) {
            alert("Due Date is required");
            return;
        }

        const payload = {
            ...editData,
            description: editData.description.trim() || null,
            assigneeId: editData.assigneeId || null,
            start_date: editData.start_date ? new Date(editData.start_date).toISOString() : null,
            due_date: new Date(editData.due_date).toISOString(),
        };

        onUpdate(payload);
        setIsEditing(false);
    };

    const handleMarkAsDone = () => {
        onUpdate({ status: "DONE" });
    };

    return (
        <div className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 text-left transition-all shadow-sm">
            {isEditing ? (
                <TaskInfoCardEdit
                    editData={editData}
                    setEditData={setEditData}
                    teamMembers={teamMembers}
                    stages={stages}
                    onSave={handleSave}
                    onCancel={() => setIsEditing(false)}
                />
            ) : (
                <TaskInfoCardView
                    task={task}
                    onEdit={() => setIsEditing(true)}
                    onDelete={onDelete}
                    onMarkAsDone={handleMarkAsDone}
                />
            )}
        </div>
    );
}

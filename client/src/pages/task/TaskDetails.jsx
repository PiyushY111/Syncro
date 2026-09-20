import TaskDiscussion from '@/components/task/details/TaskDiscussion';
import TaskPrerequisites from '@/components/task/details/TaskPrerequisites';
import TaskRecurrenceSettings from '@/components/task/details/TaskRecurrenceSettings';
import TaskInfoCard from './TaskInfoCard';
import TaskProjectInfoCard from './TaskProjectInfoCard';
import useTaskDetails from './useTaskDetails';

export default function TaskDetails() {
    const {
        user, currentWorkspace, project, task,
        comments, newComment, setNewComment, selectedPrereqId, setSelectedPrereqId, availablePrereqs,
        handleAddComment, handleUpdateTask, handleDeleteTask, handleLinkDependency, handleUnlinkDependency,
        handleUpdateRecurrence
    } = useTaskDetails();

    if (!currentWorkspace) return <div className="text-gray-500 dark:text-zinc-400 px-4 py-6">Loading workspace...</div>;
    if (!task) return <div className="text-red-500 px-4 py-6">Task not found.</div>;

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-6 sm:p-4 text-gray-900 dark:text-zinc-100 max-w-6xl mx-auto">
            <div className="w-full lg:w-2/3">
                <TaskDiscussion comments={comments} newComment={newComment} setNewComment={setNewComment} handleAddComment={handleAddComment} user={user} />
            </div>
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                <TaskInfoCard task={task} project={project} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                <TaskPrerequisites task={task} availablePrereqs={availablePrereqs} selectedPrereqId={selectedPrereqId} setSelectedPrereqId={setSelectedPrereqId} handleLinkDependency={handleLinkDependency} handleUnlinkDependency={handleUnlinkDependency} />
                <TaskRecurrenceSettings task={task} handleUpdateRecurrence={handleUpdateRecurrence} />
                <TaskProjectInfoCard project={project} />
            </div>
        </div>
    );
}

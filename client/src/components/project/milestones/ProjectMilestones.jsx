import { useState, useEffect, useCallback } from 'react';
import api from '@/configs/api';
import toast from 'react-hot-toast';
import MilestoneHeader from './MilestoneHeader';
import MilestoneList from './MilestoneList';
import MilestoneModal from './MilestoneModal';
import MilestoneTaskPicker from './MilestoneTaskPicker';

export default function ProjectMilestones({ project, tasks }) {
    const [milestones, setMilestones] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState(null);
    const [linkingMilestone, setLinkingMilestone] = useState(null);

    const fetchMilestones = useCallback(async () => {
        try {
            const res = await api.get(`/api/milestones/project/${project.id}`);
            setMilestones(res.data.milestones || []);
        } catch (err) {
            console.error(err);
        }
    }, [project?.id]);

    useEffect(() => {
        if (project?.id) fetchMilestones();
    }, [project?.id, fetchMilestones]);

    const handleSaveMilestone = async (data) => {
        try {
            if (editingMilestone) {
                await api.patch(`/api/milestones/${editingMilestone.id}`, data);
                toast.success('Milestone updated');
            } else {
                await api.post('/api/milestones', { ...data, projectId: project.id });
                toast.success('Milestone created');
            }
            setIsModalOpen(false);
            setEditingMilestone(null);
            fetchMilestones();
        } catch {
            toast.error('Failed to save milestone');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/milestones/${id}`);
            toast.success('Milestone deleted');
            fetchMilestones();
        } catch {
            toast.error('Failed to delete milestone');
        }
    };

    const handleSaveTaskLinks = async (milestoneId, taskIds) => {
        try {
            await api.post(`/api/milestones/${milestoneId}/tasks`, { taskIds });
            toast.success('Task links updated');
            setLinkingMilestone(null);
            fetchMilestones();
        } catch {
            toast.error('Failed to link tasks');
        }
    };

    const filtered = milestones.filter((m) => {
        const matchesFilter = filter === 'ALL' || m.status === filter;
        const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-4">
            <MilestoneHeader
                filter={filter}
                setFilter={setFilter}
                search={search}
                setSearch={setSearch}
                onOpenCreate={() => { setEditingMilestone(null); setIsModalOpen(true); }}
            />
            <MilestoneList
                milestones={filtered}
                onEdit={(m) => { setEditingMilestone(m); setIsModalOpen(true); }}
                onDelete={handleDelete}
                onLinkTasks={(m) => setLinkingMilestone(m)}
            />
            <MilestoneModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingMilestone(null); }}
                onSave={handleSaveMilestone}
                editingMilestone={editingMilestone}
            />
            <MilestoneTaskPicker
                isOpen={!!linkingMilestone}
                onClose={() => setLinkingMilestone(null)}
                milestone={linkingMilestone}
                projectTasks={tasks}
                onSaveLinks={handleSaveTaskLinks}
            />
        </div>
    );
}

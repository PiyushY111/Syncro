import { useMemo, useCallback } from 'react';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { getTaskBarGeometry, calculateCriticalPath } from './ganttUtils';

export function useGanttData(tasks, zoom, searchQuery, statusFilter, milestonesOnly, highlightCriticalPath, showDependencies, customStartDate, customEndDate, currentMonth) {
    const { startDateBound, timelineDays, columnWidth } = useMemo(() => {
        let colW = zoom === 'week' ? 32 : zoom === 'month' ? 20 : 48;
        const baseMonth = currentMonth || new Date();

        let start = customStartDate ? startOfMonth(new Date(customStartDate)) : startOfMonth(subMonths(baseMonth, 2));
        let end = customEndDate ? endOfMonth(new Date(customEndDate)) : endOfMonth(addMonths(baseMonth, 6));

        return { startDateBound: start, timelineDays: eachDayOfInterval({ start, end }), columnWidth: colW };
    }, [tasks, zoom, customStartDate, customEndDate, currentMonth]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
            const matchesMilestone = !milestonesOnly || task.type === 'OTHER' || (task.title && task.title.toLowerCase().includes('milestone'));
            return matchesSearch && matchesStatus && matchesMilestone;
        });
    }, [tasks, searchQuery, statusFilter, milestonesOnly]);

    const criticalPathTaskIds = useMemo(() => calculateCriticalPath(tasks, highlightCriticalPath), [tasks, highlightCriticalPath]);
    const calcGeometry = useCallback((task) => getTaskBarGeometry(task, startDateBound, columnWidth), [startDateBound, columnWidth]);

    const dependencyLines = useMemo(() => {
        if (!showDependencies) return [];
        const lines = [];
        const ROW_HEIGHT = 44;

        filteredTasks.forEach((task, targetIndex) => {
            if (!task.dependencies || task.dependencies.length === 0) return;
            const targetGeo = calcGeometry(task);
            const targetY = targetIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
            const targetX = targetGeo.left;

            task.dependencies.forEach(dep => {
                const sourceIndex = filteredTasks.findIndex(t => t.id === dep.id);
                if (sourceIndex === -1) return;
                const sourceTask = filteredTasks[sourceIndex];
                const sourceGeo = calcGeometry(sourceTask);
                const sourceY = sourceIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                const sourceX = sourceGeo.left + sourceGeo.width;

                const isConflict = sourceX > targetX;
                const isCritical = criticalPathTaskIds.has(task.id) && criticalPathTaskIds.has(dep.id);

                let d = Math.abs(sourceY - targetY) < 5
                    ? `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
                    : targetX > sourceX + 20
                        ? `M ${sourceX} ${sourceY} C ${sourceX + (targetX - sourceX) / 2} ${sourceY}, ${sourceX + (targetX - sourceX) / 2} ${targetY}, ${targetX} ${targetY}`
                        : `M ${sourceX} ${sourceY} L ${sourceX + 24} ${sourceY} L ${sourceX + 24} ${targetY} L ${targetX} ${targetY}`;

                lines.push({ id: `${dep.id}->${task.id}`, d, isConflict, isCritical });
            });
        });
        return lines;
    }, [filteredTasks, showDependencies, criticalPathTaskIds, calcGeometry]);

    return { startDateBound, timelineDays, columnWidth, filteredTasks, criticalPathTaskIds, calcGeometry, dependencyLines };
}

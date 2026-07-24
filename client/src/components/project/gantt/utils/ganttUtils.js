import { differenceInDays, startOfDay, endOfDay } from 'date-fns';

export const getTaskBarGeometry = (task, startDateBound, columnWidth) => {
    const tStart = startOfDay(task.start_date ? new Date(task.start_date) : new Date(task.createdAt));
    const tDue = endOfDay(new Date(task.due_date));

    const startOffsetDays = differenceInDays(tStart, startDateBound);
    const durationDays = Math.max(1, differenceInDays(tDue, tStart) + 1);

    const left = Math.max(0, startOffsetDays * columnWidth);
    const width = durationDays * columnWidth;
    const isMilestone = task.type === 'OTHER' || (durationDays <= 1 && task.title.toLowerCase().includes('milestone'));

    return { left, width, isMilestone, startOffsetDays, durationDays };
};

export const calculateCriticalPath = (tasks, highlightCriticalPath) => {
    if (!highlightCriticalPath || !tasks || tasks.length === 0) return new Set();

    const taskMap = new Map();
    tasks.forEach(t => {
        const s = t.start_date ? new Date(t.start_date) : new Date(t.createdAt);
        const d = new Date(t.due_date);
        const dur = Math.max(1, differenceInDays(d, s) + 1);
        taskMap.set(t.id, {
            id: t.id,
            duration: dur,
            dependencies: (t.dependencies || []).map(dep => dep.id),
            successors: [],
            es: 0, ef: 0, ls: Infinity, lf: Infinity, slack: 0
        });
    });

    taskMap.forEach(task => {
        task.dependencies.forEach(depId => {
            if (taskMap.has(depId)) taskMap.get(depId).successors.push(task.id);
        });
    });

    const visited = new Set();
    const calculateForward = (id) => {
        const task = taskMap.get(id);
        if (!task) return;
        let maxPredEf = 0;
        task.dependencies.forEach(depId => {
            if (!visited.has(depId)) calculateForward(depId);
            const dep = taskMap.get(depId);
            if (dep) maxPredEf = Math.max(maxPredEf, dep.ef);
        });
        task.es = maxPredEf;
        task.ef = task.es + task.duration;
        visited.add(id);
    };

    taskMap.forEach(t => calculateForward(t.id));

    let maxProjectDuration = 0;
    taskMap.forEach(t => { if (t.ef > maxProjectDuration) maxProjectDuration = t.ef; });

    taskMap.forEach(t => {
        if (t.successors.length === 0) {
            t.lf = maxProjectDuration;
            t.ls = t.lf - t.duration;
        }
    });

    const calculateBackward = (id) => {
        const task = taskMap.get(id);
        if (!task) return;
        if (task.successors.length > 0) {
            let minSuccLs = Infinity;
            task.successors.forEach(succId => {
                const succ = taskMap.get(succId);
                if (succ) minSuccLs = Math.min(minSuccLs, succ.ls);
            });
            task.lf = minSuccLs;
            task.ls = task.lf - task.duration;
        }
        task.slack = task.ls - task.es;
        task.dependencies.forEach(depId => calculateBackward(depId));
    };

    taskMap.forEach(t => calculateBackward(t.id));

    const criticalSet = new Set();
    taskMap.forEach(t => { if (t.slack <= 0.001) criticalSet.add(t.id); });
    return criticalSet;
};

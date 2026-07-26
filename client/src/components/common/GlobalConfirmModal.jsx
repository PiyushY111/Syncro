import React, { useState, useEffect } from 'react';
import { Trash2, Edit3, PlusCircle, X } from 'lucide-react';

export default function GlobalConfirmModal() {
    const [state, setState] = useState({ isOpen: false, action: '', entity: '' });

    useEffect(() => {
        window.__triggerConfirmModal = (action, entity) => {
            setState({ isOpen: true, action, entity });
        };
        return () => {
            window.__triggerConfirmModal = null;
        };
    }, []);

    if (!state.isOpen) return null;

    const handleConfirm = () => {
        setState({ isOpen: false, action: '', entity: '' });
        if (window.__confirmResolver) window.__confirmResolver(true);
    };

    const handleCancel = () => {
        setState({ isOpen: false, action: '', entity: '' });
        window.__lastActionCancelled = true;
        setTimeout(() => { window.__lastActionCancelled = false; }, 150);
        if (window.__confirmResolver) window.__confirmResolver(false);
    };

    const getIcon = () => {
        if (state.action === 'delete') return <Trash2 className="size-6 text-rose-500" />;
        if (state.action === 'edit') return <Edit3 className="size-6 text-amber-500" />;
        return <PlusCircle className="size-6 text-emerald-500 animate-pulse" />;
    };

    const getColorTheme = () => {
        if (state.action === 'delete') return {
            border: 'border-rose-200 dark:border-rose-950',
            bg: 'bg-rose-50/50 dark:bg-rose-950/20',
            btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 hover:shadow-rose-600/40 text-white',
        };
        if (state.action === 'edit') return {
            border: 'border-amber-200 dark:border-amber-950',
            bg: 'bg-amber-50/50 dark:bg-amber-950/20',
            btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 hover:shadow-amber-600/40 text-white',
        };
        return {
            border: 'border-emerald-200 dark:border-emerald-950',
            bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
            btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 hover:shadow-emerald-600/40 text-white',
        };
    };

    const theme = getColorTheme();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 dark:bg-black/80 backdrop-blur-xs transition-all duration-300">
            <div className={`relative w-full max-w-sm p-6 mx-4 bg-white dark:bg-zinc-900 border ${theme.border} rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200`}>
                <button 
                    onClick={handleCancel}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition cursor-pointer"
                >
                    <X className="size-5" />
                </button>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${theme.bg}`}>
                        {getIcon()}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 capitalize">
                            Confirm {state.action}
                        </h3>
                        <p className="mt-2 text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed">
                            Are you sure you want to {state.action} this {state.entity}? This action will proceed immediately.
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-55 dark:hover:bg-zinc-850 transition cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-5 py-2 text-sm font-medium rounded-xl transition shadow-lg cursor-pointer ${theme.btn}`}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

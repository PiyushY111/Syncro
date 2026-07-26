import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function WhiteboardPageControls({ pages = [], currentPageId, onSwitchPage, onCreatePage, onDeletePage }) {
    const currentIndex = pages.findIndex(p => p.id === currentPageId);
    const activePage = pages[currentIndex] || pages[0] || {};

    const handlePrev = () => {
        if (currentIndex > 0) onSwitchPage(pages[currentIndex - 1].id);
    };

    const handleNext = () => {
        if (currentIndex < pages.length - 1) onSwitchPage(pages[currentIndex + 1].id);
    };

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg text-zinc-900 dark:text-zinc-200 text-xs">
            <div className="flex items-center gap-1.5 border-r border-zinc-200 dark:border-zinc-800 pr-3">
                <button onClick={handlePrev} disabled={currentIndex <= 0} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer">
                    <ChevronLeft className="size-4" />
                </button>
                <span className="font-semibold select-none">
                    {currentIndex + 1} / {pages.length}
                </span>
                <button onClick={handleNext} disabled={currentIndex >= pages.length - 1} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer">
                    <ChevronRight className="size-4" />
                </button>
            </div>

            <select value={currentPageId} onChange={(e) => onSwitchPage(e.target.value)} className="bg-transparent border-0 font-medium py-1 focus:ring-0 focus:outline-none cursor-pointer pr-5">
                {pages.map((p, idx) => (
                    <option key={p.id} value={p.id} className="dark:bg-zinc-900">
                        {p.name || `Page ${idx + 1}`}
                    </option>
                ))}
            </select>

            <button onClick={onCreatePage} className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center cursor-pointer shadow-sm shadow-blue-500/10">
                <Plus className="size-3.5" />
            </button>

            {pages.length > 1 && (
                <button onClick={() => { if (confirm(`Delete page "${activePage.name}"?`)) onDeletePage(currentPageId); }} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-900/40 rounded-lg cursor-pointer">
                    <Trash2 className="size-3.5" />
                </button>
            )}
        </div>
    );
}

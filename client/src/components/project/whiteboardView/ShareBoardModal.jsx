import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, Mail, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export function ShareBoardModal({ isOpen, onClose, boardId }) {
    const { user } = useAuth();
    const currentWorkspace = useSelector(state => state.workspace?.currentWorkspace);
    
    const [copied, setCopied] = useState(false);
    const [emails, setEmails] = useState([]);
    const [creatorId, setCreatorId] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [input, setInput] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && boardId) {
            setInput('');
            api.get(`/api/whiteboards/${boardId}`)
                .then(({ data }) => {
                    setCreatorId(data.creatorId || '');
                    setIsPrivate(data.isPrivate || false);
                    setEmails(typeof data.sharedEmails === 'string' ? JSON.parse(data.sharedEmails) : (data.sharedEmails || []));
                })
                .catch(err => console.error("Failed to load whiteboard details", err));
        }
    }, [isOpen, boardId]);

    if (!isOpen) return null;

    const shareLink = `${window.location.origin}/whiteboards?id=${boardId}`;
    const isOwner = !creatorId || creatorId === user?.id;
    const members = currentWorkspace?.members || [];
    const suggestions = input.trim() 
        ? members.filter(m => m.user?.email?.toLowerCase().includes(input.toLowerCase()) && !emails.includes(m.user.email))
        : [];

    const handleCopy = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddEmail = (email) => {
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return toast.error("Invalid email address");
        if (emails.includes(email)) return toast.error("Already shared with this email");
        setEmails([...emails, email]);
        setInput('');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post(`/api/whiteboards/${boardId}/share`, { emails });
            toast.success("Sharing preferences updated!");
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update sharing");
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 text-left">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-md text-zinc-900 dark:text-zinc-200 relative shadow-2xl animate-in fade-in duration-150">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-250 cursor-pointer"><X className="size-5" /></button>
                <h3 className="text-lg font-bold mb-1">Share Whiteboard</h3>
                <p className="text-xs text-zinc-500 mb-4">{isPrivate ? "Private: Only explicitly shared users can view." : "Public: Anyone in organization can view."}</p>

                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input type="text" readOnly value={shareLink} className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none" />
                        <button onClick={handleCopy} className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap">{copied ? 'Copied!' : 'Copy Link'}</button>
                    </div>

                    {isPrivate && (
                        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-850">
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Share via Email</label>
                            {isOwner ? (
                                <div className="relative">
                                    <div className="flex gap-2">
                                        <input type="email" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type colleague's email..." className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" onKeyDown={(e) => { if (e.key === 'Enter') handleAddEmail(input.trim()); }} />
                                        <button onClick={() => handleAddEmail(input.trim())} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer">Invite</button>
                                    </div>
                                    {suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg shadow-lg max-h-32 overflow-y-auto z-50">
                                            {suggestions.map(s => (
                                                <button key={s.id} onClick={() => handleAddEmail(s.user.email)} className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs flex flex-col cursor-pointer border-b border-zinc-100 dark:border-zinc-850/50">
                                                    <span className="font-semibold">{s.user.name}</span>
                                                    <span className="text-[10px] text-zinc-400">{s.user.email}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-red-500 font-medium">Only the whiteboard creator can invite others.</p>
                            )}

                            <div className="space-y-1.5 max-h-28 overflow-y-auto pt-1">
                                {emails.map(email => (
                                    <div key={email} className="flex justify-between items-center px-3 py-1.5 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-lg border border-zinc-100 dark:border-zinc-850 text-xs">
                                        <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-350"><Mail className="size-3.5" />{email}</span>
                                        {isOwner && (
                                            <button onClick={() => setEmails(emails.filter(e => e !== email))} className="text-zinc-400 hover:text-red-500 cursor-pointer"><Trash2 className="size-3.5" /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isPrivate && isOwner && (
                        <button onClick={handleSave} disabled={saving} className="w-full py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-50">
                            {saving ? 'Saving...' : 'Save Permissions'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

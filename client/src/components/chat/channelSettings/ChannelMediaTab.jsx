import { Image, FileText, Link } from 'lucide-react';

export default function ChannelMediaTab({ messages = [] }) {
    const attachments = messages.flatMap(m => m.attachments || []);

    return (
        <div className="space-y-4 text-xs">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-[11px]">Media, Links & Docs ({attachments.length})</h4>

            {attachments.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 space-y-2">
                    <Image className="size-10 mx-auto opacity-40" />
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">No media or files shared</p>
                    <p className="text-[11px]">Photos, videos, and documents shared in this channel will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                    {attachments.map((att, idx) => (
                        <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-800 border flex flex-col items-center justify-center p-2 text-center hover:border-indigo-500 transition">
                            <FileText className="size-6 text-indigo-500 mb-1" />
                            <span className="text-[10px] text-zinc-700 dark:text-zinc-300 font-medium truncate w-full">{att.name || 'File'}</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

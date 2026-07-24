import { MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function TaskDiscussion({
    comments,
    newComment,
    setNewComment,
    handleAddComment,
    user
}) {
    return (
        <div className="p-5 rounded-md border border-gray-300 dark:border-zinc-800 flex flex-col lg:h-[80vh] text-left">
            <h2 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                <MessageCircle className="size-5" /> Task Discussion ({comments.length})
            </h2>

            <div className="flex-1 md:overflow-y-scroll no-scrollbar">
                {comments.length > 0 ? (
                    <div className="flex flex-col gap-4 mb-6 mr-2">
                        {comments.map((comment) => {
                            const commentUser = comment?.user || {};
                            const isOwnComment = commentUser?.id === user?.id;

                            return (
                                <div key={comment.id} className={`sm:max-w-4/5 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900 border border-gray-300 dark:border-zinc-700 p-3 rounded-md ${isOwnComment ? "ml-auto" : "mr-auto"}`} >
                                    <div className="flex items-center gap-2 mb-1 text-sm text-gray-500 dark:text-zinc-400">
                                        <img src={commentUser.image || ""} alt="avatar" className="size-5 rounded-full" />
                                        <span className="font-medium text-gray-900 dark:text-white">{commentUser.name || "Unknown user"}</span>
                                        <span className="text-xs text-gray-400 dark:text-zinc-600">
                                            • {format(new Date(comment.createdAt), "dd MMM yyyy, HH:mm")}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-900 dark:text-zinc-200">{comment.content}</p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-gray-600 dark:text-zinc-500 mb-4 text-sm">No comments yet. Be the first!</p>
                )}
            </div>

            {/* Add Comment */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mt-4">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md p-2 text-sm text-gray-900 dark:text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600"
                    rows={3}
                />
                <button onClick={handleAddComment} className="bg-gradient-to-l from-blue-500 to-blue-600 transition-colors text-white text-sm px-5 py-2 rounded cursor-pointer font-medium" >
                    Post
                </button>
            </div>
        </div>
    );
}

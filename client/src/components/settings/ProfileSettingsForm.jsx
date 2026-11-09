import { Globe } from 'lucide-react';

export default function ProfileSettingsForm({
    profileName,
    setProfileName,
    profileImage,
    setProfileImage,
    isUpdatingProfile,
    handleUpdateProfile,
    user
}) {
    return (
        <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <Globe size={18} className="text-brand dark:text-violet-300" />
                    Profile Details
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Update your public profile details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Name</label>
                    <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-gray-900 dark:text-white focus:border-brand outline-none"
                        placeholder="Your full name"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Email Address</label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-slate-900/[0.07] dark:border-white/[0.07] bg-slate-500/[0.05] dark:bg-white/[0.03] text-gray-400 dark:text-zinc-500 cursor-not-allowed outline-none"
                    />
                </div>
                <div className="col-span-full space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Avatar Image URL</label>
                    <input
                        type="text"
                        value={profileImage}
                        onChange={(e) => setProfileImage(e.target.value)}
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] text-gray-900 dark:text-white focus:border-brand outline-none"
                        placeholder="https://example.com/image.png"
                    />
                    {profileImage && (
                        <div className="mt-2 flex items-center gap-3">
                            <img src={profileImage} alt="Avatar Preview" className="w-12 h-12 rounded-full object-cover border border-slate-900/[0.07] dark:border-white/10" onError={(e) => e.target.style.display = 'none'} />
                            <span className="text-xs text-gray-400">Preview image</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="px-5 py-2 text-sm font-semibold rounded bg-gradient-to-br from-[#7c5cff] to-brand text-white hover:opacity-95 disabled:opacity-50 transition"
                >
                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}

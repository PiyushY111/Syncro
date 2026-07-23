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
                    <Globe size={18} className="text-blue-500" />
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
                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                        placeholder="Your full name"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Email Address</label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 cursor-not-allowed outline-none"
                    />
                </div>
                <div className="col-span-full space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Avatar Image URL</label>
                    <input
                        type="text"
                        value={profileImage}
                        onChange={(e) => setProfileImage(e.target.value)}
                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                        placeholder="https://example.com/image.png"
                    />
                    {profileImage && (
                        <div className="mt-2 flex items-center gap-3">
                            <img src={profileImage} alt="Avatar Preview" className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-zinc-700" onError={(e) => e.target.style.display = 'none'} />
                            <span className="text-xs text-gray-400">Preview image</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="px-5 py-2 text-sm font-semibold rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-95 disabled:opacity-50 transition"
                >
                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}

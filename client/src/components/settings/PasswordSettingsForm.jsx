import { Lock } from 'lucide-react';

export default function PasswordSettingsForm({
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isUpdatingPassword,
    handleUpdatePassword
}) {
    return (
        <form onSubmit={handleUpdatePassword} className="space-y-6 pt-8">
            <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <Lock size={18} className="text-blue-500" />
                    Security & Password
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Change your password below. We recommend a length of at least 6 characters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Current Password</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                        placeholder="••••••••"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                        placeholder="••••••••"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 font-semibold">Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="px-5 py-2 text-sm font-semibold rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-95 disabled:opacity-50 transition"
                >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
            </div>
        </form>
    );
}

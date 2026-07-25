import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function MfaVerifyForm({
    verificationEmail,
    verificationCode,
    setVerificationCode,
    handleVerifyCode,
    isSubmitting,
    handleResendCode,
    setVerificationEmail
}) {
    return (
        <div>
            <div className="mb-6 flex items-center justify-between gap-3 text-left">
                <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Verification Required</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">Enter Security Code</h2>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-blue-600">
                    <ShieldCheck className="size-5" />
                </div>
            </div>
            {verificationEmail === 'google-tester@piyushydv.com' ? (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-xs leading-relaxed text-amber-800">
                    <span className="font-semibold block text-sm mb-1">ℹ️ Google Reviewer Account</span>
                    This is a pre-configured test environment. To complete authorization, please use the static security code: <strong className="font-extrabold text-sm text-amber-950 bg-amber-200/70 px-2 py-0.5 rounded font-mono ml-0.5">123456</strong>.
                </div>
            ) : (
                <p className="text-sm text-slate-600 mb-6 leading-relaxed text-left">
                    We sent a 6-digit login verification code to <span className="font-semibold text-slate-950">{verificationEmail}</span>. Enter the code below to complete your login:
                </p>
            )}
            <form onSubmit={handleVerifyCode} className="space-y-6 text-left">
                <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">6-Digit Code</label>
                    <input 
                        value={verificationCode} 
                        onChange={(event) => {
                            const val = event.target.value.replace(/\D/g, '').slice(0, 6);
                            setVerificationCode(val);
                        }} 
                        className="w-full text-center text-2xl font-bold tracking-widest rounded-2xl border border-slate-200 bg-slate-50 py-4 outline-none transition focus:border-blue-500 focus:bg-white text-slate-900" 
                        placeholder="••••••" 
                        required 
                    />
                </div>
                <button type="submit" disabled={isSubmitting || verificationCode.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer">
                    {isSubmitting ? 'Verifying...' : 'Verify & Sign In'}
                    <ArrowRight className="size-4" />
                </button>
                <div className="flex items-center justify-between text-sm mt-4">
                    <button type="button" onClick={handleResendCode} className="text-blue-600 hover:underline font-semibold cursor-pointer">
                        Resend Code
                    </button>
                    <button type="button" onClick={() => setVerificationEmail('')} className="text-slate-500 hover:underline cursor-pointer">
                        Back to Sign In
                    </button>
                </div>
            </form>
        </div>
    );
}

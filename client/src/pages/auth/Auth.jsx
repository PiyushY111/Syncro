import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import api from '@/configs/api';
import LoginForm from '@/components/auth/LoginForm';
import MfaVerifyForm from '@/components/auth/MfaVerifyForm';

const features = [
    'Protected workspaces with invite-based collaboration',
    'Projects, tasks, analytics, and activity in one place',
    'A clean responsive UI built for teams that move fast',
];

export default function AuthPage() {
    const { user, login, verifyLoginCode, register, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const nextPath = new URLSearchParams(location.search).get('next') || '/';
    const [mode, setMode] = useState('login');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    // Two-factor states
    const [verificationEmail, setVerificationEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    useEffect(() => {
        if (!loading && user) {
            navigate(nextPath, { replace: true });
        }
    }, [loading, user, navigate, nextPath]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            if (mode === 'login') {
                const response = await login({ email: formData.email, password: formData.password });
                if (response.requiresVerification) {
                    setVerificationEmail(formData.email);
                    setVerificationCode('');
                    toast.success('Verification code sent to your email!');
                } else {
                    toast.success('Welcome back');
                    navigate(nextPath, { replace: true });
                }
            } else {
                const response = await register({ name: formData.name, email: formData.email, password: formData.password });
                if (response.requiresVerification) {
                    setVerificationEmail(formData.email);
                    setVerificationCode('');
                    toast.success('Verification code sent to your email!');
                } else {
                    toast.success('Account created');
                    navigate(nextPath, { replace: true });
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyCode = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            await verifyLoginCode(verificationEmail, verificationCode.trim());
            toast.success('Logged in successfully!');
            navigate(nextPath, { replace: true });
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendCode = async () => {
        try {
            toast.loading("Resending code...");
            await api.post('/api/auth/resend-code', { email: verificationEmail });
            toast.dismissAll();
            toast.success("Verification code resent successfully!");
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || error.message);
        }
    };

    return (
        <div className="min-h-screen overflow-hidden bg-[#07111f] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.25),_transparent_30%)]" />
            <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.15fr_0.85fr]">
                <section className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-16 xl:px-24">
                    <div className="max-w-xl text-left">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-100 backdrop-blur">
                            <Sparkles className="size-4 text-cyan-300" />
                            Project workspace management
                        </div>
                        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl xl:text-6xl">
                            Manage work that feels organized, even when the team is not.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                            Sign in or create an account with email and password. Then create workspaces, invite teammates, and track projects without a third-party auth wall.
                        </p>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                                <ShieldCheck className="size-5 text-cyan-300" />
                                <p className="mt-3 text-sm font-medium text-white">Secure access</p>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                                <Users className="size-5 text-cyan-300" />
                                <p className="mt-3 text-sm font-medium text-white">Team collaboration</p>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                                <ArrowRight className="size-5 text-cyan-300" />
                                <p className="mt-3 text-sm font-medium text-white">Fast onboarding</p>
                            </div>
                        </div>

                        <ul className="mt-8 space-y-3 text-sm text-slate-300">
                            {features.map((feature) => (
                                <li key={feature} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
                    <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/95 p-6 text-slate-900 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur xl:p-8">
                        {verificationEmail ? (
                            <MfaVerifyForm
                                verificationEmail={verificationEmail}
                                verificationCode={verificationCode}
                                setVerificationCode={setVerificationCode}
                                handleVerifyCode={handleVerifyCode}
                                isSubmitting={isSubmitting}
                                handleResendCode={handleResendCode}
                                setVerificationEmail={setVerificationEmail}
                            />
                        ) : (
                            <LoginForm
                                mode={mode}
                                setMode={setMode}
                                formData={formData}
                                setFormData={setFormData}
                                handleSubmit={handleSubmit}
                                isSubmitting={isSubmitting}
                            />
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
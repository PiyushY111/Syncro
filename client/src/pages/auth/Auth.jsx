import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import api from '@/configs/api';
import LoginForm from '@/components/auth/LoginForm';
import MfaVerifyForm from '@/components/auth/MfaVerifyForm';
import AuthFeaturesSection from './AuthFeaturesSection';
import { CheckCircle2, LoaderCircle } from 'lucide-react';

export default function AuthPage() {
    const { user, login, verifyLoginCode, register, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const nextPath = new URLSearchParams(location.search).get('next') || '/dashboard';
    const [mode, setMode] = useState('login');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const [verificationEmail, setVerificationEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [redirectMessage, setRedirectMessage] = useState('');

    useEffect(() => {
        if (!loading && user && !redirectMessage) {
            navigate(nextPath, { replace: true });
        }
    }, [loading, user, navigate, nextPath, redirectMessage]);

    useEffect(() => {
        if (!redirectMessage) return undefined;

        const timer = window.setTimeout(() => navigate(nextPath, { replace: true }), 1400);
        return () => window.clearTimeout(timer);
    }, [redirectMessage, navigate, nextPath]);

    const showRedirectPopup = (message) => {
        setRedirectMessage(message);
    };

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
                    showRedirectPopup('Welcome back! Your workspace is ready.');
                }
            } else {
                const response = await register({ name: formData.name, email: formData.email, password: formData.password });
                if (response.requiresVerification) {
                    setVerificationEmail(formData.email);
                    setVerificationCode('');
                    toast.success('Verification code sent to your email!');
                } else {
                    showRedirectPopup('Your account is ready. Let’s get started!');
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
            showRedirectPopup('You’re verified! Taking you to your workspace.');
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
                <AuthFeaturesSection />
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
            {redirectMessage && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm" role="status" aria-live="polite">
                    <div className="w-full max-w-sm rounded-[2rem] border border-white/60 bg-white p-8 text-center text-slate-900 shadow-[0_30px_100px_rgba(0,0,0,0.32)]">
                        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-500">
                            <CheckCircle2 className="size-9" strokeWidth={2.4} />
                        </div>
                        <h2 className="mt-5 text-2xl font-semibold tracking-tight">Success!</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{redirectMessage}</p>
                        <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-blue-600">
                            <LoaderCircle className="size-4 animate-spin" /> Redirecting…
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

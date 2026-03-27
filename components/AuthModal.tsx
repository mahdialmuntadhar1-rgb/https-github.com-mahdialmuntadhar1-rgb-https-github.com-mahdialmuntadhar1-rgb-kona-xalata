import React, { useState } from 'react';
import { X } from './icons';
import { useTranslations } from '../hooks/useTranslations';
import { supabase } from '../src/lib/supabase';

interface AuthModalProps {
    onClose: () => void;
    onLogin: (role: 'user' | 'owner') => void;
}

const getFriendlyAuthError = (error: unknown): string => {
    if (!error) return 'Something went wrong. Please try again.';

    if (typeof error === 'string') return error;

    if (typeof error === 'object' && error !== null) {
        const maybeMessage = (error as { message?: string }).message;
        if (maybeMessage) return maybeMessage;
    }

    return 'Authentication failed. Please try again.';
};

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [role, setRole] = useState<'user' | 'owner'>('user');
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authMessage, setAuthMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
    const { t } = useTranslations();
    
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setAuthMessage(null);

        try {
            sessionStorage.setItem('pending_role', role);

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin },
            });

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            setAuthMessage({ type: 'error', text: getFriendlyAuthError(error) });
            sessionStorage.removeItem('pending_role');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async () => {
        if (!email || !password) return;

        setIsLoading(true);
        setAuthMessage(null);

        try {
            sessionStorage.setItem('pending_role', role);

            if (activeTab === 'signin') {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                if (data?.access_token) {
                    onLogin(role);
                    return;
                }

                throw new Error('Sign in did not return a valid session. Please try again.');
            }

            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;

            if (data?.access_token) {
                onLogin(role);
                return;
            }

            sessionStorage.removeItem('pending_role');
            setAuthMessage({
                type: 'info',
                text: 'Account created. Please check your email to confirm your account before signing in.',
            });
        } catch (error) {
            console.error('Email Auth Error:', error);
            setAuthMessage({ type: 'error', text: getFriendlyAuthError(error) });
            sessionStorage.removeItem('pending_role');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-md backdrop-blur-2xl bg-dark-bg/90 border border-white/20 rounded-3xl p-8 shadow-glow-primary text-start rtl:text-right">
                <button onClick={onClose} className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <X className="w-5 h-5 text-white" />
                </button>
                
                <h2 className="text-2xl font-bold text-white mb-2">
                    {activeTab === 'signin' ? t('auth.signIn') : t('auth.signUp')}
                </h2>
                <p className="text-white/60 text-sm mb-8">
                    {activeTab === 'signin' ? 'Welcome back to Iraq Compass' : 'Join the Social Business Ecosystem'}
                </p>

                <div className="space-y-6">
                    {activeTab === 'signup' && (
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setRole('user')}
                                className={`flex-1 py-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${role === 'user' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/60'}`}
                            >
                                <span className="font-semibold text-sm">{t('auth.roleUser') || "Visitor"}</span>
                                <span className="text-[10px] opacity-60">Explore & Connect</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('owner')}
                                className={`flex-1 py-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${role === 'owner' ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-white/5 border-white/10 text-white/60'}`}
                            >
                                <span className="font-semibold text-sm">{t('auth.roleOwner') || "Business Owner"}</span>
                                <span className="text-[10px] opacity-60">Grow Your Business</span>
                            </button>
                        </div>
                    )}

                    <button 
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-3 hover:bg-white/90 transition-all disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                <span>Continue with Google</span>
                            </>
                        )}
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-dark-bg px-2 text-white/40">Or continue with email</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none"
                        />
                        <button
                            onClick={handleEmailAuth}
                            disabled={isLoading || !email || !password}
                            className="w-full py-3 rounded-xl bg-white/10 text-white font-semibold disabled:opacity-50"
                        >
                            {activeTab === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
                        </button>
                    </div>

                    {authMessage && (
                        <p className={`text-sm rounded-xl border px-3 py-2 ${authMessage.type === 'error' ? 'text-red-300 border-red-500/40 bg-red-500/10' : 'text-cyan-200 border-cyan-500/40 bg-cyan-500/10'}`}>
                            {authMessage.text}
                        </p>
                    )}

                    <div className="text-center">
                        <button 
                            onClick={() => {
                                setActiveTab(activeTab === 'signin' ? 'signup' : 'signin');
                                setAuthMessage(null);
                            }}
                            className="text-primary text-sm font-medium hover:underline"
                        >
                            {activeTab === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

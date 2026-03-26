import React, { useState } from 'react';
import { X } from './icons';
import { useTranslations } from '../hooks/useTranslations';
import { supabase } from '../services/supabase';

interface AuthModalProps {
    onClose: () => void;
    onLogin: (email: string, role: 'user' | 'owner') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [role, setRole] = useState<'user' | 'owner'>('user');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslations();

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.href,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error('Supabase Google Sign-In Error:', error);
            alert('Failed to sign in with Google. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const continueAsGuest = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInAnonymously({
                options: {
                    data: {
                        role,
                    },
                },
            });
            if (error) throw error;
            onLogin('guest@iraq-compass.local', role);
        } catch (error) {
            console.error('Supabase anonymous sign-in failed:', error);
            alert('Failed to start a guest session. Please try again.');
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
                                <span className="font-semibold text-sm">{t('auth.roleUser') || 'Visitor'}</span>
                                <span className="text-[10px] opacity-60">Explore & Connect</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('owner')}
                                className={`flex-1 py-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${role === 'owner' ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-white/5 border-white/10 text-white/60'}`}
                            >
                                <span className="font-semibold text-sm">{t('auth.roleOwner') || 'Business Owner'}</span>
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
                                <span className="text-base font-black">G</span>
                                <span>Continue with Google</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={continueAsGuest}
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/15 transition-all disabled:opacity-50"
                    >
                        Continue as guest
                    </button>

                    <div className="text-center">
                        <button
                            onClick={() => setActiveTab(activeTab === 'signin' ? 'signup' : 'signin')}
                            className="text-primary text-sm font-medium hover:underline"
                        >
                            {activeTab === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

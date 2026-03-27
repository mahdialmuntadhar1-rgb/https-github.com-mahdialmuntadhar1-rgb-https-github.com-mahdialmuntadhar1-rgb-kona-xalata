import React from 'react';
import type { User } from '../types';
import { Heart, Star, MapPin, Clock, Users, ShieldCheck } from './icons';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './GlassCard';
import { DataArchitect } from './DataArchitect';

interface DashboardProps {
    user: User;
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = React.useState<'profile' | 'architect'>('profile');
    const [statusMsg, setStatusMsg] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
    
    const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    const handleCreatePost = async (postData: Partial<Post>) => {
        try {
            const result = await api.createPost({
                ...postData,
                businessId: user.businessId,
                businessName: user.name,
                businessAvatar: user.avatar
            });
            if (result.success) {
                setStatusMsg({ type: 'success', text: 'Post created successfully!' });
                setTimeout(() => setStatusMsg(null), 3000);
            } else {
                setStatusMsg({ type: 'error', text: 'Posting is in limited beta for now.' });
                setTimeout(() => setStatusMsg(null), 3000);
            }
        } catch (error) {
            console.error('Error creating post:', error);
            setStatusMsg({ type: 'error', text: 'Failed to create post.' });
            setTimeout(() => setStatusMsg(null), 3000);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatusMsg({ type: 'error', text: 'Profile editing will be enabled in Phase 2.' });
        setTimeout(() => setStatusMsg(null), 3000);
    };

    const recentActivity = [
        { type: 'favorite', item: 'Saj Al-Reef', icon: <Heart className="w-4 h-4 text-accent" />, time: '2 hours ago' },
        { type: 'view', item: 'Baghdad International Music Festival', icon: <Clock className="w-4 h-4 text-secondary" />, time: '1 day ago' },
        { type: 'search', item: 'Hotels in Erbil', icon: <Users className="w-4 h-4 text-primary" />, time: '3 days ago' },
    ];

    return (
        <div className="container mx-auto px-4 py-12">
            {statusMsg && (
                <div className={`fixed bottom-8 right-8 px-6 py-3 rounded-xl backdrop-blur-xl border shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 ${
                    statusMsg.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'
                }`}>
                    {statusMsg.text}
                </div>
            )}


            <div className="mb-8 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                Dashboard is currently in limited beta: profile basics are live, while advanced owner/admin tools are coming soon.
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 text-center md:text-start rtl:md:text-right">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-6 md:mb-0">
                    <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full border-4 border-primary" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">{t('dashboard.welcome')}, {user.name}!</h1>
                        <p className="text-white/70">{user.email}</p>
                        <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                            {user.role === 'owner' && (
                                <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-bold uppercase tracking-wider">
                                    {t('auth.roleOwner') || "Business Owner"}
                                </span>
                            )}
                            {user.role === 'admin' && (
                                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    System Admin
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <button onClick={onLogout} className="px-6 py-2 rounded-full bg-accent/20 border border-accent text-accent font-semibold hover:bg-accent/30 transition-colors">
                    {t('dashboard.logout')}
                </button>
            </div>

            {user.role === 'admin' && (
                <div className="flex justify-center mb-12">
                    <div className="flex p-1 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`px-8 py-2.5 rounded-xl transition-all font-medium ${activeTab === 'profile' ? 'bg-primary text-white shadow-glow-primary' : 'text-white/60 hover:text-white'}`}
                        >
                            My Profile
                        </button>
                        <button 
                            onClick={() => setActiveTab('architect')}
                            className={`px-8 py-2.5 rounded-xl transition-all font-medium ${activeTab === 'architect' ? 'bg-primary text-white shadow-glow-primary' : 'text-white/60 hover:text-white'}`}
                        >
                            Data Architect
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'architect' && user.role === 'admin' ? (
                <DataArchitect />
            ) : (
                <>
                    {user.role === 'owner' && user.businessId && (
                        <div className="max-w-2xl mx-auto mb-12">
                            <h2 className="text-2xl font-bold text-white mb-6">{t('dashboard.createPost') || "Create a Post"}</h2>
                            <GlassCard className="p-6 border-primary/30 bg-primary/10">
                                <p className="text-white/80 text-sm">
                                    <span className="font-semibold text-primary">MVP boundary:</span> Business posting tools are disabled until moderation and storage workflows are completed in Phase 2.
                                </p>
                            </GlassCard>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-start rtl:text-right">
                        {/* Profile Settings */}
                        <GlassCard className="lg:col-span-1 p-6">
                            <h2 className="text-2xl font-bold text-white mb-6">{t('dashboard.profileSettings')}</h2>
                            <form className="space-y-4" onSubmit={handleProfileUpdate}>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">{t('auth.fullName')}</label>
                                    <input name="name" type="text" defaultValue={user.name} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none focus:border-primary transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">{t('auth.email')}</label>
                                    <input name="email" type="email" defaultValue={user.email} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none focus:border-primary transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">{t('auth.newPassword')}</label>
                                    <input name="password" type="password" placeholder="********" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 outline-none cursor-not-allowed" disabled />
                                    <p className="text-[10px] text-white/30 mt-1">Password changes are handled via Google Account</p>
                                </div>
                                <button type="submit" disabled className="w-full !mt-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                    {t('dashboard.saveChanges')} • Coming Soon
                                </button>
                            </form>
                        </GlassCard>
                        
                        {/* My Activity and Favorites */}
                        <div className="lg:col-span-2 space-y-8">
                             <GlassCard className="p-6">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><Heart className="text-accent" /> {t('dashboard.myFavorites')}</h2>
                                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 rtl:pr-0 rtl:pl-2">
                                     <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <img src="https://picsum.photos/seed/b2/128/128" alt="Saj Al-Reef" className="w-16 h-16 rounded-lg object-cover" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-white">Saj Al-Reef</h3>
                                            <div className="flex items-center gap-4 text-sm text-white/60">
                                                <div className="flex items-center gap-1"><Star className="w-4 h-4 text-accent" /> 4.5</div>
                                                <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> 1.2 km</div>
                                            </div>
                                        </div>
                                     </div>
                                      <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <img src="https://picsum.photos/seed/b1/128/128" alt="Grand Millennium" className="w-16 h-16 rounded-lg object-cover" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-white">Grand Millennium</h3>
                                            <div className="flex items-center gap-4 text-sm text-white/60">
                                                <div className="flex items-center gap-1"><Star className="w-4 h-4 text-accent" /> 4.8</div>
                                                <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> 2.5 km</div>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            </GlassCard>

                             <GlassCard className="p-6">
                                <h2 className="text-2xl font-bold text-white mb-6">{t('dashboard.recentActivity')}</h2>
                                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 rtl:pr-0 rtl:pl-2">
                                    {recentActivity.map((activity, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 rounded-xl bg-white/5">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">{activity.icon}</div>
                                            <div className="flex-1">
                                                <p className="text-white/90 text-sm"><span className="font-semibold">{t(`activity.${activity.type}`)}:</span> {activity.item}</p>
                                            </div>
                                            <p className="text-xs text-white/50">{activity.time}</p>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

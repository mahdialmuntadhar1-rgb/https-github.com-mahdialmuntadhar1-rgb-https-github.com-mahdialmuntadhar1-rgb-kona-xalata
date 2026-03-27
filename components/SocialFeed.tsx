import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, CheckCircle } from './icons';
import { GlassCard } from './GlassCard';
import { useTranslations } from '../hooks/useTranslations';
import type { Post } from '../types';

interface SocialFeedProps {
    posts: Post[];
    isLoading?: boolean;
    isMvpPreview?: boolean;
    onLike?: (postId: string) => void;
    onComment?: (postId: string) => void;
    onShare?: (postId: string) => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ posts, isLoading, isMvpPreview = false, onLike, onComment, onShare }) => {
    const { t } = useTranslations();
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

    const handleLike = (postId: string) => {
        const newLikedPosts = new Set(likedPosts);
        if (newLikedPosts.has(postId)) {
            newLikedPosts.delete(postId);
        } else {
            newLikedPosts.add(postId);
        }
        setLikedPosts(newLikedPosts);
        if (!isMvpPreview) {
            onLike?.(postId);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-6 animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-white/10" />
                            <div className="space-y-2">
                                <div className="w-24 h-4 bg-white/10 rounded" />
                                <div className="w-16 h-3 bg-white/10 rounded" />
                            </div>
                        </div>
                        <div className="w-full h-4 bg-white/10 rounded mb-2" />
                        <div className="w-2/3 h-4 bg-white/10 rounded mb-4" />
                        <div className="w-full aspect-video bg-white/10 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {isMvpPreview && (
                <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-white/80">
                    <span className="font-semibold text-primary">MVP Preview:</span> Social posting, comments, and sharing are planned for Phase 2.
                </div>
            )}
            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <MessageCircle className="w-8 h-8 text-white/20" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">{t('social.noPostsTitle') || "No updates yet"}</h3>
                    <p className="text-white/60 text-sm max-w-xs mx-auto">
                        {t('social.noPostsDesc') || "Follow some businesses to see their latest updates and offers here."}
                    </p>
                </div>
            ) : (
                posts.map((post) => (
                <GlassCard key={post.id} className="p-0 overflow-hidden border-white/10 hover:border-white/20 transition-all duration-300">
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src={post.businessAvatar} alt={post.businessName} className="w-10 h-10 rounded-full border border-primary/30" />
                                {post.verified && (
                                    <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5 border border-dark-bg">
                                        <CheckCircle className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-white flex items-center gap-1">
                                    {post.businessName}
                                    {post.verified && <CheckCircle className="w-3 h-3 text-primary" />}
                                </h3>
                                <p className="text-xs text-white/50">{post.createdAt.toLocaleString()}</p>
                            </div>
                        </div>
                        <button
                            disabled={isMvpPreview}
                            className="p-2 rounded-full hover:bg-white/5 text-white/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-4 pb-4">
                        <p className="text-white/90 leading-relaxed mb-4">{post.caption}</p>
                    </div>

                    {/* Image */}
                    <div className="relative aspect-video bg-white/5">
                        <img src={post.imageUrl} alt="Post content" className="w-full h-full object-cover" />
                    </div>

                    {/* Footer / Actions */}
                    <div className="p-4 flex items-center justify-between border-t border-white/5">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => handleLike(post.id)}
                                disabled={isMvpPreview}
                                className={`flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${likedPosts.has(post.id) ? 'text-accent' : 'text-white/60 hover:text-accent'}`}
                            >
                                <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                                <span className="text-sm font-medium">{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                            </button>
                            <button 
                                onClick={() => onComment?.(post.id)}
                                disabled={isMvpPreview}
                                className="flex items-center gap-2 text-white/60 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">{t('social.comments') || "Comments"}</span>
                            </button>
                        </div>
                        <button 
                            onClick={() => onShare?.(post.id)}
                            disabled={isMvpPreview}
                            className="flex items-center gap-2 text-white/60 hover:text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm font-medium">{t('social.share') || "Share"}</span>
                        </button>
                    </div>
                </GlassCard>
            )))}
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BusinessDirectory } from './components/BusinessDirectory';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { SubcategoryModal } from './components/SubcategoryModal';
import { HomePage } from './components/HomePage';
import { api } from './services/api';
import { supabase } from './services/supabase';
import type { User, Category, Subcategory, Post } from './types';
import { TranslationProvider } from './hooks/useTranslations';
import { motion, AnimatePresence } from 'motion/react';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

import { translations } from './constants';
import { mockData, normalizeGovernorate } from './services/mockData';

const getTranslation = (key: string) => {
  const lang = (localStorage.getItem('iraq-compass-lang') as 'en' | 'ar' | 'ku') || 'en';
  const keys = key.split('.');
  let result: any = translations[lang];
  for (const k of keys) {
    result = result?.[k];
  }
  if (!result) {
    result = translations.en;
    for (const k of keys) {
      result = result?.[k];
    }
  }
  return result || key;
};

class ErrorBoundary extends (React.Component as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 text-center">
          <div className="max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white mb-4">{getTranslation('error.title')}</h2>
            <p className="text-white/60 mb-6">
              {this.state.error?.message?.includes('{') 
                ? getTranslation('error.database') 
                : getTranslation('error.unexpected')}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:shadow-glow-primary transition-all"
            >
              {getTranslation('error.refresh')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const MainContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [page, setPage] = useState<'home' | 'dashboard' | 'listing'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [listingFilter, setListingFilter] = useState<{ categoryId?: string; city?: string; governorate?: string } | null>(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isSocialLoading, setIsSocialLoading] = useState(true);
  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('iraq-compass-high-contrast') === 'true';
    }
    return false;
  });

  useEffect(() => {
    let mounted = true;

    const syncProfile = async (authUser: SupabaseAuthUser | null) => {
      if (!mounted) return;

      if (authUser) {
        const roleFromQuery = new URLSearchParams(window.location.search).get('role');
        const pendingRole = sessionStorage.getItem('pending_role') as 'user' | 'owner' | null;
        const resolvedRole = (pendingRole || (roleFromQuery === 'owner' ? 'owner' : 'user')) as 'user' | 'owner';
        const user = await api.getOrCreateProfile(authUser, resolvedRole);

        if (!mounted) return;
        setCurrentUser(user);
        setIsLoggedIn(!!user);
        sessionStorage.removeItem('pending_role');

        if (roleFromQuery) {
          const next = new URL(window.location.href);
          next.searchParams.delete('role');
          window.history.replaceState({}, document.title, `${next.pathname}${next.search}${next.hash}`);
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    };

    const bootstrapAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Failed to load auth session:', error.message);
      }

      await syncProfile(data.session?.user ?? null);
      if (mounted) setIsAuthReady(true);
    };

    void bootstrapAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncProfile(session?.user ?? null);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsSocialLoading(true);
    const unsubscribe = api.subscribeToPosts((newPosts) => {
      const fallbackPosts = mockData.posts(selectedGovernorate);
      setPosts(newPosts.length > 0 ? newPosts : fallbackPosts);
      setIsSocialLoading(false);
    }, selectedGovernorate);
    return () => unsubscribe();
  }, [selectedGovernorate]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
      localStorage.setItem('iraq-compass-high-contrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-contrast');
      localStorage.setItem('iraq-compass-high-contrast', 'false');
    }
  }, [highContrast]);

  const handleLogin = (role: 'user' | 'owner') => {
    // Auth is handled in AuthModal via Supabase OAuth.
    // We store the role in sessionStorage to be picked up by the auth listener.
    sessionStorage.setItem('pending_role', role);
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setPage('home');
  };
  
  const navigateTo = (targetPage: 'home' | 'dashboard') => {
      if (targetPage === 'dashboard' && !isLoggedIn) {
          setShowAuthModal(true);
      } else {
          setPage(targetPage);
          if (targetPage === 'home') {
            setListingFilter(null);
          }
      }
  }

  const handleCategoryClick = (category: Category) => {
    if (category.subcategories && category.subcategories.length > 0) {
      setSelectedCategory(category);
    } else {
      setListingFilter({ categoryId: category.id });
      setPage('listing');
    }
  };
  
  const handleSubcategorySelect = (category: Category, subcategory: Subcategory) => {
    setListingFilter({ categoryId: category.id });
    setPage('listing');
    setSelectedCategory(null);
  };

  const handleSearch = (query: string) => {
    setListingFilter({ city: query, governorate: selectedGovernorate !== 'all' ? selectedGovernorate : undefined });
    setPage('listing');
  };

  const handleGovernorateChange = (gov: string) => {
    const normalized = normalizeGovernorate(gov);
    setSelectedGovernorate(normalized);
    if (page === 'listing') {
        setListingFilter(prev => ({ ...prev, governorate: normalized !== 'all' ? normalized : undefined }));
    }
  };


  const handleHeroAction = (action: 'explore_city' | 'view_businesses' | 'trending' | 'join_owner') => {
    if (action === 'explore_city') {
      handleSearch(selectedGovernorate === 'all' ? '' : selectedGovernorate);
      return;
    }

    if (action === 'view_businesses') {
      setListingFilter({ governorate: selectedGovernorate !== 'all' ? selectedGovernorate : undefined });
      setPage('listing');
      return;
    }

    if (action === 'trending') {
      const section = document.querySelector('section[data-section="trending"]');
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (!isLoggedIn) {
      sessionStorage.setItem('pending_role', 'owner');
      setShowAuthModal(true);
      return;
    }

    if (currentUser?.role !== 'owner' && currentUser?.role !== 'admin') {
      setPage('dashboard');
      return;
    }

    setPage('dashboard');
  };
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header 
        isLoggedIn={isLoggedIn}
        user={currentUser}
        onSignIn={() => setShowAuthModal(true)}
        onSignOut={handleLogout}
        onDashboard={() => navigateTo('dashboard')}
        onHome={() => navigateTo('home')}
      />
      <main>
        <AnimatePresence mode="wait">
          {page === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HomePage 
                posts={posts}
                isSocialLoading={isSocialLoading}
                isLoggedIn={isLoggedIn}
                onCategoryClick={handleCategoryClick}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onSearch={handleSearch}
                selectedGovernorate={selectedGovernorate}
                onGovernorateChange={handleGovernorateChange}
                highContrast={highContrast}
                setHighContrast={setHighContrast}
                onHeroAction={handleHeroAction}
              />
            </motion.div>
          )}
          {page === 'listing' && listingFilter && (
              <motion.div
                key="listing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BusinessDirectory 
                    initialFilter={listingFilter} 
                    onBack={() => navigateTo('home')} 
                />
              </motion.div>
          )}
          {page === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard user={currentUser!} onLogout={handleLogout} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />}
      <SubcategoryModal 
        category={selectedCategory} 
        onClose={() => setSelectedCategory(null)}
        onSubcategorySelect={handleSubcategorySelect}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <TranslationProvider>
        <MainContent />
      </TranslationProvider>
    </ErrorBoundary>
  );
}

export default App;
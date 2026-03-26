import React, { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { StoriesRing } from './components/StoriesRing';
import { CategoryGrid } from './components/CategoryGrid';
import { FeaturedBusinesses } from './components/FeaturedBusinesses';
import { PersonalizedEvents } from './components/PersonalizedEvents';
import { DealsMarketplace } from './components/DealsMarketplace';
import { CommunityStories } from './components/CommunityStories';
import { CityGuide } from './components/CityGuide';
import { BusinessDirectory } from './components/BusinessDirectory';
import { InclusiveFeatures } from './components/InclusiveFeatures';
import { SocialFeed } from './components/SocialFeed';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { SubcategoryModal } from './components/SubcategoryModal';
import { GovernorateFilter } from './components/GovernorateFilter';
import { SearchPortal } from './components/SearchPortal';
import { api } from './services/api';
import { supabase } from './services/supabase';
import type { User, Category, Subcategory, Post } from './types';
import { TranslationProvider } from './hooks/useTranslations';
import { subscribeToNewPosts } from './services/feed';
import { BusinessDetailsPage } from './components/BusinessDetailsPage';

class ErrorBoundary extends (React.Component as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 text-center">
          <div className="max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-white/60 mb-6">{this.state.error?.message || 'An unexpected error occurred. Please refresh the page.'}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:shadow-glow-primary transition-all">Refresh Page</button>
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
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [listingFilter, setListingFilter] = useState<{ categoryId: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('iraq-compass-high-contrast') === 'true';
    }
    return false;
  });
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');

  const selectedGovernorate = useMemo(() => {
    const match = currentPath.match(/^\/gov\/([^/]+)$/);
    return match?.[1] || 'all';
  }, [currentPath]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user;
      if (sessionUser) {
        const user = await api.login(sessionUser.email || '', 'user');
        setCurrentUser(user);
        setIsLoggedIn(true);
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
      setIsAuthReady(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = await api.login(session.user.email || '', 'user');
        setCurrentUser(user);
        setIsLoggedIn(true);
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
      setIsAuthReady(true);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onPop = () => setCurrentPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    api.getPosts()
      .then((apiPosts) => setPosts(apiPosts))
      .catch(() => setFeedError('Could not load social feed.'));

    const unsubscribe = subscribeToNewPosts(
      (newPost) => {
        setPosts((current) => {
          if (current.some((post) => post.id === newPost.id)) return current;
          return [newPost, ...current].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 50);
        });
      },
      (message) => setFeedError(message),
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
      localStorage.setItem('iraq-compass-high-contrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-contrast');
      localStorage.setItem('iraq-compass-high-contrast', 'false');
    }
  }, [highContrast]);

  const goTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const handleLogin = async (email: string, role: 'user' | 'owner') => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const user = await api.login(email, role);
      setCurrentUser(user);
      setIsLoggedIn(true);
    }
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setCurrentUser(null);
    goTo('/');
  };

  const navigateToDashboard = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    goTo('/dashboard');
  };

  const handleCategoryClick = (category: Category) => {
    if (category.subcategories && category.subcategories.length > 0) {
      setSelectedCategory(category);
    } else {
      setListingFilter({ categoryId: category.id });
      goTo('/listing');
    }
  };

  const handleSubcategorySelect = (category: Category, subcategory: Subcategory) => {
    setListingFilter({ categoryId: category.id });
    setSelectedCategory(null);
    goTo('/listing');
  };

  if (!isAuthReady) {
    return <div className="min-h-screen bg-dark-bg flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const businessMatch = currentPath.match(/^\/business\/([^/]+)$/);

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header
        isLoggedIn={isLoggedIn}
        user={currentUser}
        onSignIn={() => setShowAuthModal(true)}
        onSignOut={handleLogout}
        onDashboard={navigateToDashboard}
        onHome={() => goTo('/')}
      />
      <main>
        {isOffline && <div className="mx-4 mt-4 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm text-accent">You are offline. Realtime updates are paused.</div>}
        {feedError && <div className="mx-4 mt-4 rounded-xl border border-white/20 bg-white/10 p-3 text-sm text-white/80">{feedError}</div>}

        {(currentPath === '/' || currentPath.startsWith('/gov/')) && (
          <>
            <HeroSection />
            <StoriesRing />
            <div className="container mx-auto px-4 py-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                  <h2 className="text-3xl font-bold text-white mb-8">Social Ecosystem</h2>
                  <SocialFeed posts={posts} />
                </div>
                <div className="space-y-12">
                  <SearchPortal />
                  <GovernorateFilter
                    selectedGovernorate={selectedGovernorate}
                    onGovernorateChange={(gov) => goTo(gov === 'all' ? '/' : `/gov/${gov}`)}
                  />
                  <CategoryGrid onCategoryClick={handleCategoryClick} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                </div>
              </div>
            </div>
            <FeaturedBusinesses selectedGovernorate={selectedGovernorate} onBusinessOpen={(businessId) => goTo(`/business/${businessId}`)} />
            <PersonalizedEvents />
            <DealsMarketplace />
            <CommunityStories />
            <CityGuide />
            <BusinessDirectory selectedGovernorate={selectedGovernorate} onBusinessOpen={(businessId) => goTo(`/business/${businessId}`)} />
            <InclusiveFeatures highContrast={highContrast} setHighContrast={setHighContrast} />
          </>
        )}

        {currentPath === '/listing' && (
          <BusinessDirectory
            initialFilter={listingFilter || undefined}
            selectedGovernorate={selectedGovernorate}
            onBack={() => goTo('/')}
            onBusinessOpen={(businessId) => goTo(`/business/${businessId}`)}
          />
        )}

        {businessMatch && <BusinessDetailsPage businessId={businessMatch[1]} onBack={() => history.back()} />}

        {currentPath === '/dashboard' && currentUser && <Dashboard user={currentUser} onLogout={handleLogout} />}
      </main>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />}
      <SubcategoryModal category={selectedCategory} onClose={() => setSelectedCategory(null)} onSubcategorySelect={handleSubcategorySelect} />
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
};

export default App;

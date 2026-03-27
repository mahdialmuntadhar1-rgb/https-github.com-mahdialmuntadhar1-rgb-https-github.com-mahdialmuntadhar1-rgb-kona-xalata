import React, { useState, useEffect } from 'react';
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
import { supabase } from './src/lib/supabase';
import type { User, Category, Subcategory, Post } from './types';
import { TranslationProvider } from './hooks/useTranslations';

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
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-white/60 mb-6">
              {this.state.error?.message?.includes('{') 
                ? "A database error occurred. Please try again later." 
                : "An unexpected error occurred. Please refresh the page."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:shadow-glow-primary transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const MainContent: React.FC = () => {
  const buildStamp = `${__BUILD_SHA__.slice(0, 8)} @ ${new Date(__BUILD_TIME__).toISOString()}`;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [page, setPage] = useState<'home' | 'dashboard' | 'listing'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [listingFilter, setListingFilter] = useState<{ categoryId?: string; city?: string; governorate?: string } | null>(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isSocialLoading, setIsSocialLoading] = useState(true);

  const [dataStatus, setDataStatus] = useState(api.getBusinessDataSourceStatus());

  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('iraq-compass-high-contrast') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const bootstrapFromSession = async (authUser: { id: string } | null | undefined) => {
      if (!authUser) {
        setCurrentUser(null);
        setIsLoggedIn(false);
        return;
      }

      const pendingRole = sessionStorage.getItem('pending_role') as 'user' | 'owner' | null;

      try {
        const user = await api.getOrCreateProfile(authUser, pendingRole || 'user');
        setCurrentUser(user);
        setIsLoggedIn(Boolean(user));
      } catch (error) {
        console.error('Profile bootstrap error:', error);
        setCurrentUser(null);
        setIsLoggedIn(false);
      } finally {
        sessionStorage.removeItem('pending_role');
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await bootstrapFromSession(session?.user);
      setIsAuthReady(true);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      await bootstrapFromSession(data.session?.user);
      setIsAuthReady(true);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setIsSocialLoading(true);
    const unsubscribe = api.subscribeToPosts((newPosts) => {
      setPosts(newPosts);
      setIsSocialLoading(false);
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    const updateDataStatus = () => setDataStatus(api.getBusinessDataSourceStatus());
    updateDataStatus();
    const timer = window.setInterval(updateDataStatus, 1500);
    return () => window.clearInterval(timer);
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

  const handleLogin = (role: 'user' | 'owner') => {
    // Auth is handled in AuthModal via Supabase Auth.
    sessionStorage.setItem('pending_role', role);
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out failed:', error);
      return;
    }

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
    setSearchQuery(query);
    setListingFilter({ city: query, governorate: selectedGovernorate !== 'all' ? selectedGovernorate : undefined });
    setPage('listing');
  };

  const handleGovernorateChange = (gov: string) => {
    setSelectedGovernorate(gov);
    if (page === 'listing') {
        setListingFilter(prev => ({ ...prev, governorate: gov !== 'all' ? gov : undefined }));
    }
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
        {page === 'home' && (
          <>
            <HeroSection />
            <StoriesRing />
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2">
                        <h2 className="text-3xl font-bold text-white mb-8">Social Ecosystem</h2>
                        <SocialFeed posts={posts} isLoading={isSocialLoading} isMvpPreview />
                    </div>
                    <div className="space-y-12">
                        <SearchPortal onSearch={handleSearch} />
                        <GovernorateFilter 
                          selectedGovernorate={selectedGovernorate}
                          onGovernorateChange={handleGovernorateChange}
                        />
                         <CategoryGrid 
                          onCategoryClick={handleCategoryClick} 
                          currentPage={currentPage}
                          setCurrentPage={setCurrentPage}
                        />
                    </div>
                </div>
            </div>
            <FeaturedBusinesses />
            <PersonalizedEvents />
            <DealsMarketplace />
            <CommunityStories />
            <CityGuide />
            <InclusiveFeatures highContrast={highContrast} setHighContrast={setHighContrast} />
          </>
        )}
        {page === 'listing' && listingFilter && (
            <BusinessDirectory 
                initialFilter={listingFilter} 
                onBack={() => navigateTo('home')} 
            />
        )}
        {page === 'dashboard' && currentUser && <Dashboard user={currentUser} onLogout={handleLogout} />}
      </main>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />}
      <SubcategoryModal 
        category={selectedCategory} 
        onClose={() => setSelectedCategory(null)}
        onSubcategorySelect={handleSubcategorySelect}
      />
      <div className="fixed bottom-2 right-3 z-50 pointer-events-none">
        <div className="text-[10px] tracking-wide uppercase px-2 py-1 rounded-md bg-black/35 border border-white/20 text-white/60">
          {dataStatus.envOk ? 'ENV OK' : 'ENV MISSING'} · DATA: {dataStatus.dataSource === 'live' ? 'LIVE' : 'FALLBACK'}
          <div className="normal-case tracking-normal text-white/50">
            build {buildStamp}
          </div>
        </div>
      </div>
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

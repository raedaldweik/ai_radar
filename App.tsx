import React, { useState, useContext, useEffect } from 'react';
import { DirectoryPage } from './components/DirectoryPage';
import { DashboardPage } from './components/DashboardPage';
import { LearningPage } from './components/LearningPage';
import { IntelligenceHubPage } from './components/IntelligenceHubPage';
import { ChatAssistant } from './components/ChatAssistant';
import { WelcomePage } from './components/WelcomePage';
import { LanguageProvider, LanguageContext } from './i18n/LanguageContext';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ProfileSwitcher } from './components/ProfileSwitcher';
import { HomeIcon } from './components/icons/HomeIcon';
import { Category, Profile } from './types';
import { KnowledgeBaseProvider } from './context/KnowledgeBaseContext';

type Page = 'directory' | 'dashboard' | 'learning' | 'intelligence_hub';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [initialCategory, setInitialCategory] = useState<Category>(Category.All);
  const [showWelcome, setShowWelcome] = useState(true);
  const [scrollToExplore, setScrollToExplore] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([
    { name: 'General', interests: [] },
    { name: 'Major Omar', interests: ['Airports', 'Bikes'] },
  ]);
  const [currentProfileName, setCurrentProfileName] = useState('General');

  const currentProfile = profiles.find((p) => p.name === currentProfileName) || profiles[0];
  const [userInterests, setUserInterests] = useState<string[]>(currentProfile.interests);
  const { t } = useContext(LanguageContext);

  useEffect(() => {
    const profile = profiles.find((p) => p.name === currentProfileName);
    if (profile) {
      setUserInterests(profile.interests);
    }
  }, [currentProfileName, profiles]);

  const handleProfileChange = (profileName: string) => {
    setCurrentProfileName(profileName);
  };

  const handleUpdateInterests = (profileName: string, newInterests: string[]) => {
    setProfiles((prevProfiles) =>
      prevProfiles.map((p) => (p.name === profileName ? { ...p, interests: newInterests } : p))
    );
    if (profileName === currentProfileName) {
      setUserInterests(newInterests);
    }
  };

  const handleSetUserInterests = (interests: string[]) => {
    setUserInterests(interests);
    handleUpdateInterests(currentProfileName, interests);
  };

  useEffect(() => {
    if (!scrollToExplore) {
      window.scrollTo(0, 0);
    }
  }, [currentPage, scrollToExplore]);

  // Listen for "Brief my team" clicks anywhere in the app — navigate to the Intelligence Hub.
  // IntelligenceHubPage itself listens for the same event and auto-launches the Memo agent.
  useEffect(() => {
    const handler = () => {
      setCurrentPage('intelligence_hub');
      setScrollToExplore(false);
    };
    window.addEventListener('launch-memo-from-signal', handler as EventListener);
    return () => window.removeEventListener('launch-memo-from-signal', handler as EventListener);
  }, []);

  const goToHome = () => {
    setShowWelcome(true);
    setCurrentPage('dashboard');
    setScrollToExplore(false);
  };

  const navigateToDirectory = (category: Category = Category.All, options: { scrollToExplore?: boolean } = {}) => {
    setInitialCategory(category);
    setCurrentPage('directory');
    setScrollToExplore(options.scrollToExplore || false);
  };

  const navigateToDashboard = () => {
    setInitialCategory(Category.All);
    setCurrentPage('dashboard');
    setScrollToExplore(false);
  };

  const navigateToLearning = () => {
    setCurrentPage('learning');
    setScrollToExplore(false);
  };

  const navigateToIntelligenceHub = () => {
    setCurrentPage('intelligence_hub');
    setScrollToExplore(false);
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  if (showWelcome) {
    return (
      <WelcomePage
        userInterests={userInterests}
        setUserInterests={handleSetUserInterests}
        onComplete={handleWelcomeComplete}
        currentProfile={currentProfileName}
        onProfileChange={handleProfileChange}
        profiles={profiles}
        onUpdateInterests={handleUpdateInterests}
      />
    );
  }

  const dir = t('common.dir') || (t('common.lang') === 'ar' ? 'rtl' : 'ltr');

  const navButtonClass = (page: Page) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-all ${
      currentPage === page
        ? 'bg-sky-600 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.25)_inset]'
        : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
    }`;

  return (
    <div className="relative min-h-screen text-white font-sans" dir={dir}>
      <nav className="sticky top-0 z-30 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <img src="https://raedaldweik.github.io/AIRadar/logo.png" alt="AI Radar Logo" className="h-8" />
                <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-sky-300 to-sky-500 drop-shadow-[0_0_10px_rgba(56,189,248,0.15)]">
                  {t('common.appName')}
                </span>
              </div>
              <div className="hidden sm:flex items-center space-x-4">
                <button
                  onClick={goToHome}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                  aria-label={t('nav.home')}
                >
                  <HomeIcon className="w-5 h-5" />
                  {t('nav.home')}
                </button>
                <button onClick={navigateToDashboard} className={navButtonClass('dashboard')}>
                  {t('nav.dashboard')}
                </button>
                <button onClick={() => navigateToDirectory(Category.All)} className={navButtonClass('directory')}>
                  {t('nav.directory')}
                </button>
                <button onClick={navigateToLearning} className={navButtonClass('learning')}>
                  {t('nav.learning')}
                </button>
                <button onClick={navigateToIntelligenceHub} className={navButtonClass('intelligence_hub')}>
                  {t('nav.intelligenceHub')}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ProfileSwitcher
                currentProfile={currentProfileName}
                onProfileChange={handleProfileChange}
                profiles={profiles}
                onUpdateInterests={handleUpdateInterests}
              />
            </div>
          </div>
        </div>
      </nav>
      <main>
        {currentPage === 'dashboard' && (
          <DashboardPage userInterests={userInterests} onNavigateToDirectory={navigateToDirectory} />
        )}
        {currentPage === 'directory' && (
          <DirectoryPage
            userInterests={userInterests}
            initialCategory={initialCategory}
            scrollToExplore={scrollToExplore}
            onScrollComplete={() => setScrollToExplore(false)}
          />
        )}
        {currentPage === 'learning' && <LearningPage userInterests={userInterests} />}
        {currentPage === 'intelligence_hub' && (
          <IntelligenceHubPage userInterests={userInterests} currentProfileName={currentProfileName} />
        )}
      </main>
      <ChatAssistant userInterests={userInterests} />
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <KnowledgeBaseProvider>
      <AppContent />
    </KnowledgeBaseProvider>
  </LanguageProvider>
);

export default App;
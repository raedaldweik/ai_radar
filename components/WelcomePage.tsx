import React, { useState, useEffect, useContext } from 'react';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { LanguageContext } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ProfileSwitcher } from './ProfileSwitcher';
import { NetworkBackground } from './NetworkBackground';
import { Profile } from '../types';


interface WelcomePageProps {
  userInterests: string[];
  setUserInterests: (interests: string[]) => void;
  onComplete: () => void;
  currentProfile: string;
  onProfileChange: (profile: string) => void;
  profiles: Profile[];
  onUpdateInterests: (profileName: string, interests: string[]) => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ 
  userInterests, 
  setUserInterests, 
  onComplete, 
  currentProfile, 
  onProfileChange,
  profiles,
  onUpdateInterests
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { t, lang } = useContext(LanguageContext);

  const techInterests = t('welcome.techInterests', { returnObjects: true }) as string[];
  const industryInterests = t('welcome.industryInterests', { returnObjects: true }) as string[];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const selectedInterestsSet = new Set(userInterests);

  const toggleInterest = (interest: string) => {
    const newInterests = new Set(selectedInterestsSet);
    if (newInterests.has(interest)) {
      newInterests.delete(interest);
    } else {
      newInterests.add(interest);
    }
    setUserInterests(Array.from(newInterests));
  };

  const handleComplete = () => {
    onComplete();
  };
  
  const handleReset = () => {
      setUserInterests([]);
  };

  const hasSelection = userInterests.length > 0;
  
  const InterestButton: React.FC<{ interest: string }> = ({ interest }) => (
    <button
        onClick={() => toggleInterest(interest)}
        className={`rounded-full border-2 text-sm font-medium px-5 py-2.5 transition-all duration-200 ${
            selectedInterestsSet.has(interest)
            ? 'bg-sky-600 border-sky-500 text-white shadow-lg shadow-sky-500/20'
            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-sky-500 hover:text-white'
        }`}
    >
        {interest}
    </button>
  );

  return (
    <div className="relative min-h-screen text-white flex flex-col justify-between pt-6 md:pt-8 pb-8 md:pb-16 px-8 md:px-16 overflow-hidden">
      <NetworkBackground />
      
        <div className="absolute top-4 start-4 z-20">
            <img src="https://raedaldweik.github.io/AIRadar/logo.png" alt="AI Radar Logo" className="h-12" />
        </div>
        <div className="absolute top-4 end-4 z-20 flex items-center gap-2">
            <LanguageSwitcher />
            <ProfileSwitcher 
                currentProfile={currentProfile} 
                onProfileChange={onProfileChange} 
                profiles={profiles}
                onUpdateInterests={onUpdateInterests}
            />
        </div>
      
      <div className={`relative z-10 text-center max-w-screen-2xl mx-auto transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className={`text-5xl md:text-7xl font-extrabold mb-4 text-center transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
            {lang === 'ar' ? (
                <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                    {t('welcome.title')}
                </span>
            ) : (
                <span className="relative inline-block">
                    <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                        {`${t('welcome.title_part1')}${t('welcome.title_styled_part').charAt(0)}`}
                    </span>
                    <span className="relative inline-block text-sky-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                        <span className="relative z-10">{t('welcome.title_styled_part').substring(1)}</span>
                        <span className="absolute inset-0 animate-pulse-glow-corners">
                            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-sky-400 rounded-tl-lg"></span>
                            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-sky-400 rounded-tr-lg"></span>
                            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-sky-400 rounded-bl-lg"></span>
                            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-sky-400 rounded-br-lg"></span>
                        </span>
                    </span>
                    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-3xl font-bold text-white tracking-wide whitespace-nowrap">
                        {currentProfile === 'Major Omar' ? 'Welcome Major Omar' : 'Dubai'}
                    </span>
                </span>
            )}
        </h1>
        <p className={`text-lg md:text-xl text-white mt-16 transition-all duration-700 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
         {t('welcome.subtitle')}
        </p>
      </div>

      <div className={`relative z-10 text-center max-w-screen-2xl mx-auto transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`transition-all duration-700 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
            <div className="flex flex-wrap justify-center items-center gap-3 max-w-5xl mx-auto">
                {Array.from(new Set([...userInterests, ...techInterests, ...industryInterests])).slice(0, 14).map((interest) => (
                    <InterestButton key={interest} interest={interest} />
                ))}
            </div>
        </div>
        
        <div className={`mt-12 transition-all duration-700 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
            <div className="flex items-center justify-center gap-4">
                {userInterests.length > 0 && (
                     <button
                        onClick={handleReset}
                        className="text-slate-300 hover:text-white font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-105 bg-slate-800/50 border-2 border-slate-700 hover:border-slate-500"
                    >
                        {t('welcome.resetButton')}
                    </button>
                )}
                <button
                    onClick={handleComplete}
                    disabled={!hasSelection}
                    className="inline-flex items-center gap-3 text-white bg-sky-600 font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-sky-500/40 shadow-sky-900/40 disabled:bg-slate-700 disabled:text-slate-400 disabled:scale-100 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {t('welcome.button')}
                    <ArrowRightIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
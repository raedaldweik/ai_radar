import React, { useState, useRef, useEffect } from 'react';
import { Profile } from '../types';

interface ProfileSwitcherProps {
  currentProfile: string;
  onProfileChange: (profile: string) => void;
  profiles: Profile[];
  onUpdateInterests: (profileName: string, interests: string[]) => void;
}

export const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({ 
  currentProfile, 
  onProfileChange, 
  profiles, 
  onUpdateInterests 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [newInterest, setNewInterest] = useState('');
  const [tempInterests, setTempInterests] = useState<string[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleProfileSelect = (profileName: string) => {
    onProfileChange(profileName);
    setIsOpen(false);
  };

  const handleEditInterests = (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation(); // Prevent dropdown from closing or profile selection
    setEditingProfile(profile);
    setTempInterests([...profile.interests]);
    setIsOpen(false);
  };

  const handleAddInterest = () => {
    if (newInterest.trim()) {
      setTempInterests([...tempInterests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (index: number) => {
    setTempInterests(tempInterests.filter((_, i) => i !== index));
  };

  const handleSaveInterests = () => {
    if (editingProfile) {
      onUpdateInterests(editingProfile.name, tempInterests);
      setEditingProfile(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sort profiles: current profile first, then others
  const sortedProfiles = [...profiles].sort((a, b) => {
    if (a.name === currentProfile) return -1;
    if (b.name === currentProfile) return 1;
    return 0;
  });

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-slate-800 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 border border-slate-600"
          aria-label="Switch Profile"
          aria-expanded={isOpen}
        >
          <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-xs font-bold text-white">
            {currentProfile.charAt(0)}
          </div>
          <span className="hidden sm:inline">{currentProfile}</span>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-md shadow-xl py-1 z-50 animate-fade-in">
            <div className="px-4 py-2 border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Switch Profile
            </div>
            {sortedProfiles.map((profile) => (
              <div key={profile.name} className="border-b border-slate-700/50 last:border-0">
                <button
                  onClick={() => handleProfileSelect(profile.name)}
                  className={`block w-full text-left px-4 py-3 text-sm transition-colors ${
                    currentProfile === profile.name
                      ? 'bg-sky-600/20 text-sky-400'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        currentProfile === profile.name ? 'bg-sky-600' : 'bg-slate-600'
                     }`}>
                        {profile.name.charAt(0)}
                     </div>
                     <div className="flex flex-col flex-1">
                        <span className="font-medium">{profile.name}</span>
                        {currentProfile === profile.name && <span className="text-xs text-sky-400">Active</span>}
                     </div>
                  </div>
                </button>
                <div className="px-4 pb-2 pt-0">
                  <button
                    onClick={(e) => handleEditInterests(e, profile)}
                    className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1 transition-colors ml-11"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Interests
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Interests Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-lg font-semibold text-white">Edit Interests: {editingProfile.name}</h3>
              <button 
                onClick={() => setEditingProfile(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Add New Interest</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                    placeholder="e.g. AI, Robotics..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    onClick={handleAddInterest}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Interests</label>
                <div className="flex flex-wrap gap-2 min-h-[100px] bg-slate-900/50 p-3 rounded-md border border-slate-700/50">
                  {tempInterests.length === 0 ? (
                    <span className="text-slate-500 text-sm italic">No interests added yet.</span>
                  ) : (
                    tempInterests.map((interest, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-900/30 text-sky-300 border border-sky-700/30"
                      >
                        {interest}
                        <button
                          onClick={() => handleRemoveInterest(index)}
                          className="hover:text-white focus:outline-none"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-end gap-3">
              <button
                onClick={() => setEditingProfile(null)}
                className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInterests}
                className="px-4 py-2 rounded-md text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-lg shadow-sky-900/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

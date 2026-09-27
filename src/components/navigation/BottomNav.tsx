import React from 'react';
import { Home, Sparkles, Map, Newspaper, User } from 'lucide-react';

interface BottomNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'ai', label: 'AI Local', icon: Sparkles, badge: 'AI' },
  { id: 'map', label: 'Explore', icon: Map },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'profile', label: 'Profile', icon: User },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E6E1] py-2 px-3 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {TABS.map((tab) => {
          const isActive = currentScreen === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-[#1E2BB8] font-semibold scale-105'
                  : 'text-[#9CA3AF] hover:text-[#4B5563]'
              }`}
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={`transition-colors ${
                    isActive ? 'text-[#1E2BB8] stroke-[2.2]' : 'text-[#9CA3AF]'
                  }`}
                />
                {tab.badge && !isActive && (
                  <span className="absolute -top-1 -right-2.5 bg-gradient-to-r from-[#1E2BB8] to-[#4357E6] text-white text-[8px] font-bold px-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'text-[#1E2BB8]' : 'text-[#6B7280]'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E2BB8] mt-0.5 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

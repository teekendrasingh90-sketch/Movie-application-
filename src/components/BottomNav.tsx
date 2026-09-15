import React from 'react';
import { Home, Tv, Search, User } from 'lucide-react';
import { ScreenType } from '../types';
import { iosFeedback, motorVibrate } from '../services/iosFeedback';

interface BottomNavProps {
  currentScreen: ScreenType;
  onChangeScreen: (screen: ScreenType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onChangeScreen }) => {
  const tabs = [
    { id: 'home' as ScreenType, label: 'Home', icon: Home },
    { id: 'tv' as ScreenType, label: 'TV Shows', icon: Tv },
    { id: 'search' as ScreenType, label: 'Search', icon: Search },
    { id: 'profile' as ScreenType, label: 'Profile', icon: User },
  ];

  const handleTabClick = (screen: ScreenType) => {
    motorVibrate(24);
    iosFeedback('tap');
    onChangeScreen(screen);
  };

  return (
    <nav
      className="fixed left-4 right-4 max-w-md mx-auto bottom-4 z-40 flex justify-around items-center py-2 px-3 rounded-[28px] bg-[#141418]/85 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/90"
      id="bottom-navbar"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentScreen === tab.id;
        return (
          <button
            key={tab.id}
            id={`navbtn-${tab.id}`}
            onClick={() => handleTabClick(tab.id)}
            className={`flex flex-col items-center gap-1 w-16 py-1 transition-all duration-200 active:scale-90 ${
              isActive ? 'text-[#F5F5F7]' : 'text-[#5C5C66] hover:text-[#9A9AA4]'
            }`}
            aria-label={tab.label}
          >
            <Icon
              className={`w-[22px] h-[22px] transition-all duration-200 ${
                isActive ? 'stroke-[#FFB020] scale-110' : 'stroke-current'
              }`}
            />
            <span className={`text-[10.5px] tracking-tight transition-colors duration-200 ${
              isActive ? 'font-bold text-white' : 'font-semibold'
            }`}>
              {tab.label}
            </span>
            <div
              className={`w-1.5 h-1.5 rounded-full bg-[#FFB020] transition-all duration-200 ${
                isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
};

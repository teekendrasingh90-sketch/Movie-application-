import React from 'react';
import { Search } from 'lucide-react';
import { iosFeedback, motorVibrate } from '../services/iosFeedback';

interface TopBarProps {
  onSearchClick: () => void;
  onAvatarClick?: () => void;
  userAvatar?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ onSearchClick, onAvatarClick, userAvatar }) => {
  return (
    <header className="px-5 pt-4 pb-2 relative z-20" id="topbar">
      <div className="flex items-center justify-between mb-3.5" id="brandrow">
        <div className="text-[23px] font-extrabold tracking-[-0.4px]" id="brand-logo">
          Noc<span className="text-[#FFB020]">turne</span>
        </div>
        <button
          onClick={() => {
            motorVibrate(24);
            iosFeedback('tap');
            onAvatarClick?.();
          }}
          className="w-9 h-9 rounded-full overflow-hidden border-[1.5px] border-white/15 active:scale-90 transition-transform"
          id="avatar-button"
          aria-label="User Profile"
        >
          <img
            src={userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
            alt="User Profile"
            className="w-full h-full object-cover"
          />
        </button>
      </div>

      <div
        onClick={() => {
          motorVibrate(24);
          iosFeedback('tap');
          onSearchClick();
        }}
        className="flex items-center gap-2.5 bg-white/[0.06] backdrop-blur-xl border border-white/12 rounded-[18px] px-4 py-3 cursor-pointer active:scale-[0.98] transition-transform shadow-lg shadow-black/20"
        id="searchbar-trigger"
      >
        <Search className="w-[18px] h-[18px] text-[#9A9AA4] shrink-0" />
        <span className="text-[15px] text-[#5C5C66] font-normal select-none">
          Search movies, shows, actors...
        </span>
      </div>
    </header>
  );
};

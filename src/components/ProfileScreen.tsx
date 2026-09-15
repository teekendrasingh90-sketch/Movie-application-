import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  HelpCircle,
  Camera,
  Check,
  Edit2,
  User,
  Sparkles
} from 'lucide-react';
import { MediaItem } from '../types';
import { iosFeedback, motorVibrate } from '../services/iosFeedback';

interface ProfileScreenProps {
  watchlist: MediaItem[];
  onOpenModal: (item: MediaItem) => void;
  onClearWatchlist?: () => void;
  allMedia?: MediaItem[];
  userName?: string;
  userAvatar?: string;
  onUpdateProfile?: (name: string, avatar: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  watchlist,
  onOpenModal,
  onClearWatchlist,
  userName: initialName = 'Pop User',
  userAvatar: initialAvatar = '',
  onUpdateProfile,
}) => {
  const [hapticsOn, setHapticsOn] = useState(true);
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(initialName);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(initialName);
    setTempName(initialName);
  }, [initialName]);

  useEffect(() => {
    setAvatar(initialAvatar);
  }, [initialAvatar]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3200);
  };

  const toggleHaptic = () => {
    motorVibrate(35);
    iosFeedback('tap');
    setHapticsOn(!hapticsOn);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image size exceeds 8MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatar(result);
      if (onUpdateProfile) {
        onUpdateProfile(name, result);
      }
      iosFeedback('pop');
      showToast('Profile photo updated successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (!trimmed) return;
    setName(trimmed);
    setIsEditingName(false);
    if (onUpdateProfile) {
      onUpdateProfile(trimmed, avatar);
    }
    iosFeedback('tap');
    showToast('Profile name updated!');
  };

  return (
    <div className="pb-32 pt-4 px-4 sm:px-5 max-w-xl mx-auto w-full flex-1 select-none" id="screen-profile">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-black/90 text-white border border-white/20 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-fadeIn max-w-[90vw] text-center">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold tracking-[-0.4px] text-white">
          Profile
        </h1>
        <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-zinc-400 border border-white/10">
          Pop v2.0
        </span>
      </div>

      {/* User Card with Photo Upload and Name Update */}
      <div
        className="p-5 rounded-[26px] bg-gradient-to-br from-[#FFB020]/15 via-white/[0.04] to-[#7C5CFF]/15 border border-white/12 shadow-xl mb-6 relative overflow-hidden"
        id="profile-card"
      >
        <div className="flex items-center gap-4">
          {/* Avatar with Camera Upload Trigger */}
          <div className="relative group shrink-0">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/25 shadow-lg bg-[#141418] flex items-center justify-center">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#1E1E24] to-[#2E2E38] flex items-center justify-center">
                  <User className="w-8 h-8 text-[#FFB020]" />
                </div>
              )}
            </div>
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#FFB020] text-black shadow-md hover:bg-[#FFC043] active:scale-95 transition-all border border-black/20"
              title="Upload profile photo"
              aria-label="Upload photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* User Details & Name Edit */}
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2 mb-1.5">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                  className="bg-black/50 border border-[#FFB020]/50 rounded-xl px-2.5 py-1 text-[15px] font-bold text-white outline-none focus:border-[#FFB020] w-full"
                  placeholder="Enter name"
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-xl bg-[#FFB020] text-black font-bold active:scale-95 shrink-0"
                  title="Save Name"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-[18px] font-extrabold text-[#F5F5F7] truncate leading-tight">
                  {name}
                </h2>
                <button
                  onClick={() => {
                    setTempName(name);
                    setIsEditingName(true);
                  }}
                  className="p-1 rounded-full text-[#9A9AA4] hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                  title="Edit Name"
                  aria-label="Edit Name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[12px] text-emerald-400 font-medium my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>Private Device Profile</span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold tracking-wide px-2.5 py-0.5 rounded-full bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/30">
                <Sparkles className="w-3 h-3" />
                POP VIP 4K
              </span>
              <button
                onClick={() => {
                  motorVibrate(22);
                  fileInputRef.current?.click();
                }}
                className="text-[10.5px] font-semibold text-zinc-400 hover:text-white underline underline-offset-2"
              >
                Change Photo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Watchlist Section */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#F5F5F7]">
            My Watchlist ({watchlist.length})
          </h3>
          {watchlist.length > 0 && onClearWatchlist && (
            <button
              onClick={onClearWatchlist}
              className="text-[12px] text-zinc-400 hover:text-rose-400 font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {watchlist.length === 0 ? (
          <div className="p-8 rounded-[18px] bg-white/[0.03] border border-white/10 text-center text-[#5C5C66]">
            <p className="text-[13.5px] text-zinc-300 font-medium">Your watchlist is empty.</p>
            <p className="text-[11.5px] mt-1 text-[#5C5C66]">
              Tap the &ldquo;+&rdquo; button on any movie or series to save it here on your device.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5" id="watchlistGrid">
            {watchlist.map((m, idx) => (
              <div
                key={`${m.id}-${idx}`}
                onClick={() => {
                  motorVibrate(32);
                  iosFeedback('pop');
                  onOpenModal(m);
                }}
                className="rounded-[12px] overflow-hidden aspect-[2/3] border border-white/12 bg-[#141416] cursor-pointer group active:scale-95 transition-transform"
              >
                <img
                  src={m.poster}
                  alt={m.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences Section */}
      <div>
        <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#F5F5F7] mb-3">
          Preferences
        </h3>

        <div className="rounded-[18px] overflow-hidden border border-white/12 divide-y divide-white/[0.06] bg-white/[0.04]">
          {/* Haptic feedback */}
          <div className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-[10px] bg-white/[0.08] flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-white">Haptic Feedback</div>
              <div className="text-[11.5px] text-[#5C5C66]">Vibration on taps &amp; player controls</div>
            </div>
            <button
              onClick={toggleHaptic}
              className={`w-[46px] h-[28px] rounded-full relative transition-colors duration-200 shrink-0 ${
                hapticsOn ? 'bg-[#FFB020]' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-[22px] h-[22px] rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-md ${
                  hapticsOn ? 'left-[21px]' : 'left-[3px]'
                }`}
              />
            </button>
          </div>

          {/* App Info */}
          <div className="p-4 bg-white/[0.02]" id="help-support-section">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4 text-[#FFB020]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-white mb-1">
                  About Pop Streaming
                </div>
                <p className="text-[12px] text-[#9A9AA4] leading-relaxed">
                  Pop par sabhi movies aur web series seedhe Ultra HD me play hoti hain. Fast streaming aur clean cinematic experience ke sath.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

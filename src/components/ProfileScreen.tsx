import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  HelpCircle,
  Camera,
  Check,
  Edit2,
  Mail,
  Copy,
  ExternalLink
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
  userName: initialName = 'Alex Rivera',
  userAvatar: initialAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  onUpdateProfile,
}) => {
  const [hapticsOn, setHapticsOn] = useState(true);
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(initialName);
  const [copiedEmail, setCopiedEmail] = useState(false);
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

  const handleCopyEmail = () => {
    const email = 'teekendrasingh00@gmail.com';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      iosFeedback('pop');
      showToast('Email address copied to clipboard!');
      setTimeout(() => setCopiedEmail(false), 2500);
    }
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
      <div className="mb-4">
        <h1 className="text-[22px] font-extrabold tracking-[-0.4px] text-white">
          Profile
        </h1>
      </div>

      {/* User Card with Photo Upload and Name Update */}
      <div
        className="p-5 rounded-[26px] bg-gradient-to-br from-[#7C5CFF]/20 via-white/[0.05] to-[#FFB020]/15 border border-white/12 shadow-xl mb-6 relative overflow-hidden"
        id="profile-card"
      >
        <div className="flex items-center gap-4">
          {/* Avatar with Camera Upload Trigger */}
          <div className="relative group shrink-0">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/25 shadow-lg bg-[#141418]">
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';
                }}
              />
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

            <p className="text-[12.5px] text-[#9A9AA4] truncate">teekendrasingh00@gmail.com</p>

            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block text-[10.5px] font-extrabold tracking-wide px-2.5 py-0.5 rounded-full bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/30">
                NOCTURNE 4K PREMIUM
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
          <span className="text-[12.5px] text-[#5C5C66] font-semibold">Saved</span>
        </div>

        {watchlist.length === 0 ? (
          <div className="p-8 rounded-[18px] bg-white/[0.03] border border-white/10 text-center text-[#5C5C66]">
            <p className="text-[13.5px]">Your watchlist is empty.</p>
            <p className="text-[11.5px] mt-1 text-[#5C5C66]">
              Tap the &ldquo;+&rdquo; button on any movie or series to save it here.
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
              <div className="text-[11.5px] text-[#5C5C66]">Vibration on taps & player controls</div>
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

          {/* Help & Support with teekendrasingh00@gmail.com */}
          <div className="p-4 bg-white/[0.02]" id="help-support-section">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-white mb-1">
                  Help & Support
                </div>
                <p className="text-[12px] text-[#9A9AA4] mb-2 leading-snug">
                  Kisi bhi samasya ya feedback ke liye support email par sampark karein:
                </p>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4 text-[#FFB020] shrink-0" />
                    <span className="text-[12.5px] font-mono text-[#F5F5F7] truncate font-medium">
                      teekendrasingh00@gmail.com
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleCopyEmail}
                      id="copy-support-email-btn"
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold text-white flex items-center gap-1 transition-all active:scale-95"
                      title="Copy Email"
                    >
                      {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href="mailto:teekendrasingh00@gmail.com?subject=Nocturne%20Cinema%20Support%20Query"
                      className="px-2.5 py-1 rounded-lg bg-[#FFB020] hover:bg-[#FFC043] text-[11px] font-bold text-black flex items-center gap-1 transition-all active:scale-95"
                      title="Send Email"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Email</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

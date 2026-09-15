import React, { useState, useMemo, useEffect } from 'react';
import { X, Play, Plus, Check, Film, Tv } from 'lucide-react';
import { MediaItem } from '../types';
import { getVerifiedSeasons } from '../services/api';
import { iosFeedback, motorVibrate } from '../services/iosFeedback';

interface DetailModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (item: MediaItem) => void;
  isSaved: boolean;
  onToggleWatchlist: (item: MediaItem) => void;
  allMedia?: MediaItem[];
  onSelectItem?: (item: MediaItem) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onPlay,
  isSaved,
  onToggleWatchlist,
  allMedia = [],
  onSelectItem,
}) => {
  const [selectedQuality, setSelectedQuality] = useState<'720p' | '1080p' | '4k'>('1080p');

  useEffect(() => {
    if (isOpen) {
      motorVibrate(32);
      iosFeedback('pop');
    }
  }, [isOpen]);

  const relatedSuggestions = useMemo(() => {
    if (!item || !allMedia.length) return [];
    const currentId = String(item.id);
    const itemGenres = item.genres || [];

    return allMedia
      .filter((m) => String(m.id) !== currentId)
      .sort((a, b) => {
        const aMatch = (a.genres || []).filter((g) => itemGenres.includes(g)).length;
        const bMatch = (b.genres || []).filter((g) => itemGenres.includes(g)).length;
        if (bMatch !== aMatch) return bMatch - aMatch;
        return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
      })
      .slice(0, 10);
  }, [item, allMedia]);

  const seriesSeasons = useMemo(() => {
    if (!item || item.type !== 'tv') return [];
    if (item.seasons && item.seasons.length > 0) return item.seasons;
    return getVerifiedSeasons(item.tmdb_id, item.imdb_id, item.title);
  }, [item]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="modal-container">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        id="modal-backdrop"
      />

      {/* Sheet Container */}
      <div
        className="absolute inset-x-0 bottom-0 max-w-xl mx-auto h-[88%] bg-[#0C0C0F] rounded-t-[32px] overflow-hidden border-t border-x border-white/15 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300"
        id="modal-sheet"
      >
        {/* iPhone Drag / Dismiss Handle */}
        <div
          onClick={() => {
            motorVibrate(25);
            iosFeedback('pop');
            onClose();
          }}
          className="w-full pt-2 pb-1 flex items-center justify-center cursor-pointer group active:scale-95 transition-transform shrink-0"
        >
          <div className="w-10 h-1 rounded-full bg-white/30 group-hover:bg-white/60 transition-colors shadow-sm" />
        </div>

        <div className="overflow-y-auto no-scrollbar flex-1 pb-10" id="modal-scroll-area">
          {/* Hero Banner */}
          <div className="relative w-full h-[300px] bg-[#141416]">
            <img
              src={item.poster || item.backdrop}
              alt={item.title}
              className="w-full h-full object-cover brightness-[1.03]"
              onError={(e) => {
                if (item.backdrop && e.currentTarget.src !== item.backdrop) {
                  e.currentTarget.src = item.backdrop;
                }
              }}
            />
            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-[#0C0C0F]/40 to-[#0C0C0F]" />

            {/* Close Button */}
            <button
              onClick={() => {
                motorVibrate(25);
                iosFeedback('pop');
                onClose();
              }}
              id="modal-close-btn"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform z-10"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Centered Play Button */}
            <button
              onClick={() => {
                motorVibrate([40, 30, 40]);
                iosFeedback('play');
                onPlay(item);
              }}
              id="modal-hero-play-btn"
              className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white active:scale-95 transition-transform shadow-xl hover:bg-white/30"
              aria-label="Play title"
            >
              <Play className="w-7 h-7 fill-white translate-x-0.5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="px-6 -mt-8 relative z-10">
            <h2 className="text-[26px] font-extrabold tracking-[-0.5px] text-[#F5F5F7] mb-2 leading-tight">
              {item.title}
            </h2>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#9A9AA4] mb-4">
              <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[11px] font-bold uppercase">
                {item.type === 'tv' ? 'Series' : 'Movie'}
              </span>
              <span>{item.year}</span>
              <span className="w-1 h-1 rounded-full bg-[#5C5C66]" />
              {item.runtime && (
                <>
                  <span>{item.runtime}</span>
                  <span className="w-1 h-1 rounded-full bg-[#5C5C66]" />
                </>
              )}
              <span className="text-[#FFB020] font-bold">★ {item.rating}</span>
              {(item.genres || []).length > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#5C5C66]" />
                  <span>{item.genres.slice(0, 3).join(' · ')}</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => {
                  motorVibrate([40, 30, 40]);
                  iosFeedback('play');
                  onPlay(item);
                }}
                id="modal-action-play"
                className="flex-1 py-3.5 px-5 rounded-[14px] font-bold text-[15px] bg-gradient-to-r from-white to-[#E4E4E8] text-[#0A0A0C] flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                Play Now
              </button>

              <button
                onClick={() => {
                  motorVibrate(26);
                  iosFeedback('tap');
                  onToggleWatchlist(item);
                }}
                id="modal-action-watchlist"
                className={`px-4 py-3.5 rounded-[14px] border font-bold flex items-center justify-center active:scale-95 transition-all backdrop-blur-md ${
                  isSaved
                    ? 'bg-[#FFB020]/20 border-[#FFB020]/40 text-[#FFB020]'
                    : 'bg-white/10 border-white/15 text-[#F5F5F7] hover:bg-white/15'
                }`}
                aria-label="Toggle Watchlist"
                title="Watchlist"
              >
                {isSaved ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>

            {/* TV Series Available Seasons Overview */}
            {item.type === 'tv' && seriesSeasons.length > 0 && (
              <div className="mb-6 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="text-[12px] font-bold uppercase tracking-wider text-[#9A9AA4] mb-2.5 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-[#FFB020]" />
                  Available Seasons ({seriesSeasons.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {seriesSeasons.map((s) => (
                    <div
                      key={s.seasonNumber}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-semibold text-white/90 flex items-center gap-1.5"
                    >
                      <span className="text-[#FFB020] font-bold">Season {s.seasonNumber}:</span>
                      <span>{s.episodeCount} Episodes</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Synopsis */}
            <p className="text-[14px] leading-[1.65] text-[#9A9AA4] mb-6">
              {item.plot || 'No synopsis provided for this title.'}
            </p>

            {/* Quality Selector */}
            <div className="mb-6">
              <h4 className="text-[15px] font-extrabold text-[#F5F5F7] mb-3">Stream Quality</h4>
              <div className="flex gap-2.5">
                {[
                  { id: '720p', label: '720p' },
                  { id: '1080p', label: '1080p HD' },
                  { id: '4k', label: '4K Ultra' }
                ].map((q) => {
                  const active = selectedQuality === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        motorVibrate(20);
                        iosFeedback('tap');
                        setSelectedQuality(q.id as any);
                      }}
                      className={`px-4 py-2 rounded-[12px] text-[13px] font-bold border transition-all ${
                        active
                          ? 'bg-[#FFB020]/15 border-[#FFB020]/40 text-[#FFB020]'
                          : 'bg-white/[0.06] border-white/12 text-[#9A9AA4] hover:text-white'
                      }`}
                    >
                      {q.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suggestions Selection */}
            {relatedSuggestions.length > 0 && (
              <div className="mb-4 pt-4 border-t border-white/10">
                <h4 className="text-[15px] font-extrabold text-[#F5F5F7] mb-3 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-[#FFB020]" />
                  More Like This
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {relatedSuggestions.map((sug) => (
                    <div
                      key={sug.id}
                      onClick={() => {
                        motorVibrate(32);
                        iosFeedback('pop');
                        if (onSelectItem) {
                          onSelectItem(sug);
                        } else {
                          onPlay(sug);
                        }
                      }}
                      className="shrink-0 w-28 cursor-pointer group"
                    >
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#18181D] border border-white/10 group-hover:border-[#FFB020]/50 transition-colors">
                        <img
                          src={sug.poster || sug.backdrop}
                          alt={sug.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-1 right-1 px-1 rounded bg-black/80 text-[9px] font-bold text-[#FFB020]">
                          ★ {sug.rating}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-white/90 line-clamp-1 mt-1 group-hover:text-[#FFB020]">
                        {sug.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

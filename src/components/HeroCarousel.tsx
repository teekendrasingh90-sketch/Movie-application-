import React, { useRef, useState, useEffect } from 'react';
import { Play, Plus, Check } from 'lucide-react';
import { MediaItem } from '../types';
import { iosFeedback, motorVibrate } from '../services/iosFeedback';

interface HeroCarouselProps {
  items: MediaItem[];
  onPlay: (item: MediaItem) => void;
  onOpenModal: (item: MediaItem) => void;
  onToggleWatchlist: (item: MediaItem) => void;
  watchlist: MediaItem[];
  onActiveIndexChange?: (index: number) => void;
  idPrefix?: string;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  items,
  onPlay,
  onOpenModal,
  onToggleWatchlist,
  watchlist,
  onActiveIndexChange,
  idPrefix = 'hero'
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let timeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const card = track.querySelector('.hero-card') as HTMLElement | null;
        const cardWidth = card ? card.offsetWidth : 340;
        const index = Math.round(track.scrollLeft / (cardWidth + 16));
        const clamped = Math.max(0, Math.min(items.length - 1, index));
        if (clamped !== activeIndex) {
          iosFeedback('slide');
          setActiveIndex(clamped);
          onActiveIndexChange?.(clamped);
        }
      }, 70);
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, [items, onActiveIndexChange, activeIndex]);

  if (!items.length) {
    return (
      <div className="px-5 py-8 text-center text-[#5C5C66]" id={`${idPrefix}-empty`}>
        <div className="w-8 h-8 mx-auto border-2 border-white/10 border-t-[#FFB020] rounded-full animate-spin-slow mb-3" />
        <p className="text-sm">Loading spotlight selections...</p>
      </div>
    );
  }

  const displayItems = items.slice(0, 16);

  return (
    <div className="relative py-4" id={`${idPrefix}-wrap`}>
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 pb-2 no-scrollbar"
        id={`${idPrefix}-track`}
      >
        {displayItems.map((m, idx) => {
          const isSaved = watchlist.some((w) => String(w.id) === String(m.id));
          const bannerImg = m.poster || m.backdrop;
          return (
            <div
              key={`${m.id}-${idx}`}
              id={`${idPrefix}-card-${m.id}`}
              onClick={() => {
                motorVibrate(32);
                iosFeedback('pop');
                onOpenModal(m);
              }}
              className="hero-card shrink-0 w-[min(353px,88vw)] h-[460px] snap-center relative rounded-[28px] overflow-hidden border border-white/12 cursor-pointer group select-none shadow-2xl shadow-black/40 bg-[#121216]"
            >
              {bannerImg ? (
                <img
                  src={bannerImg}
                  alt={m.title}
                  loading={idx < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={(e) => {
                    if (m.backdrop && e.currentTarget.src !== m.backdrop) {
                      e.currentTarget.src = m.backdrop;
                    }
                  }}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 brightness-[1.03] contrast-[1.02]"
                />
              ) : (
                <div className="w-full h-full bg-[#18181D] flex items-center justify-center text-white/30 text-sm">
                  {m.title}
                </div>
              )}

              {/* Light Scrim Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-[55%] to-[#08080A]/85 pointer-events-none" />

              {/* Card Content */}
              <div className="absolute left-5 right-5 bottom-5 z-10">
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {(m.genres || []).slice(0, 2).map((g) => (
                    <span
                      key={g}
                      className="text-[11px] font-bold tracking-[0.3px] px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#E0E0E6] shadow-sm"
                    >
                      {g}
                    </span>
                  ))}
                  <span className="text-[11px] font-bold tracking-[0.3px] px-2.5 py-1 rounded-full bg-[#FFB020]/20 backdrop-blur-md border border-[#FFB020]/40 text-[#FFB020] shadow-sm">
                    ★ {m.rating}
                  </span>
                </div>

                <h2 className="text-[25px] font-extrabold tracking-[-0.6px] leading-[1.1] mb-1 line-clamp-2 text-[#F5F5F7] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                  {m.title}
                </h2>

                <p className="text-[13px] text-[#C4C4CD] mb-3.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] font-medium">
                  {m.year} {m.runtime ? `· ${m.runtime}` : ''} · {m.type === 'tv' ? 'Series' : 'Movie'}
                </p>

                <div className="flex gap-2.5">
                  <button
                    id={`${idPrefix}-play-btn-${m.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      motorVibrate([40, 30, 40]);
                      iosFeedback('play');
                      onPlay(m);
                    }}
                    className="flex-1 py-3 px-4 rounded-[14px] font-bold text-[14.5px] bg-gradient-to-r from-white to-[#E4E4E8] text-[#0A0A0C] flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-black/30 hover:brightness-105"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Play
                  </button>

                  <button
                    id={`${idPrefix}-watch-btn-${m.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      motorVibrate(26);
                      iosFeedback('tap');
                      onToggleWatchlist(m);
                    }}
                    className={`px-3.5 py-3 rounded-[14px] border font-bold text-[14px] flex items-center justify-center active:scale-95 transition-all backdrop-blur-md ${
                      isSaved
                        ? 'bg-[#FFB020]/25 border-[#FFB020]/50 text-[#FFB020]'
                        : 'bg-black/30 border-white/20 text-[#F5F5F7] hover:bg-black/40'
                    }`}
                    aria-label={isSaved ? 'In Watchlist' : 'Add to Watchlist'}
                  >
                    {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center gap-1.5 justify-center mt-3" id={`${idPrefix}-dots`}>
        {displayItems.slice(0, 8).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === (activeIndex >= 8 ? 7 : activeIndex) ? 'w-[18px] bg-[#FFB020]' : 'w-1.5 bg-[#5C5C66]/50'
            }`}
          />
        ))}
        {displayItems.length > 8 && (
          <span className="text-[11px] text-[#9A9AA4] ml-2 font-semibold">
            {activeIndex + 1}/{displayItems.length}
          </span>
        )}
      </div>
    </div>
  );
};

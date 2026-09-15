import React from 'react';
import { Play } from 'lucide-react';
import { MediaItem } from '../types';
import { iosFeedback, motorVibrate } from '../services/iosFeedback';

interface ContinueWatchingRailProps {
  items: MediaItem[];
  onOpenModal: (item: MediaItem) => void;
  onPlay?: (item: MediaItem) => void;
  idPrefix: string;
}

export const ContinueWatchingRail: React.FC<ContinueWatchingRailProps> = ({
  items,
  onOpenModal,
  onPlay,
  idPrefix
}) => {
  return (
    <section className="pt-6" id={`section-${idPrefix}`}>
      <div className="flex items-baseline justify-between px-5 mb-3">
        <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#F5F5F7]">
          Continue Watching
        </h3>
        <span className="text-[12.5px] text-[#5C5C66] font-semibold">See all</span>
      </div>

      <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar" id={`rail-${idPrefix}`}>
        {items.length === 0 ? (
          <div className="py-3 text-[#5C5C66] text-[13px] px-1">
            Nothing here yet. Start streaming to build your history!
          </div>
        ) : (
          items.map((m, idx) => {
            const progress = m.progress || 35;
            return (
              <div
                key={`${m.id}-${idx}`}
                id={`${idPrefix}-item-${m.id}`}
                onClick={() => {
                  motorVibrate(32);
                  iosFeedback('pop');
                  onOpenModal(m);
                }}
                className="shrink-0 w-[220px] cursor-pointer group select-none active:scale-95 transition-transform duration-150"
              >
                <div className="w-[220px] h-[124px] rounded-[12px] overflow-hidden relative border border-white/12 bg-[#141416] shadow-md">
                  <img
                    src={m.backdrop || m.poster}
                    alt={m.title}
                    loading="lazy"
                    onError={(e) => {
                      if (m.poster && e.currentTarget.src !== m.poster) {
                        e.currentTarget.src = m.poster;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Play Icon overlay */}
                  <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        if (onPlay) {
                          e.stopPropagation();
                          motorVibrate([40, 30, 40]);
                          iosFeedback('play');
                          onPlay(m);
                        }
                      }}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 flex items-center justify-center text-white active:scale-90 transition-transform"
                      aria-label={`Play ${m.title}`}
                    >
                      <Play className="w-5 h-5 fill-white translate-x-0.5" />
                    </button>
                  </div>
                  {/* Progress Bar */}
                  <div className="absolute left-0 right-0 bottom-0 h-1 bg-white/20">
                    <div
                      className="h-full bg-[#FFB020]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="text-[13px] font-semibold mt-2 text-[#F5F5F7] truncate">
                  {m.title}
                </div>
                <div className="text-[11px] text-[#5C5C66] mt-0.5">
                  {progress}% watched
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

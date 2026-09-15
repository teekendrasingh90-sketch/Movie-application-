import React from 'react';
import { MediaItem } from '../types';
import { iosFeedback, motorVibrate } from '../services/iosFeedback';

interface PosterRailProps {
  title: string;
  items: MediaItem[];
  onOpenModal: (item: MediaItem) => void;
  idPrefix: string;
  actionText?: string;
  onActionClick?: () => void;
}

export const PosterRail: React.FC<PosterRailProps> = ({
  title,
  items,
  onOpenModal,
  idPrefix,
  actionText = 'See all',
  onActionClick
}) => {
  return (
    <section className="pt-6" id={`section-${idPrefix}`}>
      <div className="flex items-baseline justify-between px-5 mb-3" id={`head-${idPrefix}`}>
        <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#F5F5F7]">
          {title}
        </h3>
        {actionText && (
          <button
            onClick={() => {
              motorVibrate(22);
              iosFeedback('tap');
              onActionClick?.();
            }}
            className="text-[12.5px] text-[#5C5C66] hover:text-[#9A9AA4] font-semibold transition-colors"
          >
            {actionText}
          </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar" id={`rail-${idPrefix}`}>
        {items.length === 0 ? (
          <div className="py-4 text-[#5C5C66] text-[13px]">No items available</div>
        ) : (
          items.map((m, idx) => (
            <div
              key={`${m.id}-${idx}`}
              id={`${idPrefix}-poster-${m.id}`}
              onClick={() => {
                motorVibrate(32);
                iosFeedback('pop');
                onOpenModal(m);
              }}
              className="shrink-0 w-[118px] cursor-pointer group select-none active:scale-95 transition-transform duration-150"
            >
              <div className="w-[118px] h-[177px] rounded-[12px] overflow-hidden relative border border-white/12 bg-[#141416] aspect-[2/3] shadow-md">
                <img
                  src={m.poster}
                  alt={m.title}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80';
                  }}
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="text-[12.5px] font-semibold mt-2 text-[#F5F5F7] truncate leading-tight">
                {m.title}
              </div>
              <div className="text-[11px] text-[#5C5C66] mt-0.5">
                {m.year} {m.rating && m.rating !== '–' ? `· ★ ${m.rating}` : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

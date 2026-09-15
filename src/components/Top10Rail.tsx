import React from 'react';
import { MediaItem } from '../types';
import { iosFeedback, motorVibrate } from '../services/iosFeedback';

interface Top10RailProps {
  items: MediaItem[];
  onOpenModal: (item: MediaItem) => void;
  idPrefix: string;
}

export const Top10Rail: React.FC<Top10RailProps> = ({ items, onOpenModal, idPrefix }) => {
  const top10 = items.slice(0, 10);

  return (
    <section className="pt-6" id={`section-${idPrefix}`}>
      <div className="flex items-baseline justify-between px-5 mb-3">
        <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#F5F5F7]">
          Top 10 Today
        </h3>
        <span className="text-[12.5px] text-[#5C5C66] font-semibold">See all</span>
      </div>

      <div className="flex gap-4 overflow-x-auto px-5 pb-2 no-scrollbar" id={`rail-${idPrefix}`}>
        {top10.map((m, idx) => (
          <div
            key={`${m.id}-${idx}`}
            id={`${idPrefix}-rank-${idx + 1}`}
            onClick={() => {
              motorVibrate(32);
              iosFeedback('pop');
              onOpenModal(m);
            }}
            className="shrink-0 flex items-end w-[150px] relative cursor-pointer active:scale-95 transition-transform duration-150 select-none"
          >
            {/* Outline Rank Number */}
            <div className="text-[74px] font-black leading-[0.75] tracking-[-4px] text-stroke-rank -mr-[26px] z-0 select-none">
              {idx + 1}
            </div>

            {/* Poster Card */}
            <div className="w-[100px] h-[150px] rounded-[12px] overflow-hidden z-10 border border-white/12 bg-[#141416] shadow-lg shadow-black/50 aspect-[2/3]">
              <img
                src={m.poster}
                alt={m.title}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80';
                }}
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

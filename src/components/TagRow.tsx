import React from 'react';
import { iosFeedback } from '../services/iosFeedback';

interface TagRowProps {
  tags: string[];
  selectedTag: string;
  onSelectTag: (tag: string) => void;
  idPrefix?: string;
}

export const TagRow: React.FC<TagRowProps> = ({ tags, selectedTag, onSelectTag, idPrefix = 'tag' }) => {
  const handleClick = (tag: string) => {
    iosFeedback('tap');
    onSelectTag(tag);
  };

  return (
    <div className="flex gap-2 overflow-x-auto px-5 py-3.5 no-scrollbar select-none" id={`${idPrefix}-row`}>
      {tags.map((tag) => {
        const isActive = selectedTag === tag;
        return (
          <button
            key={tag}
            id={`${idPrefix}-${tag.toLowerCase()}`}
            onClick={() => handleClick(tag)}
            className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 active:scale-95 whitespace-nowrap ${
              isActive
                ? 'bg-gradient-to-r from-[#FFB020] to-[#FF7A1A] text-[#1A0E00] font-bold shadow-md shadow-[#FFB020]/20 scale-105'
                : 'bg-white/[0.06] border border-white/12 text-[#9A9AA4] hover:text-[#F5F5F7]'
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
};

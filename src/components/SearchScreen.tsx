import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Play, ChevronLeft } from 'lucide-react';
import { MediaItem } from '../types';
import { TagRow } from './TagRow';
import { API_BASE, TVMAZE_BASE, normalizeMovie, normalizeShow, fetchJSON, FALLBACK_MOVIES, FALLBACK_TV } from '../services/api';
import { iosFeedback, motorVibrate } from '../services/iosFeedback';

const GENRES = ['Trending', 'Indian', 'Action', 'Drama', 'Comedy', 'Thriller', 'Romance', 'Horror'];

interface SearchScreenProps {
  onOpenModal: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
  allPool: MediaItem[];
  onBack?: () => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onOpenModal, onPlay, allPool, onBack }) => {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('Trending');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus search input smoothly on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const searchDebounce = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      // If no query, show genre filtered or trending from pool
      if (selectedTag === 'Trending') {
        setResults(allPool.slice(0, 15));
      } else if (selectedTag === 'Indian') {
        const keys = ['india', 'hindi', 'mirzapur', 'rrr', 'dangal', 'family', 'pathaan', 'jawan'];
        const matched = allPool.filter((m) =>
          keys.some((k) => (m.title + ' ' + (m.plot || '')).toLowerCase().includes(k))
        );
        setResults(matched.length ? matched : allPool.slice(0, 10));
      } else {
        const matched = allPool.filter((m) =>
          (m.genres || []).some((g) => g.toLowerCase().includes(selectedTag.toLowerCase()))
        );
        setResults(matched.length ? matched : allPool.slice(0, 10));
      }
      setIsLoading(false);
      return;
    }

    if (query.trim().length < 2) {
      return;
    }

    setIsLoading(true);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);

    searchDebounce.current = setTimeout(async () => {
      try {
        const q = query.trim();
        const [movieRes, tvRes] = await Promise.allSettled([
          fetchJSON(`${API_BASE}/list_movies.json?query_term=${encodeURIComponent(q)}&limit=15`),
          fetchJSON(`${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(q)}`),
        ]);

        let foundMovies: MediaItem[] = [];
        let foundShows: MediaItem[] = [];

        if (movieRes.status === 'fulfilled' && movieRes.value?.data?.movies) {
          foundMovies = movieRes.value.data.movies.map(normalizeMovie).filter((m: MediaItem) => m.poster);
        }
        if (tvRes.status === 'fulfilled' && Array.isArray(tvRes.value)) {
          foundShows = tvRes.value.map(normalizeShow).filter((s: MediaItem) => s.poster);
        }

        let combined = [...foundMovies, ...foundShows];

        // Also check local pool in case offline or api limit
        const localMatches = allPool.filter((m) =>
          m.title.toLowerCase().includes(q.toLowerCase()) ||
          (m.plot && m.plot.toLowerCase().includes(q.toLowerCase()))
        );

        localMatches.forEach((lm) => {
          if (!combined.some((c) => String(c.id) === String(lm.id))) {
            combined.push(lm);
          }
        });

        if (!combined.length) {
          // Check fallback pools
          const fallbackMatches = [...FALLBACK_MOVIES, ...FALLBACK_TV].filter((m) =>
            m.title.toLowerCase().includes(q.toLowerCase())
          );
          combined = fallbackMatches;
        }

        setResults(combined);
      } catch (err) {
        console.error('Search query failed:', err);
        // Fallback local search
        const fallback = allPool.filter((m) =>
          m.title.toLowerCase().includes(query.toLowerCase())
        );
        setResults(fallback);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [query, selectedTag, allPool]);

  return (
    <div className="pb-28 pt-4 px-4 sm:px-5 max-w-xl mx-auto w-full flex-1" id="screen-search">
      {/* Header with Back button and search input */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          {onBack && (
            <button
              onClick={() => {
                motorVibrate(25);
                iosFeedback('pop');
                onBack();
              }}
              id="search-back-btn"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white transition-all shrink-0"
              title="Back to Home"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-[22px] font-extrabold tracking-[-0.4px] text-white">
            Search
          </h1>
        </div>

        <div className="relative flex items-center bg-white/[0.06] backdrop-blur-xl border border-white/12 rounded-[18px] px-4 py-3 shadow-md">
          <SearchIcon className="w-[18px] h-[18px] text-[#9A9AA4] shrink-0 mr-2.5" />
          <input
            ref={inputRef}
            id="searchInput"
            type="search"
            value={query}
            onChange={(e) => {
              motorVibrate(15);
              setQuery(e.target.value);
            }}
            placeholder="Search movies, series, stars..."
            className="flex-1 bg-transparent border-none outline-none text-[#F5F5F7] text-[16px] placeholder:text-[#5C5C66]"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => {
                motorVibrate(24);
                iosFeedback('tap');
                setQuery('');
              }}
              className="p-1 rounded-full text-[#9A9AA4] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Genre Tags */}
      <div className="-mx-5 mb-3">
        <TagRow
          tags={GENRES}
          selectedTag={selectedTag}
          onSelectTag={(tag) => {
            motorVibrate(20);
            setSelectedTag(tag);
            if (!query) {
              setQuery('');
            }
          }}
          idPrefix="search-tag"
        />
      </div>

      {/* Results Container */}
      <div className="mt-2" id="searchResults">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#5C5C66]">
            <div className="w-7 h-7 border-2 border-white/10 border-t-[#FFB020] rounded-full animate-spin-slow mb-3" />
            <span className="text-xs">Searching streaming sources...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 px-6 text-[#5C5C66]">
            <SearchIcon className="w-11 h-11 mx-auto mb-3 opacity-40 stroke-[1.5]" />
            <p className="text-[14px] leading-relaxed">
              No titles found for &ldquo;{query}&rdquo;.<br />
              Try searching <span className="text-[#9A9AA4] font-semibold">&ldquo;Mirzapur&rdquo;, &ldquo;Avengers&rdquo;, or &ldquo;Dangal&rdquo;</span>.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {results.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => {
                  motorVibrate(32);
                  iosFeedback('pop');
                  onOpenModal(item);
                }}
                className="flex items-center gap-3.5 py-3 cursor-pointer group active:scale-[0.99] transition-transform"
                id={`search-row-${item.id}`}
              >
                {/* Thumbnail */}
                <div className="w-[52px] h-[78px] rounded-[10px] overflow-hidden bg-[#1A1A1E] border border-white/10 shrink-0 aspect-[2/3]">
                  <img
                    src={item.poster}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80';
                    }}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14.5px] font-bold text-[#F5F5F7] truncate mb-0.5 group-hover:text-[#FFB020] transition-colors">
                    {item.title}
                  </h4>
                  <div className="text-[12px] text-[#9A9AA4] truncate flex items-center gap-1.5">
                    <span className="capitalize">{item.type === 'tv' ? 'Series' : 'Movie'}</span>
                    {item.year && <span>· {item.year}</span>}
                    {(item.genres || []).length > 0 && (
                      <span>· {item.genres.slice(0, 2).join(', ')}</span>
                    )}
                    {item.rating && item.rating !== '–' && (
                      <span className="text-[#FFB020] font-semibold">· ★ {item.rating}</span>
                    )}
                  </div>
                </div>

                {/* Instant Play button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    motorVibrate([40, 30, 40]);
                    iosFeedback('play');
                    onPlay(item);
                  }}
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white active:scale-90 transition-transform shrink-0 hover:bg-white/20"
                  title="Play"
                >
                  <Play className="w-4 h-4 fill-white translate-x-0.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

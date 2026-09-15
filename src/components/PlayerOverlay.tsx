import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  Check,
  Plus,
  Share2,
  Play,
  Pause,
  SkipForward,
  FastForward,
  Tv
} from 'lucide-react';
import { MediaItem, SeasonInfo } from '../types';
import { getStreamEmbedUrl, resolveTVId, resolveMovieId, fetchShowDetailsWithEpisodes, getVerifiedSeasons } from '../services/api';
import { sendCineSRCCommand } from '../services/cinesrc';
import { iosFeedback, motorVibrate } from '../services/iosFeedback';

interface PlayerOverlayProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  watchlist?: MediaItem[];
  onToggleWatchlist?: (item: MediaItem) => void;
  allMedia?: MediaItem[];
  onSelectItem?: (item: MediaItem) => void;
}

export const PlayerOverlay: React.FC<PlayerOverlayProps> = ({
  item,
  isOpen,
  onClose,
  watchlist = [],
  onToggleWatchlist,
  allMedia = [],
  onSelectItem,
}) => {
  // CineSRC Player state
  const [season, setSeason] = useState<number>(1);
  const [episode, setEpisode] = useState<number>(1);
  
  // Real-time player playback state updated via cinesrc postMessage
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [activeSource, setActiveSource] = useState<string>('');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Screen layout, orientation & YouTube-style fullscreen
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isRotatedLandscape, setIsRotatedLandscape] = useState<boolean>(false);
  const [showFloatingControls, setShowFloatingControls] = useState<boolean>(false);
  const [gestureHint, setGestureHint] = useState<string | null>(null);
  const [isDeviceLandscape, setIsDeviceLandscape] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false;
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'movie' | 'tv'>('all');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const floatingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsScrollRef = useRef<HTMLDivElement>(null);

  // Play entry feedback when opening player
  useEffect(() => {
    if (isOpen) {
      iosFeedback('play');
    }
  }, [isOpen]);

  const slideSuggestions = (direction: 'left' | 'right') => {
    if (suggestionsScrollRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      suggestionsScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      iosFeedback('slide');
    }
  };

  // Track physical device orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsDeviceLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Sync state with native browser fullscreen / ESC key
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs) {
        setIsRotatedLandscape(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Dynamic TV series seasons and episodes state
  const [seasonsData, setSeasonsData] = useState<SeasonInfo[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);

  // Reset states when item changes or modal opens
  useEffect(() => {
    if (isOpen && item) {
      setIsRotatedLandscape(false);
      setSeason(1);
      setEpisode(1);
      setIsPlayerReady(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setActiveSource('');

      if (item.type === 'tv') {
        // First set initial seasons from item.seasons or verified catalog
        const initial = (item.seasons && item.seasons.length > 0)
          ? item.seasons
          : getVerifiedSeasons(item.tmdb_id, item.imdb_id, item.title);
        setSeasonsData(initial);

        // Fetch live episode details from TVMaze / TMDB to guarantee 100% exact seasons & episodes
        setIsLoadingEpisodes(true);
        fetchShowDetailsWithEpisodes(item)
          .then((live) => {
            if (live && live.length > 0) {
              setSeasonsData(live);
            }
          })
          .catch(() => {
            // Keep verified catalog data
          })
          .finally(() => {
            setIsLoadingEpisodes(false);
          });
      } else {
        setSeasonsData([]);
      }
    }
  }, [isOpen, item?.id]);

  const isTV = item?.type === 'tv';
  const isSaved = item ? watchlist.some((w) => String(w.id) === String(item.id)) : false;

  // Resolve TMDB code cleanly
  const resolvedCode = useMemo(() => {
    if (!item) return '';
    if (isTV) {
      const code = resolveTVId(item.imdb_id, item.tmdb_id, item.title);
      return code.replace(/\D/g, '') || '79744';
    }
    // Movie TMDB resolution with guaranteed pure digits and fallback to user-specified 1084242
    const code = resolveMovieId(item.imdb_id, item.tmdb_id, item.title);
    return code.replace(/\D/g, '') || '1084242';
  }, [item, isTV]);

  // Compute active CineSRC stream URL strictly separating movie vs TV
  const embedUrl = useMemo(() => {
    if (!item) return '';
    if (!isTV) {
      // Movie embed URL strictly following user's URL pattern: cinesrc.st/embed/movie/{id}
      const movieId = resolvedCode || '1084242';
      return `https://cinesrc.st/embed/movie/${movieId}?color=%23FFB020&back=close`;
    }

    // TV Series stream URL (left completely untouched: "TV shows already connected Ho chuke hain unmen Koi chhedchhad nahin karni hai")
    return getStreamEmbedUrl('cinesrc', {
      imdbId: item.imdb_id,
      tmdbId: resolvedCode,
      title: item.title,
      isTV: true,
      season,
      episode,
      seek: 10,
      autoplay: true,
      color: '#FFB020',
      back: 'close',
      autonext: true,
      autoskip: true,
    });
  }, [item, isTV, resolvedCode, season, episode]);

  // CineSRC postMessage Event Listener Setup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin strictly per CineSRC documentation
      if (event.origin !== 'https://cinesrc.st') return;

      const { type, ...data } = event.data || {};
      if (!type) return;

      switch (type) {
        case 'cinesrc:ready':
          setIsPlayerReady(true);
          break;
        case 'cinesrc:play':
          setIsPlaying(true);
          break;
        case 'cinesrc:pause':
          setIsPlaying(false);
          break;
        case 'cinesrc:timeupdate':
          if (typeof data.currentTime === 'number') setCurrentTime(data.currentTime);
          if (typeof data.duration === 'number') setDuration(data.duration);
          break;
        case 'cinesrc:loadedmetadata':
          if (typeof data.duration === 'number') setDuration(data.duration);
          break;
        case 'cinesrc:nextepisode':
          // CineSRC documentation:
          // Episode changed inside player. Sources: button, up-next, auto, episode-selector
          // Do not replace iframe if internalNavigation is true
          if (typeof data.season === 'number') setSeason(data.season);
          if (typeof data.episode === 'number') setEpisode(data.episode);
          break;
        case 'cinesrc:sourceused':
          if (data.sourceId) setActiveSource(String(data.sourceId));
          break;
        case 'cinesrc:ratechange':
          if (typeof data.playbackRate === 'number') setPlaybackSpeed(data.playbackRate);
          break;
        case 'cinesrc:close':
          // Back button inside player clicked with ?back=close
          handleBack();
          break;
        case 'cinesrc:error':
          console.warn('CineSRC Player Error:', data.error);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isRotatedLandscape, onClose]);

  // Programmatic commands via postMessage
  const handlePlayToggle = () => {
    iosFeedback('play');
    if (isPlaying) {
      sendCineSRCCommand(iframeRef.current, 'pause');
    } else {
      sendCineSRCCommand(iframeRef.current, 'play');
    }
  };

  const handleSeek = (secondsOffset: number) => {
    iosFeedback('tap');
    const target = Math.max(0, Math.min(currentTime + secondsOffset, duration || 99999));
    sendCineSRCCommand(iframeRef.current, 'seek', [target]);
  };

  const handleSetSpeed = (rate: number) => {
    iosFeedback('tap');
    sendCineSRCCommand(iframeRef.current, 'setPlaybackRate', [rate]);
    setPlaybackSpeed(rate);
  };

  // Change episode for TV Show
  const handleSelectEpisode = (ep: number) => {
    iosFeedback('tap');
    setEpisode(ep);
  };

  const handleSelectSeason = (s: number) => {
    iosFeedback('tap');
    setSeason(s);
    setEpisode(1);
  };

  // Compute exact available seasons and episodes strictly for this web series
  const currentSeasonData = useMemo(() => {
    if (!seasonsData || seasonsData.length === 0) return null;
    return seasonsData.find((s) => s.seasonNumber === season) || seasonsData[0];
  }, [seasonsData, season]);

  const maxEpisodesForCurrentSeason = useMemo(() => {
    if (currentSeasonData) {
      return currentSeasonData.episodeCount || (currentSeasonData.episodes ? currentSeasonData.episodes.length : 8);
    }
    return 8;
  }, [currentSeasonData]);

  // Ensure current episode does not exceed maximum available episodes when season changes
  useEffect(() => {
    if (maxEpisodesForCurrentSeason && episode > maxEpisodesForCurrentSeason) {
      setEpisode(1);
    }
  }, [maxEpisodesForCurrentSeason, episode]);

  // Related suggestions / selection
  const suggestions = useMemo(() => {
    if (!item || !allMedia.length) return [];
    const currentId = String(item.id);
    const itemGenres = item.genres || [];

    const otherItems = allMedia.filter((m) => String(m.id) !== currentId);

    const filtered = otherItems.filter((m) => {
      if (suggestionFilter === 'all') return true;
      return m.type === suggestionFilter;
    });

    return filtered
      .sort((a, b) => {
        const aOverlap = (a.genres || []).filter((g) => itemGenres.includes(g)).length;
        const bOverlap = (b.genres || []).filter((g) => itemGenres.includes(g)).length;
        if (bOverlap !== aOverlap) return bOverlap - aOverlap;
        return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
      })
      .slice(0, 16);
  }, [item, allMedia, suggestionFilter]);

  // Screen Rotate & Fullscreen logic
  const handleRotateToggle = async () => {
    if (!isRotatedLandscape) {
      setIsRotatedLandscape(true);
      setGestureHint('Screen Rotated (Landscape)');
      setTimeout(() => setGestureHint(null), 2000);
      try {
        if (screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as any).lock('landscape').catch(() => {});
        }
      } catch {}
    } else {
      handleExitRotate();
    }
  };

  const handleExitRotate = () => {
    setIsRotatedLandscape(false);
    setIsFullscreen(false);
    setGestureHint('Screen Portrait');
    setTimeout(() => setGestureHint(null), 2000);
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
      if (screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock();
      }
    } catch {}
  };

  const enterFullscreen = async () => {
    setIsFullscreen(true);
    setGestureHint('Full Screen (Badi Screen)');
    setTimeout(() => setGestureHint(null), 2200);

    try {
      const elem = containerRef.current;
      if (elem) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen().catch(() => {});
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen().catch(() => {});
        }
      }
      if (screen.orientation && 'lock' in screen.orientation) {
        await (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch {}
  };

  const exitFullscreen = async () => {
    setIsFullscreen(false);
    setIsRotatedLandscape(false);
    setGestureHint('Normal Screen (Chhoti Screen)');
    setTimeout(() => setGestureHint(null), 2000);

    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen().catch(() => {});
        }
      }
      if (screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock();
      }
    } catch {}
  };

  const handleToggleFullscreen = () => {
    if (isFullscreen || isRotatedLandscape) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  const triggerFloatingControls = () => {
    setShowFloatingControls(true);
    if (floatingTimerRef.current) clearTimeout(floatingTimerRef.current);
    floatingTimerRef.current = setTimeout(() => {
      setShowFloatingControls(false);
    }, 3000);
  };

  // YouTube-style touch swipe handlers (Slide up = Badi screen, Slide down = Chhoti screen)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    triggerFloatingControls();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;

    // Dominant vertical gesture check
    if (Math.abs(deltaY) > 35 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY < -35) {
        // Slid UP -> Badi Screen (Full Screen)
        if (!isFullscreen && !isRotatedLandscape) {
          enterFullscreen();
        }
      } else if (deltaY > 35) {
        // Slid DOWN -> Chhoti Screen (Exit Full Screen / Close)
        if (isFullscreen || isRotatedLandscape) {
          exitFullscreen();
        } else {
          onClose();
        }
      }
    }
  };

  const handleBack = () => {
    iosFeedback('pop');
    if (isFullscreen || isRotatedLandscape) {
      exitFullscreen();
    } else {
      onClose();
    }
  };

  const handleShare = async () => {
    iosFeedback('tap');
    if (!item) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Watch ${item.title} on Nocturne Cinema`,
          url: window.location.href,
        });
        return;
      } catch {}
    }
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper formatting for seconds to MM:SS
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen || !item) return null;

  return (
    <div
      ref={containerRef}
      id="player-overlay"
      className={`fixed z-[100] bg-black flex flex-col text-white transition-all duration-300 animate-in slide-in-from-bottom duration-300 ease-out ${
        isRotatedLandscape
          ? '!inset-0 !top-0 !left-[100vw] !w-[100vh] !h-[100vw] origin-top-left rotate-90 overflow-hidden z-[9999]'
          : isFullscreen
          ? 'inset-0 w-screen h-screen overflow-hidden z-[9999]'
          : 'inset-0 w-full h-full'
      }`}
      onMouseMove={triggerFloatingControls}
    >
      {/* iPhone Pull-Down Bar & Top Header */}
      {!isFullscreen && !isRotatedLandscape && (
        <div className="bg-[#0A0A0C]/95 border-b border-white/10 shrink-0 z-20 backdrop-blur-md">
          {/* Authentic iPhone Drag / Dismiss Pill */}
          <div
            onClick={handleBack}
            className="w-full pt-2 pb-1 flex items-center justify-center cursor-pointer group active:scale-95 transition-transform"
            title="Slide Down to Close"
          >
            <div className="w-10 h-1 rounded-full bg-white/30 group-hover:bg-white/60 transition-colors shadow-sm" />
          </div>

          <div
            className="flex items-center gap-3 px-4 pb-2.5 pt-0.5"
            id="player-header"
          >
            <button
              onClick={handleBack}
              id="player-back-btn"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white active:scale-95 transition-all shrink-0"
              title="Close Player"
              aria-label="Close Player"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-white truncate" id="player-title">
                  {item.title} {isTV ? `· S${season} E${episode}` : ''}
                </h2>
              </div>
              <div className="text-[11px] text-[#9A9AA4] flex items-center gap-1.5 truncate">
                <span>{isTV ? 'TV Series' : 'Movie'}</span>
                {item.year && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[#5C5C66]" />
                    <span>{item.year}</span>
                  </>
                )}
                {item.rating && item.rating !== '–' && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[#5C5C66]" />
                    <span className="text-[#FFB020] font-medium">★ {item.rating}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Container Area with CineSRC iframe */}
      <div
        ref={videoWrapRef}
        id="player-video-wrap"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full bg-black shrink-0 select-none overflow-hidden ${
          isFullscreen || isRotatedLandscape || isDeviceLandscape
            ? 'flex-1 h-full w-full'
            : 'aspect-video max-h-[55vh] min-h-[250px]'
        }`}
      >
        {embedUrl ? (
          <iframe
            ref={iframeRef}
            key={`${item.id}-${resolvedCode}-${season}-${episode}`}
            src={embedUrl}
            title={item.title}
            className="w-full h-full border-0 absolute inset-0 bg-black"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center text-[#9A9AA4]">
            <p className="text-sm font-semibold mb-1 text-white">Stream Loading...</p>
            <p className="text-xs max-w-xs text-[#5C5C66]">
              Connecting to stream for &ldquo;{item.title}&rdquo;.
            </p>
          </div>
        )}

        {/* Gesture Hint Toast */}
        {gestureHint && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-fadeIn">
            <span>{gestureHint}</span>
          </div>
        )}

        {/* Rotated Landscape Mode: Floating Exit Button to return to Portrait */}
        {isRotatedLandscape && (
          <div className="absolute top-4 right-4 z-40 flex items-center gap-2 pointer-events-auto">
            <button
              onClick={handleExitRotate}
              id="screen-rotate-exit-btn"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/80 hover:bg-black text-[#FFB020] backdrop-blur-md border border-[#FFB020]/40 text-xs font-bold shadow-2xl active:scale-95 transition-all"
              title="Portrait Mode"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Portrait</span>
            </button>
          </div>
        )}

        {/* Fullscreen Mode Controls */}
        {isFullscreen && !isRotatedLandscape && showFloatingControls && (
          <div className="absolute top-4 right-4 z-40 flex items-center gap-2 pointer-events-auto transition-opacity duration-300">
            <button
              onClick={exitFullscreen}
              id="fullscreen-exit-btn"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/75 hover:bg-black/90 text-white backdrop-blur-md border border-white/25 text-xs font-bold shadow-2xl active:scale-95 transition-all"
              title="Chhoti Screen"
            >
              <Minimize2 className="w-3.5 h-3.5 text-[#FFB020]" />
              <span>Chhoti Screen</span>
            </button>
          </div>
        )}

        {/* Portrait Mode: Rotate Screen Button on Top-Right */}
        {!isFullscreen && !isRotatedLandscape && (
          <div
            className="absolute top-3 right-3 z-30 pointer-events-auto flex items-center gap-2"
            id="player-fullscreen-control"
          >
            <button
              onClick={handleRotateToggle}
              id="screen-rotate-toggle-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-bold shadow-lg active:scale-90 transition-all bg-black/65 hover:bg-black/85 text-white border-white/20"
              title="Rotate Screen"
              aria-label="Rotate Screen"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#FFB020]" />
              <span>Rotate Screen</span>
            </button>
          </div>
        )}
      </div>

      {/* YouTube-Style Slide Handle (Slide up for Badi Screen, slide down to minimize) */}
      {!isFullscreen && !isRotatedLandscape && (
        <div
          onClick={enterFullscreen}
          className="w-full py-1.5 px-4 flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.07] active:bg-white/[0.1] border-b border-white/5 cursor-pointer text-[11px] text-[#A0A0AA] transition-colors select-none"
          title="Slide up or click for Full Screen"
        >
          <div className="flex items-center gap-1.5 font-medium">
            <ChevronUp className="w-3.5 h-3.5 text-[#FFB020] animate-bounce" />
            <span>Slide up for Badi Screen (Full Screen)</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Slide up / down</span>
        </div>
      )}

      {/* Details & Interactive Controls Scroll Area */}
      {!isFullscreen && !isRotatedLandscape && (
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 no-scrollbar bg-[#0A0A0C]" id="player-details">
          {/* Title and Metadata */}
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h2 className="text-[22px] font-extrabold text-[#F5F5F7] tracking-[-0.4px]">
              {item.title}
            </h2>
            {isTV && (
              <span className="px-2.5 py-1 rounded-lg bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/35 text-xs font-bold shrink-0">
                S{season} · E{episode}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-[#9A9AA4] mb-4">
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[11px] font-bold uppercase tracking-wider">
              {isTV ? 'TV SERIES' : 'MOVIE'}
            </span>
            <span>{item.year}</span>
            {item.runtime && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#5C5C66]" />
                <span>{item.runtime}</span>
              </>
            )}
            {item.rating && item.rating !== '–' && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#5C5C66]" />
                <span className="text-[#FFB020] font-bold">★ {item.rating}</span>
              </>
            )}
            {(item.genres || []).length > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#5C5C66]" />
                <span>{item.genres.slice(0, 3).join(' · ')}</span>
              </>
            )}
          </div>

          {/* Player Quick Controls Toolbar (PostMessage synced controls) */}
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 mb-5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayToggle}
                className="w-8 h-8 rounded-full bg-[#FFB020] hover:bg-[#FFB020]/90 text-black flex items-center justify-center font-bold active:scale-95 transition-transform"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black translate-x-0.5" />}
              </button>

              <button
                onClick={() => handleSeek(-10)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-300 flex items-center gap-1 active:scale-95"
                title="Seek back 10s"
              >
                -10s
              </button>

              <button
                onClick={() => handleSeek(10)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-300 flex items-center gap-1 active:scale-95"
                title="Seek forward 10s"
              >
                +10s
              </button>

              {duration > 0 && (
                <span className="text-[11.5px] font-mono text-[#9A9AA4] ml-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              )}
            </div>

            {/* Playback speed selector */}
            <div className="flex items-center gap-1">
              {[1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleSetSpeed(rate)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                    playbackSpeed === rate
                      ? 'bg-white/20 text-white border border-white/25'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* TV Season & Episode Navigation (Only show available seasons & episodes) */}
          {isTV && (
            <div className="mb-5 p-4 rounded-[20px] bg-white/[0.04] border border-white/10" id="tv-season-episode-nav">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#9A9AA4] flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-[#FFB020]" />
                  Available Seasons & Episodes ({seasonsData.length} {seasonsData.length === 1 ? 'Season' : 'Seasons'})
                </span>
                <div className="flex items-center gap-2">
                  {isLoadingEpisodes && (
                    <span className="text-[10px] text-[#FFB020] animate-pulse font-semibold">
                      Syncing TMDB...
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-[#FFB020] bg-[#FFB020]/15 px-2.5 py-0.5 rounded-full border border-[#FFB020]/30">
                    Playing: S{season} E{episode}
                  </span>
                </div>
              </div>

              {/* Exact Season Selection - Only available seasons */}
              <div className="mb-3">
                <div className="text-[11px] text-[#8E8E93] mb-1.5 font-medium flex items-center justify-between">
                  <span>Select Season:</span>
                  <span className="text-[10.5px] text-[#9A9AA4]">
                    Total {seasonsData.length} {seasonsData.length === 1 ? 'Season Available' : 'Seasons Available'}
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {seasonsData.map((s) => {
                    const active = season === s.seasonNumber;
                    return (
                      <button
                        key={s.seasonNumber}
                        onClick={() => handleSelectSeason(s.seasonNumber)}
                        className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold shrink-0 transition-all border ${
                          active
                            ? 'bg-[#FFB020] text-black border-[#FFB020] shadow-md scale-[1.02]'
                            : 'bg-[#18181D] border-white/10 text-white/80 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        Season {s.seasonNumber}
                        <span className="ml-1.5 text-[10px] opacity-75 font-normal">
                          ({s.episodeCount} eps)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exact Episode Quick Selection Grid - Strictly only available episodes for selected season */}
              <div>
                <div className="text-[11px] text-[#8E8E93] mb-2 font-medium flex items-center justify-between">
                  <span>Select Episode:</span>
                  <span className="text-[10.5px] text-emerald-400">
                    {maxEpisodesForCurrentSeason} {maxEpisodesForCurrentSeason === 1 ? 'Episode' : 'Episodes'} in Season {season}
                  </span>
                </div>

                {/* If episode item details exist with titles */}
                {currentSeasonData?.episodes && currentSeasonData.episodes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {currentSeasonData.episodes.map((epItem) => {
                      const active = episode === epItem.episode;
                      return (
                        <button
                          key={epItem.episode}
                          onClick={() => handleSelectEpisode(epItem.episode)}
                          className={`p-2 rounded-xl text-left font-medium text-[12px] transition-all border flex items-center gap-2.5 ${
                            active
                              ? 'bg-[#FFB020]/20 border-[#FFB020] text-white shadow-md'
                              : 'bg-white/[0.03] border-white/10 text-[#A0A0AA] hover:bg-white/[0.08] hover:text-white hover:border-white/20'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                            active ? 'bg-[#FFB020] text-black' : 'bg-white/10 text-white'
                          }`}>
                            {epItem.episode}
                          </div>
                          <div className="min-w-0 flex-1 truncate">
                            <div className={`truncate font-semibold text-[12px] ${active ? 'text-[#FFB020]' : 'text-[#F5F5F7]'}`}>
                              {epItem.name || `Episode ${epItem.episode}`}
                            </div>
                            {epItem.airdate && (
                              <div className="text-[10px] text-[#7A7A85] truncate">
                                {epItem.airdate} {epItem.runtime ? `• ${epItem.runtime}m` : ''}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {Array.from({ length: maxEpisodesForCurrentSeason }, (_, i) => i + 1).map((ep) => {
                      const active = episode === ep;
                      return (
                        <button
                          key={ep}
                          onClick={() => handleSelectEpisode(ep)}
                          className={`py-2 px-1 rounded-xl text-center font-bold text-[12px] transition-all border ${
                            active
                              ? 'bg-white text-black border-white shadow-md font-extrabold'
                              : 'bg-white/[0.03] border-white/10 text-[#A0A0AA] hover:bg-white/[0.08] hover:text-white hover:border-white/20'
                          }`}
                        >
                          EP {ep}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 mb-5">
            <button
              onClick={handleRotateToggle}
              id="player-action-rotate"
              className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center gap-2 text-xs font-bold text-[#F5F5F7] active:scale-95 transition-all"
              title="Rotate Screen"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#FFB020]" />
              <span>Rotate Screen</span>
            </button>

            {onToggleWatchlist && (
              <button
                onClick={() => onToggleWatchlist(item)}
                id="player-action-watchlist"
                className={`py-2.5 px-4 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95 transition-all ${
                  isSaved
                    ? 'bg-[#FFB020]/20 border-[#FFB020]/40 text-[#FFB020]'
                    : 'bg-white/10 hover:bg-white/15 border-white/15 text-[#F5F5F7]'
                }`}
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isSaved ? 'Watchlist' : '+ Watchlist'}</span>
              </button>
            )}

            <button
              onClick={handleShare}
              id="player-action-share"
              className="py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center text-xs font-bold text-[#F5F5F7] active:scale-95 transition-all"
              title="Share Title"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied && <span className="ml-1.5 text-[10px] text-emerald-400">Copied</span>}
            </button>
          </div>

          {/* Overview / Story Synopsis */}
          <div className="mb-5">
            <h4 className="text-[14px] font-extrabold text-[#F5F5F7] mb-1.5">Overview</h4>
            <p className="text-[13.5px] leading-[1.65] text-[#9A9AA4] whitespace-pre-line">
              {item.plot || 'No overview available for this title.'}
            </p>
          </div>

          {/* Top Cast & Characters */}
          {item.cast && item.cast.length > 0 && (
            <div className="mb-5">
              <h4 className="text-[14px] font-extrabold text-[#F5F5F7] mb-2.5">Top Cast & Characters</h4>
              <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
                {item.cast.slice(0, 10).map((c, idx) => (
                  <div key={idx} className="shrink-0 flex items-center gap-2.5 p-2 px-3 rounded-xl bg-white/[0.04] border border-white/10 max-w-[220px]">
                    {c.profile ? (
                      <img src={c.profile} alt={c.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#FFB020]/20 text-[#FFB020] font-bold text-xs flex items-center justify-center shrink-0 border border-[#FFB020]/30">
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-[#F5F5F7] truncate">{c.name}</div>
                      {c.character && (
                        <div className="text-[10.5px] text-[#8E8E93] truncate">{c.character}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Crew & Production */}
          {item.crew && item.crew.length > 0 && (
            <div className="mb-5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#9A9AA4] mb-2">Key Crew & Creators</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {item.crew.slice(0, 4).map((cr, idx) => (
                  <div key={idx} className="min-w-0">
                    <div className="text-[10px] text-[#FFB020] uppercase font-semibold">{cr.role}</div>
                    <div className="text-[12px] font-bold text-[#F5F5F7] truncate mt-0.5">{cr.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selection & Suggestions Rail - iPhone Slide Carousel */}
          <div className="mb-6 pt-4 border-t border-white/10" id="player-suggestions-section">
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h4 className="text-[15px] font-extrabold text-[#F5F5F7] flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-[#FFB020]" />
                  More Like This (और भी Movies & Series)
                </h4>
                <p className="text-[11px] text-[#7A7A85]">
                  Slide across and tap any movie to play immediately
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Slide Nav Arrows */}
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => slideSuggestions('left')}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center text-white"
                    title="Slide Left"
                    aria-label="Slide Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => slideSuggestions('right')}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center text-white"
                    title="Slide Right"
                    aria-label="Slide Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 bg-white/[0.06] p-0.5 rounded-lg border border-white/10">
                  {(['all', 'movie', 'tv'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        iosFeedback('tap');
                        setSuggestionFilter(filter);
                      }}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                        suggestionFilter === filter
                          ? 'bg-[#FFB020] text-black font-extrabold'
                          : 'text-[#8E8E93] hover:text-white'
                      }`}
                    >
                      {filter === 'all' ? 'All' : filter === 'movie' ? 'Movies' : 'Series'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Suggestions Horizontal Slide Track with iPhone Fluid Physics */}
            <div
              ref={suggestionsScrollRef}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 pt-1 px-1 no-scrollbar scroll-smooth select-none"
              id="suggestions-slide-track"
            >
              {suggestions.map((sug) => (
                <div
                  key={sug.id}
                  onClick={() => {
                    iosFeedback('slide');
                    if (onSelectItem) {
                      onSelectItem(sug);
                    }
                  }}
                  className="shrink-0 w-[136px] sm:w-[150px] snap-start group relative rounded-2xl overflow-hidden bg-[#141418] border border-white/10 cursor-pointer active:scale-95 transition-all duration-300 hover:border-[#FFB020]/50 hover:shadow-xl hover:shadow-black/70 flex flex-col hover:-translate-y-1"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#1A1A1E]">
                    <img
                      src={sug.poster || sug.backdrop}
                      alt={sug.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />
                    
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-bold uppercase text-white/90">
                      {sug.type === 'tv' ? 'Series' : 'Movie'}
                    </span>

                    {sug.rating && sug.rating !== '–' && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#FFB020] text-black text-[9px] font-extrabold flex items-center gap-0.5 shadow-sm">
                        ★ {sug.rating}
                      </span>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-9 h-9 rounded-full bg-[#FFB020] flex items-center justify-center text-black shadow-lg">
                        <Play className="w-4 h-4 fill-black translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 flex flex-col justify-between flex-1 bg-[#101014]">
                    <h5 className="text-[12px] font-bold text-[#F5F5F7] line-clamp-1 group-hover:text-[#FFB020] transition-colors">
                      {sug.title}
                    </h5>
                    <div className="flex items-center justify-between text-[10px] text-[#8E8E93] mt-1.5">
                      <span>{sug.year}</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                        <Play className="w-2.5 h-2.5 fill-emerald-400" /> Play
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

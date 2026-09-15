import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MediaItem, ScreenType } from './types';
import {
  API_BASE,
  TVMAZE_BASE,
  fetchJSON,
  normalizeMovie,
  normalizeShow,
  FALLBACK_MOVIES,
  FALLBACK_TV
} from './services/api';
import { TopBar } from './components/TopBar';
import { TagRow } from './components/TagRow';
import { HeroCarousel } from './components/HeroCarousel';
import { PosterRail } from './components/PosterRail';
import { Top10Rail } from './components/Top10Rail';
import { ContinueWatchingRail } from './components/ContinueWatchingRail';
import { DetailModal } from './components/DetailModal';
import { PlayerOverlay } from './components/PlayerOverlay';
import { BottomNav } from './components/BottomNav';
import { SearchScreen } from './components/SearchScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { MovieInstallModal } from './components/MovieInstallModal';
import { InterfaceIntroSplash } from './components/InterfaceIntroSplash';

const GENRES = ['Trending', 'Indian', 'Action', 'Drama', 'Comedy', 'Thriller', 'Romance', 'Horror'];

const GLOW_PALETTES = [
  ['#7C5CFF', '#FF7A1A'],
  ['#3FE0D0', '#7C5CFF'],
  ['#FFB020', '#3FE0D0'],
  ['#FF5B5B', '#7C5CFF'],
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedTag, setSelectedTag] = useState<string>('Trending');
  const [tvSelectedTag, setTvSelectedTag] = useState<string>('Trending');

  // Movies state
  const [allMovies, setAllMovies] = useState<MediaItem[]>(FALLBACK_MOVIES);
  const [latestMovies, setLatestMovies] = useState<MediaItem[]>(FALLBACK_MOVIES.slice(2));
  const [indianMovies, setIndianMovies] = useState<MediaItem[]>([]);
  const [isMoviesLoading, setIsMoviesLoading] = useState<boolean>(true);

  // TV shows state
  const [allShows, setAllShows] = useState<MediaItem[]>(FALLBACK_TV);
  const [tvHeroShows, setTvHeroShows] = useState<MediaItem[]>(FALLBACK_TV);
  const [isShowsLoading, setIsShowsLoading] = useState<boolean>(false);

  // Interactive overlays
  const [modalItem, setModalItem] = useState<MediaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [playerItem, setPlayerItem] = useState<MediaItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);

  // Install Animation states
  const [installItem, setInstallItem] = useState<MediaItem | null>(null);
  const [isInstallOpen, setIsInstallOpen] = useState<boolean>(false);
  const [showInterfaceIntro, setShowInterfaceIntro] = useState<boolean>(true);

  // Glow lighting
  const [glowIndex, setGlowIndex] = useState<number>(0);

  // Watchlist & Continue Watching (pure in-memory state)
  const [watchlist, setWatchlist] = useState<MediaItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);

  // User profile state (name and avatar photo) in-memory
  const [userProfile, setUserProfile] = useState<{ name: string; avatar: string }>({
    name: 'Pop User',
    avatar: '',
  });

  // Clear any existing localStorage data once on mount so browser storage is clean
  useEffect(() => {
    try {
      localStorage.clear();
    } catch {}
  }, []);

  const handleUpdateProfile = (newName: string, newAvatar: string) => {
    setUserProfile({ name: newName, avatar: newAvatar });
  };

  const handleClearWatchlist = () => {
    setWatchlist([]);
  };

  // Load Movies on initial mount
  useEffect(() => {
    let isMounted = true;

    async function loadInitialMovies() {
      try {
        const [trendingRes, latestRes] = await Promise.allSettled([
          fetchJSON(`${API_BASE}/list_movies.json?limit=20&sort_by=download_count&order_by=desc`),
          fetchJSON(`${API_BASE}/list_movies.json?limit=20&sort_by=date_added&order_by=desc`),
        ]);

        let loadedTrending: MediaItem[] = [];
        let loadedLatest: MediaItem[] = [];

        if (trendingRes.status === 'fulfilled' && trendingRes.value?.data?.movies) {
          loadedTrending = trendingRes.value.data.movies.map(normalizeMovie).filter((m: MediaItem) => m.poster);
        }
        if (latestRes.status === 'fulfilled' && latestRes.value?.data?.movies) {
          loadedLatest = latestRes.value.data.movies.map(normalizeMovie).filter((m: MediaItem) => m.poster);
        }

        // Fetch popular Indian films to populate the Indian genre and spotlight rail
        const indianQueries = ['rrr', 'pathaan', 'jawan', 'dangal', '3 idiots', 'kgf', 'bahubali', 'pushpa'];
        const indianSettled = await Promise.allSettled(
          indianQueries.map((q) => fetchJSON(`${API_BASE}/list_movies.json?query_term=${encodeURIComponent(q)}&limit=3`))
        );

        const loadedIndian: MediaItem[] = [];
        const seenIndianIds = new Set<string | number>();

        indianSettled.forEach((r) => {
          if (r.status === 'fulfilled' && r.value?.data?.movies) {
            r.value.data.movies.map(normalizeMovie).forEach((m: MediaItem) => {
              if (m.poster && !seenIndianIds.has(m.id)) {
                seenIndianIds.add(m.id);
                loadedIndian.push(m);
              }
            });
          }
        });

        if (isMounted) {
          const combined = loadedTrending.length ? loadedTrending : FALLBACK_MOVIES;
          const seen = new Set(combined.map((m) => String(m.id)));

          const extraMovies = [...loadedLatest, ...loadedIndian];
          extraMovies.forEach((m) => {
            if (!seen.has(String(m.id))) {
              seen.add(String(m.id));
              combined.push(m);
            }
          });

          setAllMovies(combined);
          setLatestMovies(loadedLatest.length ? loadedLatest : combined.slice(3, 15));
          setIndianMovies(loadedIndian.length ? loadedIndian : FALLBACK_MOVIES.filter((m) => m.title === 'RRR' || m.title === 'Dangal'));
          setIsMoviesLoading(false);
        }
      } catch (e) {
        console.error('Failed to load live movies, using rich local catalog:', e);
        if (isMounted) {
          setAllMovies(FALLBACK_MOVIES);
          setLatestMovies(FALLBACK_MOVIES.slice(2));
          setIsMoviesLoading(false);
        }
      }
    }

    loadInitialMovies();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load TV shows when user switches to TV tab or idle
  useEffect(() => {
    let isMounted = true;

    async function loadTV() {
      if (allShows.length > 8) return; // already loaded
      setIsShowsLoading(true);

      const indianQ = ['mirzapur', 'sacred games', 'family man', 'delhi crime', 'panchayat', 'scam 1992', 'farzi', 'asur', 'kota factory'];
      const worldQ = ['breaking bad', 'stranger things', 'the boys', 'game of thrones', 'witcher', 'friends', 'sherlock', 'dark'];

      try {
        const results = await Promise.allSettled(
          [...indianQ, ...worldQ].map((q) => fetchJSON(`${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(q)}`))
        );

        const loadedShows: MediaItem[] = [];
        const seenShowIds = new Set<string | number>();

        results.forEach((r) => {
          if (r.status === 'fulfilled' && Array.isArray(r.value)) {
            r.value.slice(0, 2).forEach((item: any) => {
              const show = normalizeShow(item);
              if (show.poster && !seenShowIds.has(show.id)) {
                seenShowIds.add(show.id);
                loadedShows.push(show);
              }
            });
          }
        });

        if (isMounted && loadedShows.length > 0) {
          setAllShows(loadedShows);
          setTvHeroShows(loadedShows.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to load TV shows:', err);
      } finally {
        if (isMounted) setIsShowsLoading(false);
      }
    }

    if (currentScreen === 'tv') {
      loadTV();
    }
  }, [currentScreen, allShows.length]);

  // Filter movies by active genre tag
  const filteredMovies = useMemo(() => {
    if (selectedTag === 'Trending') return allMovies;
    if (selectedTag === 'Indian') {
      const keys = ['india', 'indian', 'bollywood', 'hindi', 'tamil', 'telugu', 'punjabi', 'mumbai', 'delhi', 'rrr', 'pathaan', 'jawan', 'dangal', 'kgf', 'bahubali', 'pushpa'];
      const matched = allMovies.filter((m) => {
        const blob = (m.title + ' ' + (m.plot || '') + ' ' + (m.genres || []).join(' ')).toLowerCase();
        return keys.some((k) => blob.includes(k));
      });
      return matched.length ? matched : (indianMovies.length ? indianMovies : allMovies);
    }
    const matched = allMovies.filter((m) =>
      (m.genres || []).some((g) => g.toLowerCase().includes(selectedTag.toLowerCase()))
    );
    return matched.length ? matched : allMovies;
  }, [allMovies, selectedTag, indianMovies]);

  // Filter TV series by active TV genre tag
  const filteredShows = useMemo(() => {
    if (tvSelectedTag === 'Trending') return allShows;
    if (tvSelectedTag === 'Indian') {
      const keys = ['india', 'hindi', 'mirzapur', 'panchayat', 'delhi', 'mumbai', 'scam', 'family', 'farzi'];
      const matched = allShows.filter((s) => {
        const blob = (s.title + ' ' + (s.plot || '')).toLowerCase();
        return keys.some((k) => blob.includes(k));
      });
      return matched.length ? matched : allShows;
    }
    const matched = allShows.filter((s) =>
      (s.genres || []).some((g) => g.toLowerCase().includes(tvSelectedTag.toLowerCase()))
    );
    return matched.length ? matched : allShows;
  }, [allShows, tvSelectedTag]);

  // Watchlist toggle handler
  const handleToggleWatchlist = (item: MediaItem) => {
    setWatchlist((prev) => {
      const exists = prev.some((w) => String(w.id) === String(item.id));
      if (exists) {
        return prev.filter((w) => String(w.id) !== String(item.id));
      } else {
        return [item, ...prev].slice(0, 30);
      }
    });
  };

  // Open modal handler
  const handleOpenModal = (item: MediaItem) => {
    setModalItem(item);
    setIsModalOpen(true);

    // Also push to continue watching
    setContinueWatching((prev) => {
      const filtered = prev.filter((c) => String(c.id) !== String(item.id));
      return [{ ...item, progress: Math.floor(Math.random() * 40) + 20 }, ...filtered].slice(0, 10);
    });
  };

  // Play handler - directly opens video player without countdown timer
  const handlePlay = (item: MediaItem) => {
    setIsModalOpen(false);
    setPlayerItem(item);
    setIsPlayerOpen(true);

    // Save to continue watching
    setContinueWatching((prev) => {
      const filtered = prev.filter((c) => String(c.id) !== String(item.id));
      return [{ ...item, progress: Math.floor(Math.random() * 30) + 15 }, ...filtered].slice(0, 10);
    });
  };

  // Open install movie modal
  const handleOpenInstall = (item: MediaItem) => {
    setInstallItem(item);
    setIsInstallOpen(true);
  };

  // Combined pool for live search
  const allPool = useMemo(() => {
    const combined = [...allMovies];
    allShows.forEach((s) => {
      if (!combined.some((m) => String(m.id) === String(s.id))) {
        combined.push(s);
      }
    });
    return combined;
  }, [allMovies, allShows]);

  // Active atmospheric glow colors
  const activeGlows = GLOW_PALETTES[glowIndex % GLOW_PALETTES.length];

  return (
    <div className="relative min-h-screen bg-[#08080A] text-[#F5F5F7] overflow-x-hidden select-none" id="pop-app">
      {/* Ambient Lighting Glows */}
      <div
        className="fixed top-[-120px] left-[-120px] w-[380px] h-[380px] rounded-full blur-[100px] pointer-events-none transition-all duration-1000 opacity-40 z-0"
        style={{ backgroundColor: activeGlows[0] }}
        id="ambient-glow-a"
      />
      <div
        className="fixed top-[220px] right-[-140px] w-[340px] h-[340px] rounded-full blur-[100px] pointer-events-none transition-all duration-1000 opacity-30 z-0"
        style={{ backgroundColor: activeGlows[1] }}
        id="ambient-glow-b"
      />

      {/* Main Interface Call / Launch Animation Splash */}
      {showInterfaceIntro && (
        <InterfaceIntroSplash onFinish={() => setShowInterfaceIntro(false)} />
      )}

      {/* Main Container - Responsive Phone / Tablet Frame */}
      <div className="relative z-10 w-full max-w-xl mx-auto min-h-screen flex flex-col">
        {/* Animated Screen Transition View */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col"
          >
            {/* ================= HOME SCREEN ================= */}
            {currentScreen === 'home' && (
              <div className="flex-1 pb-32" id="screen-home">
                <TopBar
                  onSearchClick={() => setCurrentScreen('search')}
                  onAvatarClick={() => setCurrentScreen('profile')}
                  userAvatar={userProfile.avatar}
                />

                {/* Genre Filter Pills */}
                <TagRow
                  tags={GENRES}
                  selectedTag={selectedTag}
                  onSelectTag={(tag) => setSelectedTag(tag)}
                  idPrefix="home-tag"
                />

                {/* Hero Carousel */}
                <HeroCarousel
                  items={filteredMovies}
                  onPlay={handlePlay}
                  onOpenModal={handleOpenModal}
                  onToggleWatchlist={handleToggleWatchlist}
                  watchlist={watchlist}
                  onActiveIndexChange={(idx) => setGlowIndex(idx)}
                  idPrefix="home-hero"
                />

                {/* Continue Watching Rail */}
                <ContinueWatchingRail
                  items={continueWatching}
                  onOpenModal={handleOpenModal}
                  onPlay={handlePlay}
                  idPrefix="home-continue"
                />

                {/* Top 10 Today Rail */}
                <Top10Rail
                  items={allMovies}
                  onOpenModal={handleOpenModal}
                  idPrefix="home-top10"
                />

                {/* Latest Movies Rail */}
                <PosterRail
                  title={selectedTag === 'Trending' ? 'Latest Movies' : `${selectedTag} Releases`}
                  items={selectedTag === 'Trending' ? latestMovies : filteredMovies.slice(0, 15)}
                  onOpenModal={handleOpenModal}
                  idPrefix="home-recent"
                />

                {/* Recommended For You Rail */}
                <PosterRail
                  title={indianMovies.length > 0 && selectedTag === 'Trending' ? 'Indian Spotlight' : 'Recommended For You'}
                  items={
                    selectedTag === 'Trending' && indianMovies.length > 0
                      ? indianMovies
                      : filteredMovies.slice(4, 18)
                  }
                  onOpenModal={handleOpenModal}
                  idPrefix="home-recommended"
                />
              </div>
            )}

            {/* ================= TV SHOWS SCREEN ================= */}
            {currentScreen === 'tv' && (
              <div className="flex-1 pb-32" id="screen-tv">
                <TopBar
                  onSearchClick={() => setCurrentScreen('search')}
                  onAvatarClick={() => setCurrentScreen('profile')}
                  userAvatar={userProfile.avatar}
                />

                {/* TV Genre Filter Pills */}
                <TagRow
                  tags={GENRES}
                  selectedTag={tvSelectedTag}
                  onSelectTag={(tag) => setTvSelectedTag(tag)}
                  idPrefix="tv-tag"
                />

                {/* TV Hero Carousel */}
                <HeroCarousel
                  items={filteredShows.slice(0, 6)}
                  onPlay={handlePlay}
                  onOpenModal={handleOpenModal}
                  onToggleWatchlist={handleToggleWatchlist}
                  watchlist={watchlist}
                  onActiveIndexChange={(idx) => setGlowIndex(idx)}
                  idPrefix="tv-hero"
                />

                {/* Continue Watching (TV filtered) */}
                <ContinueWatchingRail
                  items={continueWatching.filter((c) => c.type === 'tv').length > 0
                    ? continueWatching.filter((c) => c.type === 'tv')
                    : continueWatching
                  }
                  onOpenModal={handleOpenModal}
                  onPlay={handlePlay}
                  idPrefix="tv-continue"
                />

                {/* Top 10 Series Rail */}
                <Top10Rail
                  items={allShows}
                  onOpenModal={handleOpenModal}
                  idPrefix="tv-top10"
                />

                {/* Latest Series Rail */}
                <PosterRail
                  title="Popular Series"
                  items={filteredShows.slice(0, 14)}
                  onOpenModal={handleOpenModal}
                  idPrefix="tv-popular"
                />

                {/* Binge-Worthy Picks */}
                <PosterRail
                  title="Critically Acclaimed"
                  items={filteredShows.slice(4, 18)}
                  onOpenModal={handleOpenModal}
                  idPrefix="tv-recommended"
                />
              </div>
            )}

            {/* ================= SEARCH SCREEN ================= */}
            {currentScreen === 'search' && (
              <SearchScreen
                onOpenModal={handleOpenModal}
                onPlay={handlePlay}
                allPool={allPool}
                onBack={() => setCurrentScreen('home')}
              />
            )}

            {/* ================= PROFILE SCREEN ================= */}
            {currentScreen === 'profile' && (
              <ProfileScreen
                watchlist={watchlist}
                onOpenModal={handleOpenModal}
                allMedia={allPool}
                userName={userProfile.name}
                userAvatar={userProfile.avatar}
                onUpdateProfile={handleUpdateProfile}
                onClearWatchlist={handleClearWatchlist}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Floating Nav */}
        <BottomNav
          currentScreen={currentScreen}
          onChangeScreen={(screen) => {
            setCurrentScreen(screen);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Media Detail Modal */}
        <DetailModal
          item={modalItem}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPlay={handlePlay}
          isSaved={modalItem ? watchlist.some((w) => String(w.id) === String(modalItem.id)) : false}
          onToggleWatchlist={handleToggleWatchlist}
          allMedia={allPool}
          onSelectItem={(newItem) => setModalItem(newItem)}
          onInstallMovie={handleOpenInstall}
        />

        {/* Streaming Player Overlay */}
        <PlayerOverlay
          item={playerItem}
          isOpen={isPlayerOpen}
          onClose={() => {
            setIsPlayerOpen(false);
            setPlayerItem(null);
          }}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
          allMedia={allPool}
          onSelectItem={handlePlay}
          onInstallMovie={handleOpenInstall}
        />

        {/* Movie Install Modal */}
        <MovieInstallModal
          item={installItem}
          isOpen={isInstallOpen}
          onClose={() => setIsInstallOpen(false)}
          onPlayInstalled={(item) => {
            setIsInstallOpen(false);
            handlePlay(item);
          }}
        />
      </div>
    </div>
  );
}

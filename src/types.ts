export interface CastMember {
  name: string;
  character?: string;
  profile?: string;
}

export interface CrewMember {
  name: string;
  role: string;
  department?: string;
  profile?: string;
}

export interface EpisodeItem {
  id?: number | string;
  season: number;
  episode: number;
  name?: string;
  airdate?: string;
  runtime?: number;
  summary?: string;
  image?: string;
}

export interface SeasonInfo {
  seasonNumber: number;
  episodeCount: number;
  episodes?: EpisodeItem[];
}

export interface MediaItem {
  id: string | number;
  imdb_id: string;
  tmdb_id: string | number | null;
  tvmaze_id?: number;
  title: string;
  year: string;
  rating: string;
  genres: string[];
  plot: string;
  poster: string;
  backdrop: string;
  embed: string;
  runtime?: string;
  cast: CastMember[];
  crew?: CrewMember[];
  director?: string;
  writer?: string;
  creator?: string;
  trailer?: string;
  type: 'movie' | 'tv';
  progress?: number;
  status?: string;
  seasons?: SeasonInfo[];
}

export type ScreenType = 'home' | 'tv' | 'search' | 'profile';

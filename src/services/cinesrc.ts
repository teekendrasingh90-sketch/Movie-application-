// CineSRC postMessage event types and command interfaces
export interface CineSRCTimeUpdateEvent {
  type: 'cinesrc:timeupdate';
  currentTime: number;
  duration: number;
}

export interface CineSRCNextEpisodeEvent {
  type: 'cinesrc:nextepisode';
  season: number;
  episode: number;
  internalNavigation?: boolean;
  source?: 'button' | 'up-next' | 'auto' | 'episode-selector' | string;
}

export interface CineSRCSkipIntroEvent {
  type: 'cinesrc:skipintro';
  time: number;
}

export interface CineSRCSourceUsedEvent {
  type: 'cinesrc:sourceused';
  sourceId: string;
}

export interface CineSRCResponseEvent {
  type: 'cinesrc:response';
  command: string;
  result: any;
}

export type CineSRCPlayerEvent =
  | { type: 'cinesrc:ready' }
  | { type: 'cinesrc:play' }
  | { type: 'cinesrc:pause' }
  | CineSRCTimeUpdateEvent
  | { type: 'cinesrc:seeking'; currentTime: number; duration: number }
  | { type: 'cinesrc:seeked'; currentTime: number; duration: number }
  | { type: 'cinesrc:ended' }
  | { type: 'cinesrc:volumechange'; volume: number; muted: boolean }
  | { type: 'cinesrc:ratechange'; playbackRate: number }
  | { type: 'cinesrc:loadedmetadata'; duration: number }
  | CineSRCNextEpisodeEvent
  | CineSRCSkipIntroEvent
  | CineSRCSourceUsedEvent
  | { type: 'cinesrc:close' }
  | { type: 'cinesrc:error'; error: any }
  | CineSRCResponseEvent;

export function sendCineSRCCommand(
  iframe: HTMLIFrameElement | null,
  command: string,
  args: any[] = []
) {
  if (!iframe || !iframe.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(
      {
        type: 'cinesrc:command',
        command,
        args,
      },
      'https://cinesrc.st'
    );
  } catch (err) {
    console.warn('Failed to send CineSRC command:', err);
  }
}

export type LiveStatusState = 'live' | 'offline' | 'error' | 'unconfigured';

export interface YouTubeLiveVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  actualStartTime?: string;
  concurrentViewers?: string;
  url: string;
  embedUrl: string;
}

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  url: string;
}

export interface YouTubeLiveStatusResponse {
  status: LiveStatusState;
  isLive: boolean;
  video?: YouTubeLiveVideo;
  channel: YouTubeChannelInfo;
  checkedAt: string;
  error?: string;
}

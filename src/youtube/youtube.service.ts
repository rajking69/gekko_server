import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  YouTubeLiveStatusResponse,
  YouTubeLiveVideo,
} from './dto/youtube-live.dto.ts';

@Injectable()
export class YoutubeService implements OnModuleInit {
  private readonly logger = new Logger(YoutubeService.name);
  private apiKey: string | undefined;
  private channelId: string;
  private cache: YouTubeLiveStatusResponse | null = null;
  private cacheExpiresAt = 0;
  private lastKnownLiveVideoId: string | null = null;
  private lastKnownViewers: string = "3";
  private readonly cacheTtlMs = 60 * 1000; // 60 seconds

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('youtubeApiKey') || process.env.YOUTUBE_API_KEY;
    this.channelId =
      this.configService.get<string>('youtubeChannelId') ||
      process.env.YOUTUBE_CHANNEL_ID ||
      'UCqvB8owF-Q7WG0-ZGiM7ezQ';
  }

  async onModuleInit() {
    this.logger.log(`YouTube Service initialized for channel ${this.channelId}`);
    // Pre-warm cache on startup
    this.getLiveStatus().catch((err) => {
      this.logger.warn(`Initial YouTube live status check failed: ${err.message}`);
    });
  }

  async getLiveStatus(forceRefresh = false): Promise<YouTubeLiveStatusResponse> {
    const now = Date.now();
    if (!forceRefresh && this.cache && now < this.cacheExpiresAt) {
      return this.cache;
    }

    if (!this.apiKey || !this.channelId) {
      const unconfigured: YouTubeLiveStatusResponse = {
        status: 'unconfigured',
        isLive: false,
        channel: {
          id: this.channelId || '',
          title: 'Team Gekko',
          url: `https://www.youtube.com/channel/${this.channelId || ''}`,
        },
        checkedAt: new Date().toISOString(),
        error: 'YouTube API key or Channel ID is missing',
      };
      this.cache = unconfigured;
      this.cacheExpiresAt = now + this.cacheTtlMs;
      return unconfigured;
    }

    try {
      const liveData = await this.checkLiveStatusFromApi();
      this.cache = liveData;
      this.cacheExpiresAt = now + this.cacheTtlMs;
      return liveData;
    } catch (error: any) {
      this.logger.error(`YouTube API error: ${error?.message || error}`);
      const errorResponse: YouTubeLiveStatusResponse = {
        status: 'error',
        isLive: false,
        channel: {
          id: this.channelId,
          title: 'Team Gekko',
          url: `https://www.youtube.com/channel/${this.channelId}`,
        },
        checkedAt: new Date().toISOString(),
        error: error?.message || 'Failed to check YouTube live status',
      };
      // Keep shorter error cache so transient network errors recover quickly
      this.cache = errorResponse;
      this.cacheExpiresAt = now + 20 * 1000;
      return errorResponse;
    }
  }

  private async checkLiveStatusFromApi(): Promise<YouTubeLiveStatusResponse> {
    // 1. Quota-saving check: If we already have a known live video, verify it directly via videos.list (costs 1 unit)
    if (this.lastKnownLiveVideoId) {
      const activeVideo = await this.checkSpecificVideoLive(this.lastKnownLiveVideoId);
      if (activeVideo) {
        return {
          status: 'live',
          isLive: true,
          video: activeVideo,
          channel: {
            id: this.channelId,
            title: activeVideo.channelTitle || 'Team Gekko',
            url: `https://www.youtube.com/channel/${this.channelId}`,
          },
          checkedAt: new Date().toISOString(),
        };
      }
      this.lastKnownLiveVideoId = null;
    }

    // 2. Query search.list for live streams on channel (costs 100 units)
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(
      this.channelId,
    )}&eventType=live&type=video&key=${encodeURIComponent(this.apiKey!)}`;

    const res = await fetch(searchUrl);
    if (!res.ok) {
      const errBody: any = await res.json().catch(() => ({}));
      const msg = errBody?.error?.message || `YouTube API returned HTTP ${res.status}`;
      throw new Error(msg);
    }

    const data: any = await res.json();
    const liveItem = data.items?.[0];

    if (!liveItem || !liveItem.id?.videoId) {
      return {
        status: 'offline',
        isLive: false,
        channel: {
          id: this.channelId,
          title: 'Team Gekko',
          url: `https://www.youtube.com/channel/${this.channelId}`,
        },
        checkedAt: new Date().toISOString(),
      };
    }

    const videoId = liveItem.id.videoId;
    this.lastKnownLiveVideoId = videoId;

    // Get liveStreamingDetails to verify if stream is ACTUALLY currently live (costs 1 unit)
    const detailed = await this.checkSpecificVideoLive(videoId);

    if (!detailed) {
      // If checkSpecificVideoLive returned null, the video has ended or is not live!
      this.lastKnownLiveVideoId = null;
      return {
        status: 'offline',
        isLive: false,
        channel: {
          id: this.channelId,
          title: liveItem.snippet.channelTitle || 'Team Gekko',
          url: `https://www.youtube.com/channel/${this.channelId}`,
        },
        checkedAt: new Date().toISOString(),
      };
    }

    if (detailed.concurrentViewers) {
      this.lastKnownViewers = detailed.concurrentViewers;
    }

    return {
      status: 'live',
      isLive: true,
      video: detailed,
      channel: {
        id: this.channelId,
        title: detailed.channelTitle || liveItem.snippet.channelTitle || 'Team Gekko',
        url: `https://www.youtube.com/channel/${this.channelId}`,
      },
      checkedAt: new Date().toISOString(),
    };
  }

  private async checkSpecificVideoLive(
    videoId: string,
  ): Promise<(YouTubeLiveVideo & { channelTitle?: string }) | null> {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails,statistics&id=${encodeURIComponent(
        videoId,
      )}&key=${encodeURIComponent(this.apiKey!)}`;

      const res = await fetch(url);
      if (!res.ok) return null;

      const data: any = await res.json();
      const item = data.items?.[0];
      if (!item) return null;

      // When stream ends, liveBroadcastContent becomes 'none' or actualEndTime is populated.
      // Must NOT treat recorded videos as live.
      const isCurrentlyLive =
        item.snippet?.liveBroadcastContent === 'live' &&
        !item.liveStreamingDetails?.actualEndTime;

      if (!isCurrentlyLive) {
        return null;
      }

      return {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl:
          item.snippet.thumbnails?.maxres?.url ||
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault_live.jpg`,
        publishedAt: item.snippet.publishedAt,
        actualStartTime: item.liveStreamingDetails?.actualStartTime,
        concurrentViewers: item.liveStreamingDetails?.concurrentViewers || item.statistics?.viewCount || this.lastKnownViewers || "3",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
        channelTitle: item.snippet.channelTitle,
      };
    } catch {
      return null;
    }
  }
}

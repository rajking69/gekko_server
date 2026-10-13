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
  private lastKnownViewers: string | undefined = undefined;
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

    // 2. High-reliability, low-quota check: Channel uploads playlist (UU...)
    // Costs only 1 quota unit and has 0 search indexing delay when a stream goes live.
    try {
      const playlistId = 'UU' + this.channelId.substring(2);
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${encodeURIComponent(
        playlistId,
      )}&maxResults=5&key=${encodeURIComponent(this.apiKey!)}`;

      const res = await fetch(playlistUrl);
      if (res.ok) {
        const data: any = await res.json();
        const items = data.items || [];
        for (const item of items) {
          const videoId = item.snippet?.resourceId?.videoId;
          if (!videoId) continue;
          const liveVideo = await this.checkSpecificVideoLive(videoId);
          if (liveVideo) {
            this.lastKnownLiveVideoId = videoId;
            if (liveVideo.concurrentViewers) {
              this.lastKnownViewers = liveVideo.concurrentViewers;
            }
            return {
              status: 'live',
              isLive: true,
              video: liveVideo,
              channel: {
                id: this.channelId,
                title: liveVideo.channelTitle || item.snippet?.channelTitle || 'Team Gekko',
                url: `https://www.youtube.com/channel/${this.channelId}`,
              },
              checkedAt: new Date().toISOString(),
            };
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Uploads playlist live check failed: ${err?.message || err}`);
    }

    // 3. Fallback: Query search.list for live streams on channel (costs 100 units)
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(
        this.channelId,
      )}&eventType=live&type=video&order=date&key=${encodeURIComponent(this.apiKey!)}`;

      const res = await fetch(searchUrl);
      if (res.ok) {
        const data: any = await res.json();
        const items = data.items || [];
        for (const liveItem of items) {
          const videoId = liveItem.id?.videoId;
          if (!videoId) continue;
          const detailed = await this.checkSpecificVideoLive(videoId);
          if (detailed) {
            this.lastKnownLiveVideoId = videoId;
            if (detailed.concurrentViewers) {
              this.lastKnownViewers = detailed.concurrentViewers;
            }
            return {
              status: 'live',
              isLive: true,
              video: detailed,
              channel: {
                id: this.channelId,
                title: detailed.channelTitle || liveItem.snippet?.channelTitle || 'Team Gekko',
                url: `https://www.youtube.com/channel/${this.channelId}`,
              },
              checkedAt: new Date().toISOString(),
            };
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Search live check failed: ${err?.message || err}`);
    }

    // 4. Fallback 3: Scrape public channel live endpoint
    try {
      const liveEndpointUrl = `https://www.youtube.com/channel/${this.channelId}/live`;
      const res = await fetch(liveEndpointUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      if (res.ok) {
        const html = await res.text();
        const match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
        const isLiveSignal = html.includes('"isLive":true') || html.includes('"liveStreamability"');
        if (match?.[1] && isLiveSignal) {
          const videoId = match[1];
          const detailed = await this.checkSpecificVideoLive(videoId);
          if (detailed) {
            this.lastKnownLiveVideoId = videoId;
            return {
              status: 'live',
              isLive: true,
              video: detailed,
              channel: {
                id: this.channelId,
                title: detailed.channelTitle || 'Team Gekko',
                url: `https://www.youtube.com/channel/${this.channelId}`,
              },
              checkedAt: new Date().toISOString(),
            };
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Channel /live endpoint check failed: ${err?.message || err}`);
    }

    // No live streams found
    this.lastKnownLiveVideoId = null;
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
        concurrentViewers: item.liveStreamingDetails?.concurrentViewers || undefined,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
        channelTitle: item.snippet.channelTitle,
      };
    } catch {
      return null;
    }
  }
}
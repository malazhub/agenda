import React, { useEffect, useRef, useState } from 'react';
import type { StreamVideoClient } from '@stream-io/video-client';
import type { Language } from '../types';
import { translations } from '../translations';
import { getLiveStreamStatus } from '../services/cloudflareApi';
import type { LiveStreamStatus } from '../services/cloudflareApi';

interface LiveVideoPlayerProps {
  currentLang: Language;
  stream: LiveStreamStatus;
  sessionToken: string;
  sessionId: string;
}

export const LiveVideoPlayer: React.FC<LiveVideoPlayerProps> = ({ currentLang, stream, sessionToken, sessionId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const t = translations[currentLang];

  useEffect(() => {
    let active = true;
    let client: StreamVideoClient | null = null;
    let subscription: { unsubscribe: () => void } | null = null;
    setError('');
    setPlaylistUrl('');
    const loadCall = async () => {
      try {
        const { StreamVideoClient: VideoClient } = await import('@stream-io/video-client');
        if (!active) return;
        client = new VideoClient({
          apiKey: stream.apiKey,
          token: stream.token,
          tokenProvider: async () => (await getLiveStreamStatus(sessionToken, sessionId)).token,
          user: { id: stream.userId, name: stream.userName },
        });
        const call = client.call('livestream', stream.callId);
        subscription = call.state.egress$.subscribe((egress) => {
          if (active) {
            setError('');
            setPlaylistUrl(egress?.hls?.playlist_url || '');
          }
        });
        await call.get();
      } catch {
        if (active) setError(t.liveVideoError);
      }
    };
    void loadCall();
    return () => {
      active = false;
      subscription?.unsubscribe();
      if (client) void client.disconnectUser().catch(() => undefined);
    };
  }, [retryKey, sessionId, sessionToken, stream.apiKey, stream.callId, stream.token, stream.userId, stream.userName, t.liveVideoError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playlistUrl) return;
    let active = true;
    let hls: import('hls.js').default | null = null;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playlistUrl;
    } else {
      void import('hls.js').then(({ default: Hls }) => {
        if (!active) return;
        if (!Hls.isSupported()) {
          setError(t.liveVideoUnsupported);
          return;
        }
        hls = new Hls({ lowLatencyMode: false });
        hls.loadSource(playlistUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setError(t.liveVideoError);
        });
      }).catch(() => {
        if (active) setError(t.liveVideoUnsupported);
      });
    }
    return () => {
      active = false;
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [playlistUrl, t.liveVideoError, t.liveVideoUnsupported]);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-lg">
      {playlistUrl ? (
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          className="aspect-video w-full"
          aria-label={t.liveBroadcast}
        />
      ) : (
        <div className="flex aspect-video items-center justify-center px-6 text-center text-sm font-bold text-white">
          {error || t.liveVideoWaiting}
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 bg-red-950 px-4 py-3 text-xs font-semibold text-red-100">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="shrink-0 underline">
            {t.liveVideoRetry}
          </button>
        </div>
      )}
    </div>
  );
};

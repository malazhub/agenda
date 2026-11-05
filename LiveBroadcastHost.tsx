import React, { useEffect, useRef, useState } from 'react';
import type { Call, StreamVideoClient } from '@stream-io/video-client';
import type { Language } from '../types';
import { translations } from '../translations';
import { setupLiveStream } from '../services/cloudflareApi';
import type { LiveStreamSetup } from '../services/cloudflareApi';

interface LiveBroadcastHostProps {
  currentLang: Language;
  stream: LiveStreamSetup;
  directorToken: string;
}

export const LiveBroadcastHost: React.FC<LiveBroadcastHostProps> = ({ currentLang, stream, directorToken }) => {
  const t = translations[currentLang];
  const [call, setCall] = useState<Call | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const isLiveRef = useRef(false);

  useEffect(() => {
    let active = true;
    let client: StreamVideoClient | null = null;
    let activeCall: Call | null = null;
    setError('');
    setIsConnecting(true);
    setIsLive(false);
    const connect = async () => {
      try {
        const { StreamVideoClient: VideoClient } = await import('@stream-io/video-client');
        if (!active) return;
        client = new VideoClient({
          apiKey: stream.apiKey,
          token: stream.token,
          tokenProvider: async () => (await setupLiveStream(directorToken)).token,
          user: { id: stream.userId, name: stream.userName },
        });
        activeCall = client.call('livestream', stream.callId);
        await activeCall.getOrCreate();
        if (!active) return;
        setCall(activeCall);
      } catch {
        if (active) setError(t.liveVideoError);
        if (client) await client.disconnectUser().catch(() => undefined);
      } finally {
        if (active) setIsConnecting(false);
      }
    };
    void connect();
    return () => {
      active = false;
      void (async () => {
        if (activeCall) {
          if (isLiveRef.current) {
            isLiveRef.current = false;
            await activeCall.stopLive({ continue_hls: false }).catch(() => undefined);
          }
          await activeCall.leave().catch(() => undefined);
        }
        if (client) await client.disconnectUser().catch(() => undefined);
      })();
    };
  }, [directorToken, retryKey, stream.apiKey, stream.callId, stream.token, stream.userId, stream.userName, t.liveVideoError]);

  const startBroadcast = async () => {
    if (!call) return;
    setError('');
    setIsConnecting(true);
    try {
      await call.join();
      await call.camera.enable();
      await call.microphone.enable();
      await call.goLive({ start_hls: true });
      isLiveRef.current = true;
      setIsLive(true);
    } catch {
      setError(t.liveVideoError);
    } finally {
      setIsConnecting(false);
    }
  };

  const stopBroadcast = async () => {
    if (!call) return;
    setError('');
    try {
      await call.stopLive({ continue_hls: false });
      await call.camera.disable();
      await call.microphone.disable();
      isLiveRef.current = false;
      setIsLive(false);
    } catch {
      setError(t.liveVideoError);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-rose-100 bg-rose-50 p-4">
      <p className="text-sm font-bold text-slate-800">
        {isConnecting ? t.liveVideoConnecting : isLive ? t.liveBroadcastActive : t.liveVideoReady}
      </p>
      {error && <p role="alert" className="text-xs font-semibold text-red-700">{error}</p>}
      {error && (
        <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="text-xs font-bold underline">
          {t.liveVideoRetry}
        </button>
      )}
      {!isConnecting && call && (
        <button
          type="button"
          onClick={() => void (isLive ? stopBroadcast() : startBroadcast())}
          className={`rounded-xl px-4 py-2 text-xs font-black text-white ${isLive ? 'bg-slate-700' : 'bg-rose-600'}`}
        >
          {isLive ? t.stopBroadcast : t.startBroadcast}
        </button>
      )}
    </div>
  );
};

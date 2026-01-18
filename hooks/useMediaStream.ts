
import { useState, useCallback, useRef } from 'react';

export const useMediaStream = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async (videoMode: boolean = true) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: videoMode ? { facingMode: 'environment' } : false
      });
      streamRef.current = newStream;
      setStream(newStream);
      return newStream;
    } catch (err) {
      console.error("Hardware access denied:", err);
      throw err;
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  return { stream, start, stop };
};

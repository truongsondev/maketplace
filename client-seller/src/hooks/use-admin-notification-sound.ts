import { useCallback, useRef, useState } from "react";

const STORAGE_KEY = "aura-admin:new-order-sound-enabled";
const SOUND_SRC =
  "/notification-sounds/universfield-new-notification-036-485897.mp3";

function safeReadPreference(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function useAdminNotificationSound() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(safeReadPreference);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const persistPreference = useCallback((enabled: boolean) => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // Ignore localStorage write issues.
    }
  }, []);

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") return null;

    if (!audioRef.current) {
      const audio = new Audio(SOUND_SRC);
      audio.preload = "auto";
      audio.volume = 1;
      audioRef.current = audio;
    }

    audioRef.current.volume = 1;
    return audioRef.current;
  }, []);

  const enableSound = useCallback(async () => {
    setSoundEnabled(true);
    persistPreference(true);

    const audio = ensureAudio();
    if (!audio) {
      setNeedsInteraction(false);
      return false;
    }

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = true;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      setNeedsInteraction(false);
      return true;
    } catch {
      audio.muted = false;
      setNeedsInteraction(true);
      return false;
    }
  }, [ensureAudio, persistPreference]);

  const disableSound = useCallback(() => {
    setSoundEnabled(false);
    setNeedsInteraction(false);
    persistPreference(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [persistPreference]);

  const playNewOrderSound = useCallback(async () => {
    if (!soundEnabled) return false;

    const audio = ensureAudio();
    if (!audio) return false;

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      audio.volume = 1;
      await audio.play();
      setNeedsInteraction(false);
      return true;
    } catch {
      setNeedsInteraction(true);
      return false;
    }
  }, [ensureAudio, soundEnabled]);

  return {
    soundEnabled,
    needsInteraction,
    enableSound,
    disableSound,
    playNewOrderSound,
  };
}

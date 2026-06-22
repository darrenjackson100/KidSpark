import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  warmupVoices,
  cancelSpeech,
  setSpeechEnabled,
  getVoiceSettings,
  setVoiceSettings,
  VoiceSettings,
} from "@/lib/speech";

interface SoundContextType {
  muted: boolean;
  toggleMute: () => void;
  ttsEnabled: boolean;
  toggleTTS: () => void;
  voiceSettings: VoiceSettings;
  updateVoiceSettings: (partial: Partial<VoiceSettings>) => void;
}

const SoundContext = createContext<SoundContextType>({
  muted: false,
  toggleMute: () => {},
  ttsEnabled: true,
  toggleTTS: () => {},
  voiceSettings: getVoiceSettings(),
  updateVoiceSettings: () => {},
});

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(() => localStorage.getItem("kidspark_muted") === "true");
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem("kidspark_tts") !== "false");
  const [voiceSettings, setVoiceSettingsState] = useState<VoiceSettings>(() => getVoiceSettings());

  // Keep the speech module's on/off flag in sync with the TTS toggle.
  useEffect(() => { setSpeechEnabled(ttsEnabled); }, [ttsEnabled]);

  // Warm up the device voices so the chosen British voice is ready on first use.
  useEffect(() => { warmupVoices(); }, []);

  const toggleMute = () => {
    setMuted(prev => {
      const next = !prev;
      localStorage.setItem("kidspark_muted", String(next));
      return next;
    });
  };

  const toggleTTS = () => {
    setTtsEnabled(prev => {
      const next = !prev;
      localStorage.setItem("kidspark_tts", String(next));
      if (!next) cancelSpeech();
      return next;
    });
  };

  const updateVoiceSettings = useCallback((partial: Partial<VoiceSettings>) => {
    setVoiceSettingsState(setVoiceSettings(partial));
  }, []);

  return (
    <SoundContext.Provider value={{ muted, toggleMute, ttsEnabled, toggleTTS, voiceSettings, updateVoiceSettings }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext() {
  return useContext(SoundContext);
}

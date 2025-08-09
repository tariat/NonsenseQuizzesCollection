import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

interface SoundSettings {
  enabled: boolean;
  volume: number; // 0.0 ~ 1.0
  buttonSounds: boolean;
  gameSounds: boolean;
  backgroundMusic: boolean;
}

interface SoundContextType {
  settings: SoundSettings;
  isLoaded: boolean;
  updateSettings: (newSettings: Partial<SoundSettings>) => Promise<void>;
  playButtonSound: () => void;
  playCorrectSound: () => void;
  playWrongSound: () => void;
  playTimeoutSound: () => void;
  playCompletionSound: () => void;
  startBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
}

const defaultSettings: SoundSettings = {
  enabled: true,
  volume: 0.7,
  buttonSounds: true,
  gameSounds: true,
  backgroundMusic: false,
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const STORAGE_KEY = '@quiz_app_sound_settings';

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SoundSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sounds, setSounds] = useState<{ [key: string]: Audio.Sound }>({});
  const [isBackgroundPlaying, setIsBackgroundPlaying] = useState(false);

  console.log('SoundProvider initialized, settings:', settings);

  // 오디오 초기화 및 정리
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    
    loadSounds();
    loadSettings();

    // 컴포넌트 언마운트 시 사운드 정리
    return () => {
      Object.values(sounds).forEach(sound => {
        sound.unloadAsync().catch(console.warn);
      });
    };
  }, []);

  // 배경음악은 자동으로 시작하지 않음 (게임 화면에서만 제어)

  const loadSounds = async () => {
    try {
      const soundFiles = {
        button: require('../../assets/sounds/button.mp3'),
        correct: require('../../assets/sounds/correct.mp3'),
        wrong: require('../../assets/sounds/wrong.mp3'),
        timeout: require('../../assets/sounds/timeout.mp3'),
        completion: require('../../assets/sounds/completion.mp3'),
        background: require('../../assets/sounds/background.mp3'),
      };

      const loadedSounds: { [key: string]: Audio.Sound } = {};

      for (const [key, source] of Object.entries(soundFiles)) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            source,
            { 
              shouldPlay: false,
              isLooping: key === 'background' // 배경음악만 루프 설정
            }
          );
          loadedSounds[key] = sound;
          console.log(`✅ ${key} sound loaded`);
        } catch (error) {
          console.warn(`⚠️ Failed to load ${key} sound:`, error);
        }
      }

      setSounds(loadedSounds);
    } catch (error) {
      console.warn('Failed to load sounds:', error);
    }
  };

  const loadSettings = async () => {
    try {
      console.log('Loading sound settings...');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('Stored settings:', stored);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        console.log('Parsed settings:', parsedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } else {
        console.log('No stored settings, using defaults:', defaultSettings);
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Failed to load sound settings:', error);
      setSettings(defaultSettings);
    } finally {
      setIsLoaded(true);
      console.log('Settings loading completed');
    }
  };

  const updateSettings = async (newSettings: Partial<SoundSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to save sound settings:', error);
    }
  };

  const playSound = async (soundKey: string, volume: number = settings.volume) => {
    try {
      const sound = sounds[soundKey];
      if (!sound) {
        console.warn(`Sound ${soundKey} not loaded`);
        return;
      }

      await sound.setVolumeAsync(volume);
      await sound.replayAsync();
      console.log(`🔊 ${soundKey} sound played at volume ${Math.round(volume * 100)}%`);
    } catch (error) {
      console.warn(`Failed to play ${soundKey} sound:`, error);
    }
  };

  // 사운드 재생 함수들
  const playButtonSound = () => {
    if (!settings.enabled || !settings.buttonSounds) return;
    playSound('button');
  };

  const playCorrectSound = () => {
    if (!settings.enabled || !settings.gameSounds) return;
    playSound('correct');
  };

  const playWrongSound = () => {
    if (!settings.enabled || !settings.gameSounds) return;
    playSound('wrong');
  };

  const playTimeoutSound = () => {
    if (!settings.enabled || !settings.gameSounds) return;
    playSound('timeout');
  };

  const playCompletionSound = () => {
    if (!settings.enabled || !settings.gameSounds) return;
    playSound('completion');
  };

  const startBackgroundMusic = async () => {
    if (!settings.enabled || !settings.backgroundMusic) return;
    
    try {
      const backgroundSound = sounds.background;
      if (!backgroundSound) {
        console.warn('Background music not loaded');
        return;
      }

      if (isBackgroundPlaying) {
        console.log('Background music already playing');
        return;
      }

      await backgroundSound.setVolumeAsync(settings.volume * 0.3); // 배경음악은 더 조용하게
      await backgroundSound.playAsync();
      setIsBackgroundPlaying(true);
      console.log('🎵 Background music started');
    } catch (error) {
      console.warn('Failed to start background music:', error);
    }
  };

  const stopBackgroundMusic = async () => {
    try {
      const backgroundSound = sounds.background;
      if (!backgroundSound) return;

      await backgroundSound.stopAsync();
      setIsBackgroundPlaying(false);
      console.log('🎵 Background music stopped');
    } catch (error) {
      console.warn('Failed to stop background music:', error);
    }
  };

  const value: SoundContextType = {
    settings,
    isLoaded,
    updateSettings,
    playButtonSound,
    playCorrectSound,
    playWrongSound,
    playTimeoutSound,
    playCompletionSound,
    startBackgroundMusic,
    stopBackgroundMusic,
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = (): SoundContextType => {
  const context = useContext(SoundContext);
  if (!context) {
    console.error('useSound must be used within a SoundProvider');
    // 기본값 반환으로 에러 방지
    return {
      settings: defaultSettings,
      isLoaded: false,
      updateSettings: async () => {},
      playButtonSound: () => {},
      playCorrectSound: () => {},
      playWrongSound: () => {},
      playTimeoutSound: () => {},
      playCompletionSound: () => {},
      startBackgroundMusic: () => {},
      stopBackgroundMusic: () => {},
    };
  }
  return context;
};
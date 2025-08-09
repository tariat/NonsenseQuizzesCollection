import React from 'react';
import { View, Text, StyleSheet, Switch, Alert, TouchableOpacity } from 'react-native';
import { gameColors } from '../constants/colors';
import { useSound } from '../contexts/SoundContext';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';

// Slider 컴포넌트를 조건부로 가져오기
let Slider: any = null;
try {
  const SliderModule = require('@react-native-community/slider');
  Slider = SliderModule.Slider || SliderModule.default;
  console.log('Slider loaded successfully:', !!Slider);
} catch (error) {
  console.warn('Slider not available:', error);
}

export default function SettingsScreen() {
  console.log('SettingsScreen component loading...');
  
  const soundContext = useSound();
  console.log('Sound context:', soundContext);
  
  const { settings, isLoaded, updateSettings, playButtonSound, startBackgroundMusic, stopBackgroundMusic } = soundContext;
  
  console.log('SettingsScreen rendered, settings:', settings);
  console.log('Settings type:', typeof settings);
  console.log('Settings keys:', settings ? Object.keys(settings) : 'null');

  const handleToggleSound = (enabled: boolean) => {
    updateSettings({ enabled });
    if (enabled) {
      playButtonSound();
    }
  };

  const handleToggleButtonSounds = (buttonSounds: boolean) => {
    updateSettings({ buttonSounds });
    if (buttonSounds && settings.enabled) {
      playButtonSound();
    }
  };

  const handleToggleGameSounds = (gameSounds: boolean) => {
    updateSettings({ gameSounds });
  };

  const handleToggleBackgroundMusic = (backgroundMusic: boolean) => {
    updateSettings({ backgroundMusic });
    // 설정 화면에서는 배경음악을 제어하지 않음 (게임 화면에서만 재생)
  };

  const handleVolumeChange = (volume: number) => {
    updateSettings({ volume });
  };

  const handleVolumeDecrease = () => {
    const newVolume = Math.max(0, settings.volume - 0.1);
    handleVolumeChange(newVolume);
  };

  const handleVolumeIncrease = () => {
    const newVolume = Math.min(1, settings.volume + 0.1);
    handleVolumeChange(newVolume);
  };

  const handleTestSound = () => {
    playButtonSound();
  };

  const handleBackgroundMusicTest = () => {
    if (settings.backgroundMusic) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      '설정 초기화',
      '모든 소리 설정을 초기값으로 되돌리시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: () => {
            updateSettings({
              enabled: true,
              volume: 0.7,
              buttonSounds: true,
              gameSounds: true,
              backgroundMusic: false,
            });
          },
        },
      ]
    );
  };

  if (!isLoaded || !settings) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔊 소리 설정</Text>
          <Text style={styles.subtitle}>로딩 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedCard delay={0}>
        <View style={styles.header}>
          <Text style={styles.title}>🔊 소리 설정</Text>
          <Text style={styles.subtitle}>게임 사운드를 조정하세요</Text>
        </View>
      </AnimatedCard>

      <View style={styles.settingsContainer}>
        {/* 전체 소리 활성화 */}
        <AnimatedCard delay={100}>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>소리 활성화</Text>
                <Text style={styles.settingDescription}>모든 소리 효과를 켜거나 끕니다</Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={handleToggleSound}
                trackColor={{ false: gameColors.gray[300], true: gameColors.primary.solid }}
                thumbColor={settings.enabled ? gameColors.cardBg : gameColors.gray[400]}
              />
            </View>
          </View>
        </AnimatedCard>

        {/* 볼륨 조절 */}
        <AnimatedCard delay={150}>
          <View style={styles.settingCard}>
            <View style={styles.settingColumn}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>볼륨</Text>
                <Text style={styles.settingDescription}>
                  소리 크기: {Math.round(settings.volume * 100)}%
                </Text>
              </View>
              <View style={styles.sliderContainer}>
                <TouchableOpacity 
                  style={styles.volumeButton}
                  onPress={handleVolumeDecrease}
                  disabled={!settings.enabled || settings.volume <= 0}
                >
                  <Text style={[styles.volumeButtonText, 
                    (!settings.enabled || settings.volume <= 0) && styles.volumeButtonDisabled
                  ]}>🔉</Text>
                </TouchableOpacity>
                
                {Slider ? (
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={settings.volume}
                    onValueChange={handleVolumeChange}
                    minimumTrackTintColor={gameColors.primary.solid}
                    maximumTrackTintColor={gameColors.gray[300]}
                    thumbStyle={{ backgroundColor: gameColors.primary.solid }}
                    disabled={!settings.enabled}
                  />
                ) : (
                  <View style={styles.customSlider}>
                    <View style={styles.sliderTrack}>
                      <View 
                        style={[
                          styles.sliderFill, 
                          { width: `${settings.volume * 100}%` },
                          !settings.enabled && styles.sliderDisabled
                        ]} 
                      />
                    </View>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.volumeButton}
                  onPress={handleVolumeIncrease}
                  disabled={!settings.enabled || settings.volume >= 1}
                >
                  <Text style={[styles.volumeButtonText,
                    (!settings.enabled || settings.volume >= 1) && styles.volumeButtonDisabled
                  ]}>🔊</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </AnimatedCard>

        {/* 버튼 소리 */}
        <AnimatedCard delay={200}>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>버튼 소리</Text>
                <Text style={styles.settingDescription}>버튼 터치 시 소리 효과</Text>
              </View>
              <Switch
                value={settings.buttonSounds}
                onValueChange={handleToggleButtonSounds}
                trackColor={{ false: gameColors.gray[300], true: gameColors.primary.solid }}
                thumbColor={settings.buttonSounds ? gameColors.cardBg : gameColors.gray[400]}
                disabled={!settings.enabled}
              />
            </View>
          </View>
        </AnimatedCard>

        {/* 게임 소리 */}
        <AnimatedCard delay={250}>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>게임 소리</Text>
                <Text style={styles.settingDescription}>정답/오답/완료 시 소리 효과</Text>
              </View>
              <Switch
                value={settings.gameSounds}
                onValueChange={handleToggleGameSounds}
                trackColor={{ false: gameColors.gray[300], true: gameColors.primary.solid }}
                thumbColor={settings.gameSounds ? gameColors.cardBg : gameColors.gray[400]}
                disabled={!settings.enabled}
              />
            </View>
          </View>
        </AnimatedCard>

        {/* 배경음악 */}
        <AnimatedCard delay={300}>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>배경음악</Text>
                <Text style={styles.settingDescription}>게임 중 배경음악 재생</Text>
              </View>
              <Switch
                value={settings.backgroundMusic}
                onValueChange={handleToggleBackgroundMusic}
                trackColor={{ false: gameColors.gray[300], true: gameColors.primary.solid }}
                thumbColor={settings.backgroundMusic ? gameColors.cardBg : gameColors.gray[400]}
                disabled={!settings.enabled}
              />
            </View>
          </View>
        </AnimatedCard>

        {/* 테스트 및 초기화 버튼 */}
        <AnimatedCard delay={350}>
          <View style={styles.buttonContainer}>
            <AnimatedButton
              style={[styles.button, styles.testButton]}
              onPress={handleTestSound}
              disabled={!settings.enabled || !settings.buttonSounds}
            >
              <Text style={styles.testButtonText}>🎵 소리 테스트</Text>
            </AnimatedButton>

            <AnimatedButton
              style={[styles.button, styles.resetButton]}
              onPress={handleResetSettings}
            >
              <Text style={styles.resetButtonText}>🔄 설정 초기화</Text>
            </AnimatedButton>
          </View>
        </AnimatedCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: gameColors.background,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: gameColors.textSecondary,
  },
  settingsContainer: {
    flex: 1,
  },
  settingCard: {
    backgroundColor: gameColors.cardBg,
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingColumn: {
    gap: 15,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: gameColors.textSecondary,
    lineHeight: 18,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: 16,
    color: gameColors.textSecondary,
  },
  volumeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: gameColors.gray[100],
  },
  volumeButtonText: {
    fontSize: 18,
  },
  volumeButtonDisabled: {
    opacity: 0.3,
  },
  customSlider: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: gameColors.gray[300],
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: gameColors.primary.solid,
    borderRadius: 3,
  },
  sliderDisabled: {
    backgroundColor: gameColors.gray[400],
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  testButton: {
    backgroundColor: gameColors.correct.solid,
  },
  testButtonText: {
    color: gameColors.cardBg,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: gameColors.gray[100],
  },
  resetButtonText: {
    color: gameColors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
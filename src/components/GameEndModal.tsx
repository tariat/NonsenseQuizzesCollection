import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { QuizService } from '../services/quizService';
import { gameColors } from '../constants/colors';
import AnimatedButton from './AnimatedButton';
import OptimizedImage from './OptimizedImage';

interface GameEndModalProps {
  visible: boolean;
  score: number;
  onClose: () => void;
  onScoreSaved: () => void;
  isPerfectScore?: boolean;
  onContinueChallenge?: () => void;
}

export default function GameEndModal({ visible, score, onClose, onScoreSaved, isPerfectScore = false, onContinueChallenge }: GameEndModalProps) {
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // 애니메이션 값들
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const celebrationScaleAnim = useRef(new Animated.Value(0)).current;
  const celebrationRotateAnim = useRef(new Animated.Value(0)).current;

  // 모달 등장 애니메이션
  useEffect(() => {
    if (visible) {
      // 오버레이 페이드인
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // 모달 등장 (스케일 + 페이드)
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
      
      // 축하 이미지 애니메이션 (약간의 지연 후)
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(celebrationScaleAnim, {
            toValue: 1,
            tension: 120,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(celebrationRotateAnim, {
            toValue: 360,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }, 200);
    } else {
      // 리셋
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      overlayAnim.setValue(0);
      celebrationScaleAnim.setValue(0);
      celebrationRotateAnim.setValue(0);
    }
  }, [visible, scaleAnim, fadeAnim, overlayAnim, celebrationScaleAnim, celebrationRotateAnim]);

  const handleSaveScore = async () => {
    console.log('Save score button clicked, userName:', userName, 'score:', score);
    if (!userName.trim()) {
      Alert.alert('오류', '이름을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Calling QuizService.saveScore...');
      const success = await QuizService.saveScore(userName.trim(), score);
      console.log('Save score result:', success);
      if (success) {
        console.log('Score saved successfully, showing success message...');
        setShowSuccess(true);
        
        // 3초 후 스코어보드로 이동
        setTimeout(() => {
          console.log('Navigating to scoreboard...');
          setUserName('');
          setShowSuccess(false);
          onScoreSaved();
          onClose();
        }, 3000);
      } else {
        Alert.alert('오류', '점수 저장에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Error saving score:', error);
      Alert.alert('오류', '점수 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    console.log('Skip button clicked, navigating to scoreboard...');
    setUserName('');
    onClose();
  };

  const handleContinueChallenge = () => {
    console.log('Continue challenge button clicked');
    setUserName('');
    setShowSuccess(false);
    // onClose() 호출하지 않음 - 스코어보드로 네비게이션하지 않도록
    if (onContinueChallenge) {
      onContinueChallenge();
    }
  };

  const celebrationRotation = celebrationRotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleSkip}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <Animated.View style={[
          styles.modalContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}>
          {showSuccess ? (
            // 성공 메시지 화면
            <>
              <Animated.View
                style={{
                  transform: [
                    { scale: celebrationScaleAnim },
                    { rotate: celebrationRotation }
                  ],
                }}
              >
                <OptimizedImage 
                  source={require('../../assets/images/icons/celebration.webp')}
                  style={styles.celebrationImage}
                  resizeMode="contain"
                />
              </Animated.View>
              <Text style={styles.successTitle}>점수 저장완료!</Text>
              <Text style={styles.successMessage}>
                {userName}님의 점수 {score}점이 저장되었습니다.
              </Text>
              <Text style={styles.redirectMessage}>
                3초 후 스코어보드로 이동합니다...
              </Text>
            </>
          ) : (
            // 점수 입력 화면
            <>
              <Animated.View
                style={{
                  transform: [
                    { scale: celebrationScaleAnim },
                    { rotate: celebrationRotation }
                  ],
                }}
              >
                <OptimizedImage 
                  source={require('../../assets/images/icons/celebration.webp')}
                  style={styles.celebrationImage}
                  resizeMode="contain"
                />
              </Animated.View>
              <Text style={styles.title}>
                {isPerfectScore ? '완벽해요!' : '게임 완료!'}
              </Text>
              <Text style={styles.scoreText}>최종 점수: {score}점</Text>
              {isPerfectScore && (
                <Text style={styles.perfectMessage}>
                  모든 문제를 맞추셨네요! 👏
                </Text>
              )}
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>이름을 입력하세요</Text>
                <TextInput
                  style={styles.input}
                  placeholder="닉네임 입력"
                  value={userName}
                  onChangeText={setUserName}
                  maxLength={20}
                  autoFocus
                />
              </View>

              <View style={styles.buttonContainer}>
                {isPerfectScore && onContinueChallenge && (
                  <AnimatedButton
                    style={[styles.button, styles.challengeButton]}
                    onPress={handleContinueChallenge}
                    disabled={isSubmitting}
                    scaleValue={0.9}
                  >
                    <Text style={styles.challengeButtonText}>🚀 더 도전하기</Text>
                  </AnimatedButton>
                )}

                <AnimatedButton
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleSaveScore}
                  disabled={isSubmitting}
                  scaleValue={0.9}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSubmitting ? '저장 중...' : '점수 저장'}
                  </Text>
                </AnimatedButton>

                <AnimatedButton
                  style={[styles.button, styles.secondaryButton]}
                  onPress={handleSkip}
                  disabled={isSubmitting}
                  scaleValue={0.9}
                >
                  <Text style={styles.secondaryButtonText}>건너뛰기</Text>
                </AnimatedButton>
              </View>

              <Text style={styles.infoText}>
                {isPerfectScore 
                  ? '더 도전하거나 점수를 저장해보세요!' 
                  : '점수를 저장하면 스코어보드에서 순위를 확인할 수 있어요!'
                }
              </Text>
            </>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: gameColors.cardBg,
    borderRadius: 25,
    padding: 35,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: gameColors.primary.solid,
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: gameColors.gray[50],
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: gameColors.gray[300],
    color: gameColors.textPrimary,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: gameColors.primary.solid,
  },
  primaryButtonText: {
    color: gameColors.cardBg,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: gameColors.gray[100],
  },
  secondaryButtonText: {
    color: gameColors.textSecondary,
    fontSize: 16,
  },
  infoText: {
    fontSize: 12,
    color: gameColors.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
  celebrationImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: gameColors.correct.solid,
    marginBottom: 15,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 18,
    color: gameColors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  redirectMessage: {
    fontSize: 14,
    color: gameColors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  perfectMessage: {
    fontSize: 16,
    color: gameColors.challenge.solid,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  challengeButton: {
    backgroundColor: gameColors.challenge.solid,
  },
  challengeButtonText: {
    color: gameColors.cardBg,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
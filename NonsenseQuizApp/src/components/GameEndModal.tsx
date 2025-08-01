import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { QuizService } from '../services/quizService';

interface GameEndModalProps {
  visible: boolean;
  score: number;
  onClose: () => void;
  onScoreSaved: () => void;
}

export default function GameEndModal({ visible, score, onClose, onScoreSaved }: GameEndModalProps) {
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {showSuccess ? (
            // 성공 메시지 화면
            <>
              <Text style={styles.successIcon}>🎉</Text>
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
              <Text style={styles.title}>🎉 게임 완료!</Text>
              <Text style={styles.scoreText}>최종 점수: {score}점</Text>
              
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
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleSaveScore}
                  disabled={isSubmitting}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSubmitting ? '저장 중...' : '점수 저장'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={handleSkip}
                  disabled={isSubmitting}
                >
                  <Text style={styles.secondaryButtonText}>건너뛰기</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.infoText}>
                점수를 저장하면 스코어보드에서 순위를 확인할 수 있어요!
              </Text>
            </>
          )}
        </View>
      </View>
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
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
    backgroundColor: '#2196F3',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 15,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  redirectMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
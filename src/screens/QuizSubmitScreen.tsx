import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { QuizService } from '../services/quizService';
import { gameColors } from '../constants/colors';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';

export default function QuizSubmitScreen() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    console.log('Submit button clicked!');
    console.log('Question:', question);
    console.log('Answer:', answer);
    
    if (!question.trim() || !answer.trim()) {
      Alert.alert('오류', '질문과 답을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: 실제 Supabase 연결 후 아래 주석을 해제하고 Mock 부분을 제거
      const success = await QuizService.submitQuiz(question.trim(), answer.trim());
      
      // // Mock success for testing (Supabase 연결 전까지 임시)
      // console.log('Mock quiz submission:', { question: question.trim(), answer: answer.trim() });
      // const success = true; // Mock success
      
      if (success) {
        console.log('Quiz submitted successfully');
        // 입력창 즉시 초기화
        setQuestion('');
        setAnswer('');
        // 성공 메시지 표시
        setShowSuccess(true);
        // 3초 후 성공 메시지 숨기기
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        Alert.alert('오류', '퀴즈 등록에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Quiz submission error:', error);
      Alert.alert('오류', '퀴즈 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedCard delay={0}>
        <Text style={styles.title}>새 퀴즈 등록</Text>
        <Text style={styles.subtitle}>재미있는 넌센스 퀴즈를 등록해보세요!</Text>
      </AnimatedCard>

      {/* 성공 메시지 */}
      {showSuccess && (
        <AnimatedCard delay={0}>
          <View style={styles.successContainer}>
            <Text style={styles.successText}>🎉 등록 완료!</Text>
            <Text style={styles.successSubText}>관리자 승인 후 게임에 추가됩니다</Text>
          </View>
        </AnimatedCard>
      )}

      <AnimatedCard style={styles.formContainer} delay={100}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>질문</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 바나나가 웃으면?"
            value={question}
            onChangeText={setQuestion}
            multiline
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>답</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 바나나킥"
            value={answer}
            onChangeText={setAnswer}
          />
        </View>

        <AnimatedButton 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
          scaleValue={0.92}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '등록 중...' : '퀴즈 등록'}
          </Text>
        </AnimatedButton>
      </AnimatedCard>

      <AnimatedCard style={styles.infoContainer} delay={200}>
        <Text style={styles.infoTitle}>📌 등록 안내</Text>
        <Text style={styles.infoText}>
          • 등록된 퀴즈는 관리자 승인 후 게임에 추가됩니다{'\n'}
          • 적절하지 않은 내용은 승인되지 않을 수 있습니다{'\n'}
          • 창의적이고 재미있는 퀴즈를 만들어주세요!
        </Text>
      </AnimatedCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: gameColors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: gameColors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  formContainer: {
    backgroundColor: gameColors.cardBg,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
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
    minHeight: 50,
    color: gameColors.textPrimary,
  },
  submitButton: {
    backgroundColor: gameColors.primary.solid,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: gameColors.cardBg,
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    backgroundColor: gameColors.gray[300],
    opacity: 0.6,
  },
  successContainer: {
    backgroundColor: gameColors.correct.start + '20',
    borderColor: gameColors.correct.solid,
    borderWidth: 1,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: gameColors.correct.end,
    marginBottom: 5,
  },
  successSubText: {
    fontSize: 14,
    color: gameColors.correct.end,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: gameColors.primary.start + '20',
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: gameColors.primary.solid,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: gameColors.textSecondary,
    lineHeight: 20,
  },
});
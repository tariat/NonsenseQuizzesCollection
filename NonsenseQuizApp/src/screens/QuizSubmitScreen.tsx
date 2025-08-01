import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { QuizService } from '../services/quizService';

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
      <Text style={styles.title}>새 퀴즈 등록</Text>
      <Text style={styles.subtitle}>재미있는 넌센스 퀴즈를 등록해보세요!</Text>

      {/* 성공 메시지 */}
      {showSuccess && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>🎉 등록 완료!</Text>
          <Text style={styles.successSubText}>관리자 승인 후 게임에 추가됩니다</Text>
        </View>
      )}

      <View style={styles.formContainer}>
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

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '등록 중...' : '퀴즈 등록'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>📌 등록 안내</Text>
        <Text style={styles.infoText}>
          • 등록된 퀴즈는 관리자 승인 후 게임에 추가됩니다{'\n'}
          • 적절하지 않은 내용은 승인되지 않을 수 있습니다{'\n'}
          • 창의적이고 재미있는 퀴즈를 만들어주세요!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
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
    minHeight: 50,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  successContainer: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 5,
  },
  successSubText: {
    fontSize: 14,
    color: '#155724',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});
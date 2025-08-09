import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { gameColors } from '../constants/colors';
import AnimatedButton from '../components/AnimatedButton';
import { Quiz } from '../types';
import { QuizService } from '../services/quizService';

export default function QuizGameScreenSimple() {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        console.log('Loading quiz...');
        const quizzes = await QuizService.getRandomQuizzes(1, []);
        console.log('Quizzes loaded:', quizzes);
        
        if (quizzes.length > 0) {
          setCurrentQuiz(quizzes[0]);
          console.log('Quiz set:', quizzes[0]);
        } else {
          setError('퀴즈가 없습니다');
        }
      } catch (err) {
        console.error('Error loading quiz:', err);
        setError('퀴즈 로딩 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류'));
      } finally {
        setIsLoading(false);
      }
    };

    loadQuiz();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎯 퀴즈 로딩 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>❌ 오류 발생</Text>
        <Text style={styles.subtitle}>{error}</Text>
        <AnimatedButton 
          style={styles.button}
          onPress={() => {
            setIsLoading(true);
            setError(null);
          }}
        >
          <Text style={styles.buttonText}>다시 시도</Text>
        </AnimatedButton>
      </View>
    );
  }

  if (!currentQuiz) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>❓ 퀴즈가 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎮 퀴즈 게임</Text>
      <View style={styles.quizCard}>
        <Text style={styles.question}>{currentQuiz.question}</Text>
        <Text style={styles.answer}>정답: {currentQuiz.answer}</Text>
      </View>
      
      <AnimatedButton 
        style={styles.button}
        onPress={() => {
          Alert.alert('테스트', '게임 로직이 여기에 들어갑니다');
        }}
      >
        <Text style={styles.buttonText}>게임 시작</Text>
      </AnimatedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: gameColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: gameColors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  quizCard: {
    backgroundColor: gameColors.cardBg,
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    width: '100%',
    maxWidth: 400,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  answer: {
    fontSize: 16,
    color: gameColors.primary.solid,
    textAlign: 'center',
  },
  button: {
    backgroundColor: gameColors.primary.solid,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { gameColors } from '../constants/colors';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';
import { Quiz } from '../types';
import { QuizService } from '../services/quizService';
import { useSound } from '../contexts/SoundContext';
import { useFocusEffect } from '@react-navigation/native';

export default function QuizGameScreenMid() {
  const { startBackgroundMusic, stopBackgroundMusic, playCorrectSound, playWrongSound } = useSound();
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [charGrid, setCharGrid] = useState<string[]>([]);
  const [usedCharIndices, setUsedCharIndices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [gameState, setGameState] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [showResult, setShowResult] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState({ title: '', subtitle: '', isCorrect: false });

  // 화면 포커스 시 배경음악 시작/정지
  useFocusEffect(
    React.useCallback(() => {
      console.log('Game screen focused - starting background music');
      startBackgroundMusic();
      
      return () => {
        console.log('Game screen unfocused - stopping background music');
        stopBackgroundMusic();
      };
    }, [startBackgroundMusic, stopBackgroundMusic])
  );

  const createCharGrid = (answer: string) => {
    console.log('Creating char grid for:', answer);
    const answerChars = answer.split('').filter(char => char !== ' ');
    
    const distractorChars = ['가', '나', '다', '라', '마', '바', '사', '자', '차', '카', '타', '파', '하',
                           '고', '노', '도', '로', '모', '보', '소', '조', '초', '코', '토', '포', '호'];
    
    const numDistractors = Math.max(8, answerChars.length * 2);
    const selectedDistractors = distractorChars
      .sort(() => Math.random() - 0.5)
      .slice(0, numDistractors);
    
    const allChars = [...answerChars, ...selectedDistractors];
    const shuffledChars = allChars.sort(() => Math.random() - 0.5);
    
    setCharGrid(shuffledChars);
    console.log('Char grid created:', shuffledChars);
  };

  const loadQuiz = async () => {
    try {
      console.log('Loading quiz...');
      setIsLoading(true);
      const quizzes = await QuizService.getRandomQuizzes(1, []);
      
      if (quizzes.length === 0) {
        Alert.alert('오류', '사용 가능한 퀴즈가 없습니다.');
        return;
      }

      console.log('Quiz loaded:', quizzes[0]);
      setCurrentQuiz(quizzes[0]);
      createCharGrid(quizzes[0].answer);
    } catch (error) {
      console.error('Error loading quiz:', error);
      Alert.alert('오류', '퀴즈를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, []);

  const handleCharPress = (char: string, index: number) => {
    if (gameState !== 'playing' || usedCharIndices.includes(index)) return;
    
    console.log('Char pressed:', char, 'at index:', index);
    setSelectedChars(prev => [...prev, char]);
    setUsedCharIndices(prev => [...prev, index]);
  };

  const resetChar = (selectedIndex: number) => {
    if (gameState !== 'playing' || selectedIndex >= selectedChars.length) return;
    
    console.log('Resetting char at index:', selectedIndex, 'char:', selectedChars[selectedIndex]);
    
    // 선택된 글자 제거
    const newSelectedChars = [...selectedChars];
    const removedChar = newSelectedChars[selectedIndex];
    newSelectedChars.splice(selectedIndex, 1);
    setSelectedChars(newSelectedChars);
    
    // 해당 글자를 charGrid에서 다시 사용 가능하게 만들기
    const charGridIndex = usedCharIndices[selectedIndex];
    if (charGridIndex !== undefined) {
      const newUsedIndices = [...usedCharIndices];
      newUsedIndices.splice(selectedIndex, 1);
      setUsedCharIndices(newUsedIndices);
    }
  };

  const handleSubmit = () => {
    if (!currentQuiz || gameState !== 'playing') return;
    
    const userAnswer = selectedChars.join('');
    const normalizedUserAnswer = userAnswer.replace(/\s/g, '');
    const normalizedCorrectAnswer = currentQuiz.answer.replace(/\s/g, '');
    
    console.log('Submitted answer:', userAnswer);
    console.log('Correct answer:', currentQuiz.answer);
    
    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setGameState('correct');
      setScore(prev => prev + 1);
      playCorrectSound();
      setResultMessage({
        title: '🎉 정답!',
        subtitle: `정답: ${currentQuiz.answer}`,
        isCorrect: true
      });
      setShowResultModal(true);
    } else {
      setGameState('wrong');
      playWrongSound();
      setResultMessage({
        title: '❌ 오답!',
        subtitle: `정답: ${currentQuiz.answer}`,
        isCorrect: false
      });
      setShowResultModal(true);
    }
  };

  const handleNextQuestion = () => {
    setShowResultModal(false);
    setGameState('playing');
    setSelectedChars([]);
    setUsedCharIndices([]);
    loadQuiz();
  };

  const handleRetry = () => {
    setShowResultModal(false);
    setGameState('playing');
    setSelectedChars([]);
    setUsedCharIndices([]);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>퀴즈 로딩 중...</Text>
      </View>
    );
  }

  if (!currentQuiz) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>퀴즈를 찾을 수 없습니다</Text>
        <AnimatedButton style={styles.button} onPress={loadQuiz}>
          <Text style={styles.buttonText}>다시 시도</Text>
        </AnimatedButton>
      </View>
    );
  }

  // 간단한 답안 패턴 렌더링
  const answerChars = currentQuiz.answer.split('').filter(char => char !== ' ');
  const answerPattern = answerChars.map((char, index) => {
    const selectedChar = selectedChars[index] || '';
    const isSelected = selectedChar !== '';
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.answerBox,
          isSelected ? styles.answerBoxFilled : styles.answerBoxEmpty
        ]}
        onPress={() => {
          if (isSelected) {
            console.log('Resetting answer');
            setSelectedChars([]);
            setUsedCharIndices([]);
          }
        }}
      >
        <Text style={styles.answerBoxText}>
          {selectedChar}
        </Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.scoreText}>점수: {score}</Text>
        <Text style={styles.questionText}>{currentQuiz.question}</Text>
      </View>

      <AnimatedCard delay={0}>
        <View style={styles.answerContainer}>
          <View style={styles.answerPattern}>
            {answerPattern}
          </View>
        </View>
      </AnimatedCard>

      <AnimatedCard delay={100}>
        <View style={styles.charGridContainer}>
          {charGrid.map((char, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.charButton,
                usedCharIndices.includes(index) && styles.charButtonUsed
              ]}
              onPress={() => handleCharPress(char, index)}
              disabled={usedCharIndices.includes(index)}
            >
              <Text style={[
                styles.charButtonText,
                usedCharIndices.includes(index) && styles.charButtonTextUsed
              ]}>
                {char}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </AnimatedCard>

      <View style={styles.buttonContainer}>
        <AnimatedButton 
          style={[styles.resetButton]}
          onPress={() => {
            console.log('Resetting all');
            setSelectedChars([]);
            setUsedCharIndices([]);
          }}
        >
          <Text style={styles.resetButtonText}>초기화</Text>
        </AnimatedButton>
        
        <AnimatedButton 
          style={[styles.submitButton, selectedChars.length === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={selectedChars.length === 0}
        >
          <Text style={styles.submitButtonText}>제출</Text>
        </AnimatedButton>
      </View>

      {/* 결과 모달 */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <AnimatedCard delay={0}>
            <View style={[styles.modalContent, resultMessage.isCorrect ? styles.correctModal : styles.wrongModal]}>
              <Text style={styles.modalTitle}>{resultMessage.title}</Text>
              <Text style={styles.modalSubtitle}>{resultMessage.subtitle}</Text>
              
              <View style={styles.modalButtonContainer}>
                {!resultMessage.isCorrect && (
                  <AnimatedButton style={styles.modalRetryButton} onPress={handleRetry}>
                    <Text style={styles.modalButtonText}>다시 시도</Text>
                  </AnimatedButton>
                )}
                <AnimatedButton style={styles.modalNextButton} onPress={handleNextQuestion}>
                  <Text style={styles.modalButtonText}>다음 문제</Text>
                </AnimatedButton>
              </View>
            </View>
          </AnimatedCard>
        </View>
      </Modal>
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
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: gameColors.primary.solid,
    marginBottom: 10,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  answerContainer: {
    backgroundColor: gameColors.cardBg,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  answerPattern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  answerBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  answerBoxEmpty: {
    borderWidth: 2,
    borderColor: gameColors.gray[300],
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  answerBoxFilled: {
    borderWidth: 2,
    borderColor: gameColors.primary.solid,
    backgroundColor: gameColors.primary.start + '20',
  },
  answerBoxText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
  },
  spaceGap: {
    width: 12,
  },
  charGridContainer: {
    backgroundColor: gameColors.cardBg,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  charButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: gameColors.primary.solid,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  charButtonUsed: {
    backgroundColor: gameColors.gray[300],
  },
  charButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  charButtonTextUsed: {
    color: gameColors.gray[500],
  },
  submitButton: {
    flex: 2,
    backgroundColor: gameColors.correct.solid,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: gameColors.gray[300],
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  resetButton: {
    flex: 1,
    backgroundColor: gameColors.gray[400],
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: gameColors.cardBg,
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    maxWidth: 350,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  correctModal: {
    borderLeftWidth: 5,
    borderLeftColor: gameColors.correct.solid,
  },
  wrongModal: {
    borderLeftWidth: 5,
    borderLeftColor: gameColors.wrong.solid,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    color: gameColors.textSecondary,
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalRetryButton: {
    flex: 1,
    backgroundColor: gameColors.gray[400],
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalNextButton: {
    flex: 1,
    backgroundColor: gameColors.primary.solid,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    color: gameColors.textPrimary,
    textAlign: 'center',
    marginTop: 50,
  },
  button: {
    backgroundColor: gameColors.primary.solid,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 20,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
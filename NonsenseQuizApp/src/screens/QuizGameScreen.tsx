import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import GameEndModal from '../components/GameEndModal';
import { Quiz } from '../types';
import { QuizService } from '../services/quizService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function QuizGameScreen() {
  const navigation = useNavigation();
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [wordGrid, setWordGrid] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [isAnswerComplete, setIsAnswerComplete] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [usedQuizIds, setUsedQuizIds] = useState<string[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [charGrid, setCharGrid] = useState<string[]>([]);
  const [usedCharIndices, setUsedCharIndices] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [showResult, setShowResult] = useState(false);
  const [autoNextTimer, setAutoNextTimer] = useState<NodeJS.Timeout | null>(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [totalQuestions] = useState(10); // 총 10문제
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60초 제한
  const [gameTimer, setGameTimer] = useState<NodeJS.Timeout | null>(null);
  const [gameQuizzes, setGameQuizzes] = useState<Quiz[]>([]); // 게임용 퀴즈 목록
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0); // 현재 퀴즈 인덱스
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false); // 퀴즈 로딩 상태
  const [sessionId] = useState(() => Math.random().toString(36).substring(7)); // 세션 ID
  const [allUsedQuizIds, setAllUsedQuizIds] = useState<string[]>([]); // 전체 세션에서 사용된 퀴즈 IDs
  const [totalRounds, setTotalRounds] = useState(1); // 총 라운드 수
  const [isPerfectScore, setIsPerfectScore] = useState(false); // 완벽한 점수 여부
  const [isAllQuizzesCompleted, setIsAllQuizzesCompleted] = useState(false); // 모든 퀴즈 완료 여부

  // 게임 타이머 정지
  const stopQuestionTimer = React.useCallback(() => {
    if (gameTimer) {
      clearInterval(gameTimer);
      setGameTimer(null);
    }
  }, [gameTimer]);

  // 게임 초기화 - 퀴즈들을 한 번에 로드
  const initializeGame = React.useCallback(async (isNewRound: boolean = false) => {
    setIsLoadingQuizzes(true);
    try {
      console.log('Initializing game, loading quizzes from database...');
      const excludeIds = isNewRound ? allUsedQuizIds : [];
      const quizzes = await QuizService.getRandomQuizzes(totalQuestions, excludeIds);
      
      if (quizzes.length === 0) {
        if (isNewRound && allUsedQuizIds.length > 0) {
          // 더 이상 새로운 퀴즈가 없음
          console.log('No more new quizzes available');
          setIsAllQuizzesCompleted(true);
          setGameCompleted(true);
          return;
        }
        Alert.alert('오류', '사용 가능한 퀴즈가 없습니다. 나중에 다시 시도해주세요.');
        return;
      }
      
      console.log(`Loaded ${quizzes.length} quizzes for the game (round ${totalRounds})`);
      setGameQuizzes(quizzes);
      setCurrentQuizIndex(0);
      
      // 사용된 퀴즈 ID들을 전체 목록에 추가
      const newUsedIds = quizzes.map(quiz => quiz.id);
      setAllUsedQuizIds(prev => [...prev, ...newUsedIds]);
      
      // 첫 번째 퀴즈 로드
      loadCurrentQuiz(quizzes[0]);
    } catch (error) {
      console.error('Error initializing game:', error);
      Alert.alert('오류', '퀴즈를 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoadingQuizzes(false);
    }
  }, [allUsedQuizIds, totalRounds, totalQuestions]);

  // createCharGrid 함수 정의
  const createCharGrid = React.useCallback((answer: string) => {
    // 정답에서 공백을 제외한 글자만 분리
    const answerChars = answer.split('').filter(char => char !== ' ');
    
    // 방해 글자들 생성
    const distractorChars = ['가', '나', '다', '라', '마', '바', '사', '자', '차', '카', '타', '파', '하',
                           '고', '노', '도', '로', '모', '보', '소', '조', '초', '코', '토', '포', '호',
                           '구', '누', '두', '루', '무', '부', '수', '주', '추', '쿠', '투', '푸', '후'];
    
    // 필요한 만큼 방해 글자 선택 (정답 글자 수의 2-3배)
    const numDistractors = Math.max(8, answerChars.length * 2);
    const selectedDistractors = distractorChars
      .sort(() => Math.random() - 0.5)
      .slice(0, numDistractors);
    
    // 정답 글자와 방해 글자 합치고 섞기
    const allChars = [...answerChars, ...selectedDistractors];
    const shuffledChars = allChars.sort(() => Math.random() - 0.5);
    
    setCharGrid(shuffledChars);
    setSelectedChars([]);
    setUsedCharIndices([]);
    setSelectedWords([]);
    setIsAnswerComplete(false);
    setShowNextButton(false);
    setShowRatingModal(false);
    setGameState('playing');
    setShowResult(false);
    
    // 기존 타이머 정리
    if (autoNextTimer) {
      clearTimeout(autoNextTimer);
      setAutoNextTimer(null);
    }
    
    // 새 문제 타이머 시작
    startQuestionTimer();
  }, [autoNextTimer]);

  // 시간 초과 처리
  const handleTimeUp = React.useCallback(() => {
    if (gameState !== 'playing') return;
    
    setGameState('wrong');
    setShowResult(true);
    stopQuestionTimer();
    
    // 3초 후 자동으로 다음 문제로
    const timer = setTimeout(() => {
      if (currentQuestionNumber >= totalQuestions) {
        // 게임 완료 - 시간 초과로 끝났으므로 완벽 점수는 불가능
        const isPerfect = score === totalQuestions;
        console.log(`Game completed (timeout)! Score: ${score}/${totalQuestions}, Perfect: ${isPerfect}`);
        
        setIsPerfectScore(isPerfect);
        setGameCompleted(true);
      } else {
        moveToNextQuiz();
      }
    }, 3000);
    setAutoNextTimer(timer);
  }, [gameState, currentQuestionNumber, totalQuestions, stopQuestionTimer]);

  // 게임 타이머 시작
  const startQuestionTimer = React.useCallback(() => {
    setTimeLeft(60);
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          // 시간 초과
          handleTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    setGameTimer(timer);
  }, [handleTimeUp]);

  // 현재 퀴즈 로드
  const loadCurrentQuiz = React.useCallback((quiz: Quiz) => {
    console.log('Loading quiz:', quiz.question);
    setCurrentQuiz(quiz);
    createCharGrid(quiz.answer);
  }, [createCharGrid]);

  // 화면이 포커스될 때마다 새 게임 시작
  useFocusEffect(
    React.useCallback(() => {
      console.log('=== QuizGameScreen focused ===');
      console.log('Current gameCompleted state:', gameCompleted);
      console.log('Current score:', score);
      console.log('Starting fresh game initialization...');
      
      // 모든 타이머 정리
      if (gameTimer) {
        clearInterval(gameTimer);
        setGameTimer(null);
      }
      if (autoNextTimer) {
        clearTimeout(autoNextTimer);
        setAutoNextTimer(null);
      }
      
      // 게임 상태 완전 초기화
      setCurrentQuestionNumber(1);
      setScore(0);
      setUsedQuizIds([]);
      setUsedCharIndices([]);
      setGameCompleted(false);
      setGameQuizzes([]);
      setCurrentQuizIndex(0);
      setAllUsedQuizIds([]);
      setTotalRounds(1);
      setIsPerfectScore(false);
      setIsAllQuizzesCompleted(false);
      setCurrentQuiz(null);
      setSelectedChars([]);
      setCharGrid([]);
      setGameState('playing');
      setShowResult(false);
      setShowRatingModal(false);
      setTimeLeft(60);
      
      console.log('Game state reset complete, loading new quizzes...');
      
      // 새 게임 시작
      const startGame = async () => {
        setIsLoadingQuizzes(true);
        try {
          console.log(`Fetching fresh quizzes from database (requesting ${totalQuestions} quizzes)...`);
          const quizzes = await QuizService.getRandomQuizzes(totalQuestions, []);
          console.log(`Loaded ${quizzes.length} quizzes from database`);
          
          if (quizzes.length === 0) {
            Alert.alert('오류', '사용 가능한 퀴즈가 없습니다.');
            return;
          }
          
          if (quizzes.length < totalQuestions) {
            console.warn(`Warning: Only ${quizzes.length} quizzes available, but ${totalQuestions} requested. Will reuse quizzes to complete the game.`);
          }
          
          setGameQuizzes(quizzes);
          setCurrentQuizIndex(0);
          setAllUsedQuizIds(quizzes.map(q => q.id));
          
          // 첫 번째 퀴즈 로드
          console.log('Loading first quiz:', quizzes[0].question);
          setCurrentQuiz(quizzes[0]);
          createCharGrid(quizzes[0].answer);
          
          console.log('Game initialization complete!');
        } catch (error) {
          console.error('Error starting game:', error);
          Alert.alert('오류', '게임을 시작할 수 없습니다.');
        } finally {
          setIsLoadingQuizzes(false);
        }
      };
      
      startGame();
      
      // 화면이 언포커스될 때 타이머 정리
      return () => {
        console.log('=== QuizGameScreen unfocused, cleaning up ===');
        if (autoNextTimer) {
          clearTimeout(autoNextTimer);
        }
        if (gameTimer) {
          clearInterval(gameTimer);
        }
      };
    }, [totalQuestions])
  );

  // 게임 로직 함수들은 위에서 React.useCallback으로 이미 정의됨
  
  // 다음 퀴즈로 이동 (새로 정의 - 위에서 정의된 것 사용하지 않음)
  const moveToNextQuiz = () => {
    if (currentQuestionNumber >= totalQuestions) {
      // 게임 완료 - 현재 점수로 완벽성 체크 (점수는 이미 업데이트됨)
      const isPerfect = score === totalQuestions;
      console.log(`Game completed! Score: ${score}/${totalQuestions}, Perfect: ${isPerfect}`);
      
      setIsPerfectScore(isPerfect);
      setGameCompleted(true);
      return;
    }

    const nextIndex = currentQuizIndex + 1;
    
    // 현재 로드된 퀴즈 범위 내에서 다음 퀴즈 선택
    if (nextIndex < gameQuizzes.length) {
      setCurrentQuizIndex(nextIndex);
      setCurrentQuestionNumber(currentQuestionNumber + 1);
      setCurrentQuiz(gameQuizzes[nextIndex]);
      createCharGrid(gameQuizzes[nextIndex].answer);
    } else {
      // 퀴즈가 부족한 경우 - 처음부터 다시 반복
      console.log(`Not enough quizzes loaded (${gameQuizzes.length}), reusing from beginning`);
      const reusedIndex = currentQuestionNumber % gameQuizzes.length;
      setCurrentQuizIndex(reusedIndex);
      setCurrentQuestionNumber(currentQuestionNumber + 1);
      setCurrentQuiz(gameQuizzes[reusedIndex]);
      createCharGrid(gameQuizzes[reusedIndex].answer);
    }
  };

  const handleCharPress = (char: string, index: number) => {
    if (gameState !== 'playing' || usedCharIndices.includes(index)) return;
    
    const newSelectedChars = [...selectedChars, char];
    const newUsedIndices = [...usedCharIndices, index];
    
    setSelectedChars(newSelectedChars);
    setUsedCharIndices(newUsedIndices);
  };

  const handleSubmit = () => {
    if (!currentQuiz || gameState !== 'playing') return;
    
    // 타이머 정지
    stopQuestionTimer();
    
    const userAnswer = selectedChars.join('');
    // 띄어쓰기를 무시하고 정답 비교
    const normalizedUserAnswer = userAnswer.replace(/\s/g, '');
    const normalizedCorrectAnswer = currentQuiz.answer.replace(/\s/g, '');
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    
    if (isCorrect) {
      setGameState('correct');
      setScore(score + 1);
    } else {
      setGameState('wrong');
    }
    
    setShowResult(true);
    
    // 3초 후 자동으로 다음 문제로 넘어가기
    const timer = setTimeout(() => {
      const finalScore = isCorrect ? score + 1 : score;
      
      if (currentQuestionNumber >= totalQuestions) {
        // 게임 완료 - 점수 체크
        const isPerfect = finalScore === totalQuestions;
        console.log(`Game completed! Score: ${finalScore}/${totalQuestions}, Perfect: ${isPerfect}`);
        
        setIsPerfectScore(isPerfect);
        setGameCompleted(true);
      } else {
        // 다음 문제로
        moveToNextQuiz();
      }
    }, 3000);
    setAutoNextTimer(timer);
  };

  const showRatingButtons = () => {
    console.log('Showing rating buttons');
    setShowRatingModal(true);
  };

  const rateQuiz = async (rating: 'like' | 'dislike' | 'pass') => {
    if (!currentQuiz) return;
    
    try {
      // 퀴즈 평가를 DB에 저장
      console.log('Saving quiz rating:', rating, 'for quiz:', currentQuiz.id);
      const success = await QuizService.rateQuiz(currentQuiz.id, rating, sessionId);
      
      if (success) {
        console.log('Rating saved successfully');
      } else {
        console.log('Failed to save rating');
      }
    } catch (error) {
      console.error('Error saving rating:', error);
    }
    
    setShowRatingModal(false);
    
    // 기존 타이머 정리
    if (autoNextTimer) {
      clearTimeout(autoNextTimer);
      setAutoNextTimer(null);
    }
    
    stopQuestionTimer();
    
    if (currentQuestionNumber >= totalQuestions) {
      // 게임 완료
      const isPerfect = score === totalQuestions;
      console.log(`Game completed (rated)! Score: ${score}/${totalQuestions}, Perfect: ${isPerfect}`);
      
      setIsPerfectScore(isPerfect);
      setGameCompleted(true);
    } else {
      // 다음 문제로
      moveToNextQuiz();
    }
  };

  const resetChar = (selectedIndex: number) => {
    if (gameState !== 'playing') return;
    
    // 선택된 글자 목록에서 해당 인덱스의 글자 제거
    const newSelectedChars = selectedChars.filter((_, i) => i !== selectedIndex);
    setSelectedChars(newSelectedChars);
    
    // 사용된 차트 인덱스에서도 해당하는 원래 인덱스 제거
    const removedCharGridIndex = usedCharIndices[selectedIndex];
    const newUsedIndices = usedCharIndices.filter((_, i) => i !== selectedIndex);
    setUsedCharIndices(newUsedIndices);
  };

  const handleNextQuestion = () => {
    console.log('Next question button clicked');
    showRatingButtons();
  };

  const handleSkipQuestion = () => {
    Alert.alert(
      '이 문제를 건너뛰시겠어요?',
      '점수는 그대로 유지됩니다.',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '건너뛰기', 
          onPress: () => {
            stopQuestionTimer();
            if (currentQuestionNumber >= totalQuestions) {
              // 게임 완료
              const isPerfect = score === totalQuestions;
              console.log(`Game completed (skipped)! Score: ${score}/${totalQuestions}, Perfect: ${isPerfect}`);
              
              setIsPerfectScore(isPerfect);
              setGameCompleted(true);
            } else {
              moveToNextQuiz();
            }
          }
        }
      ]
    );
  };

  // startNewGame은 이미 위에서 정의됨

  const continueChallenge = async () => {
    console.log('Starting new challenge round... Current score:', score);
    setCurrentQuestionNumber(1); // 문제 번호만 리셋
    // setScore(0); // 점수는 유지!
    setUsedQuizIds([]);
    setUsedCharIndices([]);
    setGameCompleted(false);
    setGameQuizzes([]);
    setCurrentQuizIndex(0);
    setTotalRounds(prev => prev + 1);
    setIsPerfectScore(false);
    stopQuestionTimer();

    // 새로운 퀴즈 로드 (이전에 사용한 퀴즈 제외)
    setIsLoadingQuizzes(true);
    try {
      const quizzes = await QuizService.getRandomQuizzes(totalQuestions, allUsedQuizIds);
      if (quizzes.length === 0) {
        // 더 이상 새로운 퀴즈가 없으면 알림만 표시하고 게임 상태는 유지
        Alert.alert('알림', '더 이상 새로운 퀴즈가 없습니다.\n기존 퀴즈로 계속 진행됩니다.');
        // 기존 퀴즈를 재사용하여 계속 진행
        const reusedQuizzes = await QuizService.getRandomQuizzes(totalQuestions, []);
        if (reusedQuizzes.length === 0) {
          Alert.alert('오류', '사용 가능한 퀴즈가 없습니다.');
          return;
        }
        setGameQuizzes(reusedQuizzes);
        setCurrentQuizIndex(0);
        setCurrentQuiz(reusedQuizzes[0]);
        createCharGrid(reusedQuizzes[0].answer);
      } else {
        setGameQuizzes(quizzes);
        setCurrentQuizIndex(0);
        setAllUsedQuizIds(prev => [...prev, ...quizzes.map(q => q.id)]);
        setCurrentQuiz(quizzes[0]);
        createCharGrid(quizzes[0].answer);
      }
    } catch (error) {
      console.error('Error starting new challenge:', error);
      Alert.alert('오류', '새로운 도전을 시작할 수 없습니다.');
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  if (gameCompleted) {
    return (
      <View style={styles.container}>
        <GameEndModal
          visible={gameCompleted}
          score={score}
          isPerfectScore={isPerfectScore}
          onClose={() => {
            console.log('GameEndModal onClose called, navigating to scoreboard');
            setGameCompleted(false);
            navigation.navigate('Scoreboard' as never);
          }}
          onScoreSaved={() => {
            console.log('GameEndModal onScoreSaved called, navigating to scoreboard');
            setGameCompleted(false);
            navigation.navigate('Scoreboard' as never);
          }}
          onContinueChallenge={() => {
            console.log('GameEndModal onContinueChallenge called');
            setGameCompleted(false); // 모달 닫기
            continueChallenge(); // 새로운 도전 시작
          }}
        />
      </View>
    );
  }

  // 퀴즈 로딩 중일 때
  if (isLoadingQuizzes) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🎯 퀴즈를 준비하고 있어요...</Text>
          <Text style={styles.loadingSubText}>잠시만 기다려주세요</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>점수: {score}</Text>
        <Text style={styles.progressText}>
          {currentQuestionNumber} / {totalQuestions} 문제
        </Text>
      </View>

      {/* 타이머 표시 */}
      <View style={styles.timerContainer}>
        <Text style={[
          styles.timerText, 
          timeLeft <= 10 && styles.timerWarning,
          timeLeft <= 5 && styles.timerDanger
        ]}>
          ⏰ {timeLeft}초
        </Text>
        <View style={styles.timerBarContainer}>
          <View 
            style={[
              styles.timerBar, 
              { width: `${(timeLeft / 60) * 100}%` },
              timeLeft <= 10 && styles.timerBarWarning,
              timeLeft <= 5 && styles.timerBarDanger
            ]} 
          />
        </View>
      </View>

      {/* 진행률 바 */}
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${(currentQuestionNumber / totalQuestions) * 100}%` }
          ]} 
        />
      </View>

      {currentQuiz && (
        <View style={styles.questionContainer}>
          <Text style={styles.question}>{currentQuiz.question}</Text>
        </View>
      )}

      <View style={styles.answerContainer}>
        <Text style={styles.answerLabel}>내 답안:</Text>
        <View style={styles.answerPatternContainer}>
          {currentQuiz && (() => {
            const answerChars = currentQuiz.answer.split('');
            let charIndex = 0; // 비 공백 문자 인덱스
            
            return answerChars.map((answerChar, index) => {
              if (answerChar === ' ') {
                // 빈 자리는 간격으로 표시
                return <View key={index} style={styles.spaceGap} />;
              } else {
                // 일반 문자는 점선 상자로 표시
                const currentCharIndex = charIndex;
                const userChar = selectedChars[currentCharIndex] || '';
                charIndex++;
                
                return (
                  <TouchableOpacity 
                    key={index}
                    style={[
                      styles.answerBox,
                      userChar ? styles.answerBoxFilled : styles.answerBoxEmpty
                    ]}
                    onPress={() => {
                      if (userChar && currentCharIndex < selectedChars.length) {
                        resetChar(currentCharIndex);
                      }
                    }}
                  >
                    <Text style={[
                      styles.answerBoxText,
                      !userChar && styles.answerBoxTextEmpty
                    ]}>
                      {userChar || ''}
                    </Text>
                  </TouchableOpacity>
                );
              }
            });
          })()}
        </View>
      </View>

      {/* 제출 버튼 */}
      {gameState === 'playing' && (
        <TouchableOpacity 
          style={[styles.submitButton, selectedChars.length === 0 && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={selectedChars.length === 0}
        >
          <Text style={styles.submitButtonText}>제출하기</Text>
        </TouchableOpacity>
      )}

      {/* 결과 표시 */}
      {showResult && (
        <View style={styles.resultContainer}>
          <View style={[
            styles.resultCard,
            gameState === 'correct' ? styles.correctCard : styles.wrongCard
          ]}>
            <Text style={styles.resultIcon}>
              {gameState === 'correct' ? '🎉' : '😅'}
            </Text>
            <Text style={styles.resultText}>
              {gameState === 'correct' ? '정답입니다!' : 
               timeLeft === 0 ? '시간 초과!' : '틀렸습니다!'}
            </Text>
            {gameState === 'wrong' && currentQuiz && (
              <Text style={styles.correctAnswerText}>
                정답: {currentQuiz.answer}
              </Text>
            )}
            
            {/* 평가 버튼들 */}
            <View style={styles.inlineRatingContainer}>
              <TouchableOpacity 
                style={[styles.inlineRatingButton, styles.inlineLikeButton]} 
                onPress={() => rateQuiz('like')}
              >
                <Text style={styles.inlineRatingText}>👍 좋아요</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.inlineRatingButton, styles.inlineDislikeButton]} 
                onPress={() => rateQuiz('dislike')}
              >
                <Text style={styles.inlineRatingText}>👎 싫어요</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.inlineRatingButton, styles.inlinePassButton]} 
                onPress={() => rateQuiz('pass')}
              >
                <Text style={styles.inlineRatingText}>⏭️ 패스</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.autoNextText}>3초 후 다음 문제로 넘어갑니다...</Text>
          </View>
        </View>
      )}

      <View style={styles.charGridContainer}>
        {charGrid.map((char, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.charButton,
              usedCharIndices.includes(index) && styles.charButtonUsed,
              gameState !== 'playing' && styles.charButtonDisabled
            ]}
            onPress={() => handleCharPress(char, index)}
            disabled={gameState !== 'playing' || usedCharIndices.includes(index)}
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

      {/* 건너뛰기 버튼 */}
      {gameState === 'playing' && (
        <View style={styles.skipContainer}>
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={handleSkipQuestion}
          >
            <Text style={styles.skipButtonText}>문제 건너뛰기</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  progressBarContainer: {
    backgroundColor: '#e0e0e0',
    height: 8,
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    backgroundColor: '#2196F3',
    height: '100%',
    borderRadius: 4,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  timerWarning: {
    color: '#FF9800',
  },
  timerDanger: {
    color: '#F44336',
  },
  timerBarContainer: {
    backgroundColor: '#e0e0e0',
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  timerBar: {
    backgroundColor: '#4CAF50',
    height: '100%',
    borderRadius: 3,
    transition: 'width 1s ease',
  },
  timerBarWarning: {
    backgroundColor: '#FF9800',
  },
  timerBarDanger: {
    backgroundColor: '#F44336',
  },
  questionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  answerContainer: {
    marginBottom: 20,
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  answerPatternContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    minHeight: 50,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  answerBox: {
    width: 35,
    height: 35,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  answerBoxEmpty: {
    borderColor: '#ddd',
    borderStyle: 'dashed',
    backgroundColor: '#f9f9f9',
  },
  answerBoxFilled: {
    borderColor: '#2196F3',
    borderStyle: 'solid',
    backgroundColor: '#2196F3',
  },
  answerBoxText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  answerBoxTextEmpty: {
    color: '#ccc',
  },
  spaceGap: {
    width: 12,
    height: 35,
  },
  selectedCharsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 50,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2196F3',
    alignItems: 'center',
  },
  selectedChar: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 35,
    alignItems: 'center',
  },
  selectedCharText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginVertical: 15,
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  correctCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  wrongCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#F44336',
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  inlineRatingContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  inlineRatingButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  inlineLikeButton: {
    backgroundColor: '#4CAF50',
  },
  inlineDislikeButton: {
    backgroundColor: '#F44336',
  },
  inlinePassButton: {
    backgroundColor: '#FF9800',
  },
  inlineRatingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  autoNextText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  charGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginVertical: 10,
  },
  charButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 45,
    minHeight: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  charButtonUsed: {
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
  },
  charButtonDisabled: {
    opacity: 0.3,
  },
  charButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  charButtonTextUsed: {
    color: '#999',
  },
  skipContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
  gameCompletedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  gameCompletedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  gameCompletedSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
    marginTop: 30,
  },
  gameButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  challengeButton: {
    backgroundColor: '#FF9800',
  },
  challengeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  newGameButton: {
    backgroundColor: '#2196F3',
  },
  newGameButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  perfectMessage: {
    fontSize: 16,
    color: '#FF9800',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
  completionMessage: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Image } from 'react-native';
import GameEndModal from '../components/GameEndModal';
import AnimatedScoreCounter from '../components/AnimatedScoreCounter';
import AnimatedResultCard from '../components/AnimatedResultCard';
import AnimatedCard from '../components/AnimatedCard';
import AnswerBoxes from '../components/AnswerBoxes';
import { Quiz } from '../types';
import { QuizService } from '../services/quizService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { gameColors } from '../constants/colors';
import AnimatedButton from '../components/AnimatedButton';
import { useSound } from '../contexts/SoundContext';

export default function QuizGameScreen() {
  const navigation = useNavigation();
  const { playCorrectSound, playWrongSound, playTimeoutSound, playCompletionSound, startBackgroundMusic, stopBackgroundMusic } = useSound();
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [wordGrid, setWordGrid] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [previousScore, setPreviousScore] = useState(0);
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
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoNextTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [gameQuizzes, setGameQuizzes] = useState<Quiz[]>([]); // 게임용 퀴즈 목록
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0); // 현재 퀴즈 인덱스
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false); // 퀴즈 로딩 상태
  const [sessionId] = useState(() => Math.random().toString(36).substring(7)); // 세션 ID
  const [allUsedQuizIds, setAllUsedQuizIds] = useState<string[]>([]); // 전체 세션에서 사용된 퀴즈 IDs
  const [totalRounds, setTotalRounds] = useState(1); // 총 라운드 수
  const [isPerfectScore, setIsPerfectScore] = useState(false); // 완벽한 점수 여부
  const [isAllQuizzesCompleted, setIsAllQuizzesCompleted] = useState(false); // 모든 퀴즈 완료 여부

  // 게임 타이머 정지 (ref 기반)
  const stopQuestionTimer = useCallback(() => {
    console.log('Stopping question timer, current timer:', gameTimerRef.current);
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
      setGameTimer(null);
      console.log('Question timer cleared');
    }
  }, []);

  // 게임 초기화 - 퀴즈들을 한 번에 로드
  const initializeGame = useCallback(async (isNewRound: boolean = false) => {
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
  const createCharGrid = useCallback((answer: string) => {
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
    
    // 기존 타이머 정리 (ref + state 둘 다)
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    if (autoNextTimer) {
      clearTimeout(autoNextTimer);
      setAutoNextTimer(null);
    }
    
    // 새 문제 타이머 시작
    startQuestionTimer();
  }, []);

  // 시간 초과 처리
  const handleTimeUp = useCallback(() => {
    console.log('handleTimeUp called, current gameState:', gameState);
    
    // 더 엄격한 상태 체크
    if (gameState !== 'playing') {
      console.log('Ignoring handleTimeUp - not in playing state, current state:', gameState);
      return;
    }
    
    console.log('Processing timeout...');
    
    // 모든 타이머 즉시 정리 (순서 중요)
    stopQuestionTimer();
    
    // 기존 autoNextTimer가 있다면 정리 (ref + state 둘 다)
    if (autoNextTimerRef.current) {
      console.log('Clearing existing autoNextTimerRef in handleTimeUp');
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    if (autoNextTimer) {
      console.log('Clearing existing autoNextTimer state in handleTimeUp');
      clearTimeout(autoNextTimer);
      setAutoNextTimer(null);
    }
    
    // 상태 변경
    setGameState('wrong');
    setShowResult(true);
    
    // 소리 재생 (한 번만)
    playTimeoutSound();
    
    // 3초 후 자동으로 다음 문제로
    const timer = setTimeout(() => {
      console.log('Auto-next timeout triggered');
      setCurrentQuestionNumber(prevNum => {
        if (prevNum >= totalQuestions) {
          // 게임 완료 - 시간 초과로 끝났으므로 완벽 점수는 불가능
          setScore(prevScore => {
            const isPerfect = prevScore === totalQuestions;
            console.log(`Game completed (timeout)! Score: ${prevScore}/${totalQuestions}, Perfect: ${isPerfect}`);
            
            setIsPerfectScore(isPerfect);
            setGameCompleted(true);
            playCompletionSound();
            return prevScore;
          });
        } else {
          console.log('Moving to next quiz after timeout');
          // moveToNextQuiz 대신 직접 처리
          setTimeout(() => moveToNextQuiz(), 100);
        }
        return prevNum;
      });
    }, 3000);
    
    console.log('Setting new autoNextTimer');
    autoNextTimerRef.current = timer;
    setAutoNextTimer(timer);
  }, [gameState, stopQuestionTimer, playTimeoutSound, playCompletionSound]);

  // 게임 타이머 시작
  const startQuestionTimer = useCallback(() => {
    console.log('Starting question timer, gameCompleted:', gameCompleted);
    
    // 게임이 완료된 상태라면 타이머 시작하지 않음
    if (gameCompleted) {
      console.log('Game completed, not starting timer');
      return;
    }
    
    // 기존 타이머가 있다면 먼저 정리 (ref + state 둘 다)
    if (gameTimerRef.current) {
      console.log('Clearing existing gameTimerRef');
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    if (gameTimer) {
      console.log('Clearing existing gameTimer state');
      clearInterval(gameTimer);
      setGameTimer(null);
    }
    
    setTimeLeft(60);
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        console.log('Timer tick, time left:', prevTime - 1);
        if (prevTime <= 1) {
          // 시간 초과 - 타이머 즉시 정리 (ref + state 둘 다)
          console.log('Time up! Clearing timer and calling handleTimeUp');
          clearInterval(timer);
          if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current);
            gameTimerRef.current = null;
          }
          setGameTimer(null);
          
          // 다음 tick에서 handleTimeUp 호출하여 상태 충돌 방지
          setTimeout(() => handleTimeUp(), 0);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // ref와 state 둘 다에 저장
    gameTimerRef.current = timer;
    setGameTimer(timer);
    console.log('Question timer started with ID:', timer);
  }, [gameCompleted, handleTimeUp]);

  // 현재 퀴즈 로드
  const loadCurrentQuiz = useCallback((quiz: Quiz) => {
    console.log('Loading quiz:', quiz.question);
    setCurrentQuiz(quiz);
    createCharGrid(quiz.answer);
  }, [createCharGrid]);

  // 화면이 포커스될 때마다 새 게임 시작
  useFocusEffect(
    useCallback(() => {
      console.log('=== QuizGameScreen focused ===');
      console.log('Starting fresh game initialization...');
      
      // 배경음악 시작
      startBackgroundMusic();
      
      // 모든 타이머 강제 정리 (ref + state 둘 다)
      if (gameTimerRef.current) {
        console.log('Clearing existing gameTimerRef on focus');
        clearInterval(gameTimerRef.current);
        gameTimerRef.current = null;
      }
      if (autoNextTimerRef.current) {
        console.log('Clearing existing autoNextTimerRef on focus');
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
      if (gameTimer) {
        console.log('Clearing existing gameTimer state on focus');
        clearInterval(gameTimer);
        setGameTimer(null);
      }
      if (autoNextTimer) {
        console.log('Clearing existing autoNextTimer state on focus');
        clearTimeout(autoNextTimer);
        setAutoNextTimer(null);
      }
      
      // 게임 상태 완전 초기화
      setCurrentQuestionNumber(1);
      setScore(0);
      setPreviousScore(0);
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
          
          setGameQuizzes(quizzes);
          setCurrentQuizIndex(0);
          setAllUsedQuizIds(quizzes.map(q => q.id));
          
          // 첫 번째 퀴즈 로드
          console.log('Loading first quiz:', quizzes[0].question);
          setCurrentQuiz(quizzes[0]);
          createCharGrid(quizzes[0].answer);
          
          console.log('Game initialization complete!');
          
          // 첫 번째 퀴즈 타이머 시작
          console.log('Starting timer for first quiz');
          setTimeout(() => {
            startQuestionTimer();
          }, 100);
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
        
        // 배경음악 정지
        stopBackgroundMusic();
        
        // 모든 타이머 정리 (상태 참조 없이 안전하게 정리)
        console.log('Cleaning up all timers on unfocus');
        
        // ref 기반 타이머 강제 정리
        if (gameTimerRef.current) {
          console.log('Force clearing gameTimerRef on unfocus');
          clearInterval(gameTimerRef.current);
          gameTimerRef.current = null;
        }
        
        if (autoNextTimerRef.current) {
          console.log('Force clearing autoNextTimerRef on unfocus');
          clearTimeout(autoNextTimerRef.current);
          autoNextTimerRef.current = null;
        }
        
        // 상태 기반 타이머도 정리
        setAutoNextTimer(prevTimer => {
          if (prevTimer) {
            console.log('Clearing autoNextTimer state on unfocus');
            clearTimeout(prevTimer);
          }
          return null;
        });
        
        setGameTimer(prevTimer => {
          if (prevTimer) {
            console.log('Clearing gameTimer state on unfocus');
            clearInterval(prevTimer);
          }
          return null;
        });
        
        // 타이머 관련 상태 완전 초기화
        setTimeLeft(0);
        setGameState('playing');
      };
    }, [])
  );


  // 게임 로직 함수들은 위에서 React.useCallback으로 이미 정의됨
  
  // 다음 퀴즈로 이동 (새로 정의 - 위에서 정의된 것 사용하지 않음)
  const moveToNextQuiz = () => {
    console.log('moveToNextQuiz called, current question:', currentQuestionNumber, 'total:', totalQuestions);
    console.log('Available quizzes:', gameQuizzes.length);
    
    // 퀴즈가 없는 경우 새로 로드 시도
    if (!gameQuizzes || gameQuizzes.length === 0) {
      console.error('No quizzes available, trying to load new quizzes');
      const loadNewQuizzes = async () => {
        try {
          const quizzes = await QuizService.getRandomQuizzes(totalQuestions, []);
          if (quizzes.length > 0) {
            setGameQuizzes(quizzes);
            setCurrentQuizIndex(0);
            setCurrentQuiz(quizzes[0]);
            createCharGrid(quizzes[0].answer);
            setCurrentQuestionNumber(currentQuestionNumber + 1);
            startQuestionTimer();
          } else {
            console.error('No quizzes found, ending game');
            setGameCompleted(true);
          }
        } catch (error) {
          console.error('Failed to load new quizzes:', error);
          setGameCompleted(true);
        }
      };
      loadNewQuizzes();
      return;
    }
    
    // 상태 초기화
    setGameState('playing');
    setShowResult(false);
    setShowRatingModal(false);
    setSelectedChars([]);
    setUsedCharIndices([]);
    
    // 기존 타이머들 정리 (ref + state 둘 다)
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    if (autoNextTimer) {
      clearTimeout(autoNextTimer);
      setAutoNextTimer(null);
    }
    stopQuestionTimer();
    
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
      const nextQuiz = gameQuizzes[nextIndex];
      if (nextQuiz && nextQuiz.answer) {
        setCurrentQuizIndex(nextIndex);
        setCurrentQuestionNumber(currentQuestionNumber + 1);
        setCurrentQuiz(nextQuiz);
        createCharGrid(nextQuiz.answer);
      } else {
        console.error('Next quiz is invalid:', nextQuiz);
        setGameCompleted(true);
        return;
      }
    } else {
      // 퀴즈가 부족한 경우 - 처음부터 다시 반복
      console.log(`Not enough quizzes loaded (${gameQuizzes.length}), reusing from beginning`);
      const reusedIndex = currentQuestionNumber % gameQuizzes.length;
      const reusedQuiz = gameQuizzes[reusedIndex];
      
      if (reusedQuiz && reusedQuiz.answer) {
        setCurrentQuizIndex(reusedIndex);
        setCurrentQuestionNumber(currentQuestionNumber + 1);
        setCurrentQuiz(reusedQuiz);
        createCharGrid(reusedQuiz.answer);
      } else {
        console.error('Reused quiz is invalid:', reusedQuiz);
        setGameCompleted(true);
        return;
      }
    }
    
    // 새 문제 시작 시 타이머 시작
    console.log('Starting timer for next question');
    startQuestionTimer();
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
      setPreviousScore(score);
      setScore(score + 1);
      playCorrectSound();
    } else {
      setGameState('wrong');
      playWrongSound();
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
        playCompletionSound();
      } else {
        // 다음 문제로
        moveToNextQuiz();
      }
    }, 3000);
    autoNextTimerRef.current = timer;
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
    
    // 기존 타이머 정리 (ref + state 둘 다)
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
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
      playCompletionSound();
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
              playCompletionSound();
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
          <AnimatedButton 
            style={[styles.gameButton, styles.newGameButton, { marginTop: 20 }]}
            onPress={() => {
              console.log('Manual refresh requested');
              setIsLoadingQuizzes(false);
            }}
          >
            <Text style={styles.newGameButtonText}>다시 시도</Text>
          </AnimatedButton>
        </View>
      </View>
    );
  }

  // 퀴즈가 로드되지 않은 경우
  if (!currentQuiz) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🎯 퀴즈를 찾을 수 없습니다</Text>
          <Text style={styles.loadingSubText}>데이터베이스 연결을 확인해주세요</Text>
          <AnimatedButton 
            style={[styles.gameButton, styles.newGameButton, { marginTop: 20 }]}
            onPress={() => {
              console.log('Retry game initialization');
              navigation.navigate('Home' as never);
            }}
          >
            <Text style={styles.newGameButtonText}>홈으로 돌아가기</Text>
          </AnimatedButton>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <AnimatedScoreCounter 
          score={score} 
          previousScore={previousScore}
          style={styles.scoreText}
        />
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
        <AnimatedCard style={styles.questionContainer} delay={100}>
          <Text style={styles.question}>{currentQuiz.question}</Text>
        </AnimatedCard>
      )}

      <AnimatedCard style={styles.answerContainer} delay={200}>
        <Text style={styles.answerLabel}>내 답안:</Text>
        {currentQuiz && (
          <AnswerBoxes
            answer={currentQuiz.answer}
            selectedChars={selectedChars}
            onResetChar={resetChar}
          />
        )}
      </AnimatedCard>

      {/* 제출 버튼 */}
      {gameState === 'playing' && (
        <AnimatedButton 
          style={[styles.submitButton, selectedChars.length === 0 && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={selectedChars.length === 0}
          scaleValue={0.9}
        >
          <Text style={styles.submitButtonText}>제출하기</Text>
        </AnimatedButton>
      )}

      {/* 결과 표시 */}
      <AnimatedResultCard
        visible={showResult}
        gameState={gameState}
        timeLeft={timeLeft}
        correctAnswer={gameState === 'wrong' ? currentQuiz?.answer : undefined}
        onRate={rateQuiz}
      />

      <AnimatedCard style={styles.charGridContainer} delay={400}>
        {charGrid.map((char, index) => (
          <AnimatedButton
            key={index}
            style={[
              styles.charButton,
              usedCharIndices.includes(index) && styles.charButtonUsed,
              gameState !== 'playing' && styles.charButtonDisabled
            ]}
            onPress={() => handleCharPress(char, index)}
            disabled={gameState !== 'playing' || usedCharIndices.includes(index)}
            scaleValue={0.9}
          >
            <Text style={[
              styles.charButtonText,
              usedCharIndices.includes(index) && styles.charButtonTextUsed
            ]}>
              {char}
            </Text>
          </AnimatedButton>
        ))}
      </AnimatedCard>

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
    backgroundColor: gameColors.background,
    padding: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
  },
  progressText: {
    fontSize: 16,
    color: gameColors.textSecondary,
    marginTop: 5,
  },
  progressBarContainer: {
    backgroundColor: gameColors.gray[200],
    height: 8,
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    backgroundColor: gameColors.primary.solid,
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
    color: gameColors.correct.solid,
    marginBottom: 8,
  },
  timerWarning: {
    color: gameColors.challenge.solid,
  },
  timerDanger: {
    color: gameColors.wrong.solid,
  },
  timerBarContainer: {
    backgroundColor: gameColors.gray[200],
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  timerBar: {
    backgroundColor: gameColors.correct.solid,
    height: '100%',
    borderRadius: 3,
    transition: 'width 1s ease',
  },
  timerBarWarning: {
    backgroundColor: gameColors.challenge.solid,
  },
  timerBarDanger: {
    backgroundColor: gameColors.wrong.solid,
  },
  questionContainer: {
    backgroundColor: gameColors.cardBg,
    padding: 20,
    borderRadius: 20, // 더 둥글게
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    textAlign: 'center',
  },
  answerContainer: {
    marginBottom: 20,
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 10,
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
    backgroundColor: gameColors.correct.solid,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: gameColors.gray[300],
    opacity: 0.6,
  },
  submitButtonText: {
    color: gameColors.cardBg,
    fontSize: 18,
    fontWeight: 'bold',
  },
  charGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginVertical: 10,
  },
  charButton: {
    backgroundColor: gameColors.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 45,
    minHeight: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  charButtonUsed: {
    backgroundColor: gameColors.gray[200],
    opacity: 0.5,
  },
  charButtonDisabled: {
    opacity: 0.3,
  },
  charButtonText: {
    fontSize: 16,
    color: gameColors.textPrimary,
    fontWeight: '500',
  },
  charButtonTextUsed: {
    color: gameColors.gray[500],
  },
  skipContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: gameColors.gray[100],
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  skipButtonText: {
    color: gameColors.textSecondary,
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
    color: gameColors.textPrimary,
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 16,
    color: gameColors.textSecondary,
    textAlign: 'center',
  },
});
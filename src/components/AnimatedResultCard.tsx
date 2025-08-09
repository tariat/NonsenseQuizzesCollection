import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { gameColors } from '../constants/colors';
import AnimatedButton from './AnimatedButton';
import OptimizedImage from './OptimizedImage';

interface AnimatedResultCardProps {
  visible: boolean;
  gameState: 'correct' | 'wrong';
  timeLeft: number;
  correctAnswer?: string;
  onRate: (rating: 'like' | 'dislike' | 'pass') => void;
}

export default function AnimatedResultCard({ 
  visible, 
  gameState, 
  timeLeft, 
  correctAnswer, 
  onRate 
}: AnimatedResultCardProps) {
  const slideAnim = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // 카드 슬라이드 인 애니메이션
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(cardScaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // 아이콘 애니메이션 (약간의 지연 후)
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(iconScaleAnim, {
            toValue: 1,
            tension: 150,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(iconRotateAnim, {
            toValue: gameState === 'correct' ? 360 : 0,
            duration: gameState === 'correct' ? 600 : 0,
            useNativeDriver: true,
          }),
        ]).start();
      }, 200);
    } else {
      // 리셋
      slideAnim.setValue(100);
      fadeAnim.setValue(0);
      iconScaleAnim.setValue(0);
      iconRotateAnim.setValue(0);
      cardScaleAnim.setValue(0.8);
    }
  }, [visible, gameState, slideAnim, fadeAnim, iconScaleAnim, iconRotateAnim, cardScaleAnim]);

  if (!visible) return null;

  const iconRotation = iconRotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: cardScaleAnim }
          ],
          opacity: fadeAnim,
        }
      ]}
    >
      <View style={[
        styles.resultCard,
        gameState === 'correct' ? styles.correctCard : styles.wrongCard
      ]}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                { scale: iconScaleAnim },
                { rotate: iconRotation }
              ],
            }
          ]}
        >
          <OptimizedImage 
            source={
              gameState === 'correct' 
                ? require('../../assets/images/icons/correct.webp')
                : timeLeft === 0 
                  ? require('../../assets/images/icons/timeout.webp')
                  : require('../../assets/images/icons/wrong.webp')
            }
            style={styles.resultIcon}
            resizeMode="contain"
          />
        </Animated.View>
        
        <Text style={styles.resultText}>
          {gameState === 'correct' ? '정답입니다!' : 
           timeLeft === 0 ? '시간 초과!' : '틀렸습니다!'}
        </Text>
        
        {gameState === 'wrong' && correctAnswer && (
          <Text style={styles.correctAnswerText}>
            정답: {correctAnswer}
          </Text>
        )}
        
        {/* 평가 버튼들 */}
        <View style={styles.ratingContainer}>
          <AnimatedButton 
            style={[styles.ratingButton, styles.likeButton]} 
            onPress={() => onRate('like')}
            scaleValue={0.92}
          >
            <Text style={styles.ratingText}>👍 좋아요</Text>
          </AnimatedButton>
          
          <AnimatedButton 
            style={[styles.ratingButton, styles.dislikeButton]} 
            onPress={() => onRate('dislike')}
            scaleValue={0.92}
          >
            <Text style={styles.ratingText}>👎 싫어요</Text>
          </AnimatedButton>
          
          <AnimatedButton 
            style={[styles.ratingButton, styles.passButton]} 
            onPress={() => onRate('pass')}
            scaleValue={0.92}
          >
            <Text style={styles.ratingText}>⏭️ 패스</Text>
          </AnimatedButton>
        </View>
        
        <Text style={styles.autoNextText}>3초 후 다음 문제로 넘어갑니다...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  resultCard: {
    backgroundColor: gameColors.cardBg,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  correctCard: {
    borderLeftWidth: 5,
    borderLeftColor: gameColors.correct.solid,
  },
  wrongCard: {
    borderLeftWidth: 5,
    borderLeftColor: gameColors.wrong.solid,
  },
  iconContainer: {
    marginBottom: 15,
  },
  resultIcon: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 10,
  },
  correctAnswerText: {
    fontSize: 16,
    color: gameColors.textSecondary,
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  likeButton: {
    backgroundColor: gameColors.correct.solid,
  },
  dislikeButton: {
    backgroundColor: gameColors.wrong.solid,
  },
  passButton: {
    backgroundColor: gameColors.challenge.solid,
  },
  ratingText: {
    color: gameColors.cardBg,
    fontSize: 12,
    fontWeight: 'bold',
  },
  autoNextText: {
    fontSize: 12,
    color: gameColors.textLight,
    textAlign: 'center',
  },
});
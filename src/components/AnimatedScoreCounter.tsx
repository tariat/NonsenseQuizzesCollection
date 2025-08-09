import React, { useEffect, useRef, useMemo } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { gameColors } from '../constants/colors';

interface AnimatedScoreCounterProps {
  score: number;
  previousScore: number;
  style?: any;
}

const AnimatedScoreCounter = React.memo<AnimatedScoreCounterProps>(function AnimatedScoreCounter({ score, previousScore, style }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const countRef = useRef(previousScore);
  const displayScore = useRef(previousScore);
  
  const scaleAnimationConfig = useMemo(() => ([
    {
      toValue: 1.3,
      duration: 200,
      useNativeDriver: true,
    },
    {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    },
  ]), []);

  useEffect(() => {
    if (score > previousScore) {
      // 점수가 증가할 때 카운트업 애니메이션
      const duration = 800;
      const steps = score - previousScore;
      
      // 스케일 애니메이션
      Animated.sequence([
        Animated.timing(scaleAnim, scaleAnimationConfig[0]),
        Animated.timing(scaleAnim, scaleAnimationConfig[1]),
      ]).start();
      
      // 카운트업 애니메이션
      const stepDuration = duration / (steps * 10); // 더 부드러운 카운트업을 위해 세분화
      let currentStep = 0;
      const totalSteps = steps * 10;
      
      const countUpInterval = setInterval(() => {
        currentStep++;
        const progress = currentStep / totalSteps;
        const currentCount = previousScore + (steps * progress);
        displayScore.current = Math.floor(currentCount);
        
        if (currentStep >= totalSteps) {
          displayScore.current = score;
          clearInterval(countUpInterval);
        }
      }, stepDuration);
      
      return () => clearInterval(countUpInterval);
    } else {
      displayScore.current = score;
    }
  }, [score, previousScore, scaleAnim, scaleAnimationConfig]);

  const animatedStyle = useMemo(() => ({
    transform: [{ scale: scaleAnim }], 
    opacity: opacityAnim 
  }), [scaleAnim, opacityAnim]);

  return (
    <Animated.View style={animatedStyle}>
      <Text style={[styles.scoreText, style]}>
        점수: {displayScore.current}
      </Text>
    </Animated.View>
  );
});

export default AnimatedScoreCounter;

const styles = StyleSheet.create({
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
  },
});
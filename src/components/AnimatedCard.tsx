import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

const AnimatedCard = React.memo<AnimatedCardProps>(function AnimatedCard({ 
  children, 
  style, 
  delay = 0, 
  direction = 'up',
  distance = 50 
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(distance)).current;

  const animationConfig = useMemo(() => ({
    fade: {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    },
    spring: {
      toValue: 0,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
    },
  }), []);

  useEffect(() => {
    const animationDelay = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, animationConfig.fade),
        Animated.spring(slideAnim, animationConfig.spring),
      ]).start();
    }, delay);

    return () => clearTimeout(animationDelay);
  }, [fadeAnim, slideAnim, delay, animationConfig]);

  const transform = useMemo(() => {
    switch (direction) {
      case 'up':
        return [{ translateY: slideAnim }];
      case 'down':
        return [{ translateY: slideAnim.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }) }];
      case 'left':
        return [{ translateX: slideAnim }];
      case 'right':
        return [{ translateX: slideAnim.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }) }];
      default:
        return [{ translateY: slideAnim }];
    }
  }, [direction, slideAnim, distance]);

  const animatedStyle = useMemo(() => ([
    style,
    {
      opacity: fadeAnim,
      transform,
    },
  ]), [style, fadeAnim, transform]);

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
});

export default AnimatedCard;
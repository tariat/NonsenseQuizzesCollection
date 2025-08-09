import React, { useRef, useCallback, useMemo } from 'react';
import { TouchableOpacity, Animated, ViewStyle, TextStyle } from 'react-native';
import { useSound } from '../contexts/SoundContext';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
  scaleValue?: number; // 축소 정도 (기본값: 0.95)
  enableSound?: boolean; // 소리 효과 사용 여부 (기본값: true)
}

const AnimatedButton = React.memo<AnimatedButtonProps>(function AnimatedButton({ 
  children, 
  onPress, 
  style, 
  disabled = false,
  scaleValue = 0.95,
  enableSound = true
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { playButtonSound } = useSound();

  const springConfig = useMemo(() => ({
    useNativeDriver: true,
    tension: 300,
    friction: 10,
  }), []);

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    
    Animated.spring(scaleAnim, {
      toValue: scaleValue,
      ...springConfig,
    }).start();
  }, [disabled, scaleValue, scaleAnim, springConfig]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...springConfig,
    }).start();
  }, [disabled, scaleAnim, springConfig]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    if (enableSound) {
      playButtonSound();
    }
    onPress();
  }, [disabled, onPress, enableSound, playButtonSound]);

  const animatedStyle = useMemo(() => ([
    {
      transform: [{ scale: scaleAnim }],
    },
  ]), [scaleAnim]);

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      style={style}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
});

export default AnimatedButton;
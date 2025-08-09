import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { gameColors } from '../constants/colors';
import AnimatedButton from '../components/AnimatedButton';

export default function QuizGameScreenTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎮 게임 테스트 화면</Text>
      <Text style={styles.subtitle}>게임 화면이 정상적으로 로드되었습니다!</Text>
      
      <AnimatedButton 
        style={styles.button}
        onPress={() => console.log('Test button pressed')}
      >
        <Text style={styles.buttonText}>테스트 버튼</Text>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: gameColors.textSecondary,
    marginBottom: 30,
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
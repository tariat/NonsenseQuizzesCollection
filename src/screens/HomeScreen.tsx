import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { gameColors } from '../constants/colors';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';
import OptimizedImage from '../components/OptimizedImage';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <AnimatedCard delay={0}>
        <OptimizedImage 
          source={require('../../assets/images/hero-character.webp')}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </AnimatedCard>
      <AnimatedCard delay={100}>
        <Text style={styles.title}>넌센스 퀴즈 모음</Text>
        <Text style={styles.subtitle}>재미있는 넌센스 퀴즈를 즐겨보세요!</Text>
      </AnimatedCard>
      
      <View style={styles.buttonContainer}>
        <AnimatedCard delay={200}>
          <AnimatedButton 
            style={styles.button}
            onPress={() => navigation.navigate('Search' as never)}
          >
            <Text style={styles.buttonText}>퀴즈 검색</Text>
          </AnimatedButton>
        </AnimatedCard>
        
        <AnimatedCard delay={250}>
          <AnimatedButton 
            style={styles.button}
            onPress={() => navigation.navigate('Game' as never)}
          >
            <Text style={styles.buttonText}>퀴즈 맞추기</Text>
          </AnimatedButton>
        </AnimatedCard>
        
        <AnimatedCard delay={300}>
          <AnimatedButton 
            style={styles.button}
            onPress={() => navigation.navigate('Submit' as never)}
          >
            <Text style={styles.buttonText}>퀴즈 등록</Text>
          </AnimatedButton>
        </AnimatedCard>
        
        <AnimatedCard delay={350}>
          <AnimatedButton 
            style={styles.button}
            onPress={() => navigation.navigate('Scoreboard' as never)}
          >
            <Text style={styles.buttonText}>스코어보드</Text>
          </AnimatedButton>
        </AnimatedCard>
        
        <AnimatedCard delay={400}>
          <AnimatedButton 
            style={styles.button}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Text style={styles.buttonText}>🔊 설정</Text>
          </AnimatedButton>
        </AnimatedCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: gameColors.background,
    padding: 20,
  },
  heroImage: {
    width: 320,
    height: 214, // 400x267 비율 유지 (400/267 * 214 = 320)
    marginBottom: 30,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: gameColors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    backgroundColor: gameColors.primary.solid,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20, // 더 둥글게
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: gameColors.cardBg,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
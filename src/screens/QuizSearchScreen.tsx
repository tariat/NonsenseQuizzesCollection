import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Quiz } from '../types';
import { QuizService } from '../services/quizService';
import { gameColors } from '../constants/colors';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';

export default function QuizSearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Quiz[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchText.trim()) {
      Alert.alert('알림', '검색어를 입력해주세요.');
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for:', searchText);
      const results = await QuizService.searchQuizzes(searchText.trim());
      console.log('Search results:', results.length, 'quizzes found');
      setSearchResults(results);
      
      if (results.length === 0) {
        Alert.alert('검색 결과', '검색 결과가 없습니다. 다른 키워드로 검색해보세요.');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('오류', '검색 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSearching(false);
    }
  };

  const renderQuizItem = ({ item, index }: { item: Quiz; index: number }) => (
    <AnimatedCard delay={100 + (index * 50)} distance={30}>
      <TouchableOpacity style={styles.quizItem}>
        <Text style={styles.question}>{item.question}</Text>
        <Text style={styles.answer}>답: {item.answer}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>👍 {item.likes}</Text>
          <Text style={styles.rating}>👎 {item.dislikes}</Text>
        </View>
      </TouchableOpacity>
    </AnimatedCard>
  );

  return (
    <View style={styles.container}>
      <AnimatedCard style={styles.searchContainer} delay={0}>
        <TextInput
          style={styles.searchInput}
          placeholder="퀴즈를 검색하세요..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
        />
        <AnimatedButton 
          style={[styles.searchButton, isSearching && styles.searchButtonDisabled]} 
          onPress={handleSearch}
          disabled={isSearching}
          scaleValue={0.9}
        >
          <Text style={styles.searchButtonText}>
            {isSearching ? '검색 중...' : '검색'}
          </Text>
        </AnimatedButton>
      </AnimatedCard>

      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderQuizItem}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🔍</Text>
          <Text style={styles.emptyMessage}>
            {isSearching ? '검색 중입니다...' : '퀴즈를 검색해보세요!'}
          </Text>
          <Text style={styles.emptySubMessage}>
            {isSearching ? '' : '질문 내용으로 검색할 수 있습니다.'}
          </Text>
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
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: gameColors.cardBg,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: gameColors.gray[300],
    color: gameColors.textPrimary,
  },
  searchButton: {
    backgroundColor: gameColors.primary.solid,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonText: {
    color: gameColors.cardBg,
    fontWeight: 'bold',
  },
  searchButtonDisabled: {
    backgroundColor: gameColors.gray[300],
    opacity: 0.6,
  },
  resultsList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 20,
  },
  emptyMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubMessage: {
    fontSize: 14,
    color: gameColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  quizItem: {
    backgroundColor: gameColors.cardBg,
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    color: gameColors.textSecondary,
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  rating: {
    fontSize: 14,
    color: gameColors.textLight,
  },
});
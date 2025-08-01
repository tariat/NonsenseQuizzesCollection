import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Quiz } from '../types';
import { QuizService } from '../services/quizService';

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

  const renderQuizItem = ({ item }: { item: Quiz }) => (
    <TouchableOpacity style={styles.quizItem}>
      <Text style={styles.question}>{item.question}</Text>
      <Text style={styles.answer}>답: {item.answer}</Text>
      <View style={styles.ratingContainer}>
        <Text style={styles.rating}>👍 {item.likes}</Text>
        <Text style={styles.rating}>👎 {item.dislikes}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="퀴즈를 검색하세요..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity 
          style={[styles.searchButton, isSearching && styles.searchButtonDisabled]} 
          onPress={handleSearch}
          disabled={isSearching}
        >
          <Text style={styles.searchButtonText}>
            {isSearching ? '검색 중...' : '검색'}
          </Text>
        </TouchableOpacity>
      </View>

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
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
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
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  quizItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  rating: {
    fontSize: 14,
    color: '#999',
  },
});
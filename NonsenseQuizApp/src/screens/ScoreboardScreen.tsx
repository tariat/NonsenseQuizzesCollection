import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Score } from '../types';
import { QuizService } from '../services/quizService';

export default function ScoreboardScreen() {
  const [scores, setScores] = useState<Score[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadScoreboard();
  }, []);

  const loadScoreboard = async () => {
    setRefreshing(true);
    try {
      const data = await QuizService.getScoreboard(20);
      setScores(data);
    } catch (error) {
      console.error('Error loading scoreboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadScoreboard();
  };

  const renderScoreItem = ({ item, index }: { item: Score; index: number }) => {
    const getRankStyle = (rank: number) => {
      if (rank === 0) return styles.goldRank;
      if (rank === 1) return styles.silverRank;
      if (rank === 2) return styles.bronzeRank;
      return styles.normalRank;
    };

    const getRankEmoji = (rank: number) => {
      if (rank === 0) return '🥇';
      if (rank === 1) return '🥈';
      if (rank === 2) return '🥉';
      return `${rank + 1}`;
    };

    return (
      <View style={[styles.scoreItem, getRankStyle(index)]}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{getRankEmoji(index)}</Text>
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.nameText}>{item.user_name}</Text>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('ko-KR')}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.score}점</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 스코어보드</Text>
        <Text style={styles.subtitle}>최고 점수를 노려보세요!</Text>
      </View>

      {scores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>아직 기록된 점수가 없습니다.</Text>
          <Text style={styles.emptySubText}>첫 번째 기록의 주인공이 되어보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={scores}
          renderItem={renderScoreItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={loadScoreboard}>
        <Text style={styles.refreshButtonText}>새로고침</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goldRank: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    backgroundColor: '#FFFBF0',
  },
  silverRank: {
    borderLeftWidth: 4,
    borderLeftColor: '#C0C0C0',
    backgroundColor: '#F8F8F8',
  },
  bronzeRank: {
    borderLeftWidth: 4,
    borderLeftColor: '#CD7F32',
    backgroundColor: '#FFF8F0',
  },
  normalRank: {
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  nameContainer: {
    flex: 1,
    marginLeft: 10,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Score } from '../types';
import { QuizService } from '../services/quizService';
import { gameColors } from '../constants/colors';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';

export default function ScoreboardScreen() {
  const [scores, setScores] = useState<Score[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // FlatList 성능 최적화 함수들
  const keyExtractor = useCallback((item: Score) => item.id, []);
  
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 95, // scoreItem 높이 + marginBottom
    offset: 95 * index,
    index,
  }), []);

  useEffect(() => {
    loadScoreboard();
  }, []);

  const loadScoreboard = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await QuizService.getScoreboard(20);
      setScores(data);
    } catch (error) {
      console.error('Error loading scoreboard:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    loadScoreboard();
  }, []);

  const renderScoreItem = useCallback(({ item, index }: { item: Score; index: number }) => {
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
      <AnimatedCard delay={index * 50} distance={30}>
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
      </AnimatedCard>
    );
  }, []);

  return (
    <View style={styles.container}>
      <AnimatedCard delay={0}>
        <View style={styles.header}>
          <Text style={styles.title}>🏆 스코어보드</Text>
          <Text style={styles.subtitle}>최고 점수를 노려보세요!</Text>
        </View>
      </AnimatedCard>

      {scores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>아직 기록된 점수가 없습니다.</Text>
          <Text style={styles.emptySubText}>첫 번째 기록의 주인공이 되어보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={scores}
          renderItem={renderScoreItem}
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          style={styles.list}
          // 성능 최적화 속성들
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          getItemLayout={getItemLayout}
        />
      )}

      <AnimatedButton style={styles.refreshButton} onPress={loadScoreboard}>
        <Text style={styles.refreshButtonText}>새로고침</Text>
      </AnimatedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: gameColors.background,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: gameColors.textSecondary,
  },
  list: {
    flex: 1,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  goldRank: {
    borderLeftWidth: 5,
    borderLeftColor: '#FFD700',
    backgroundColor: '#FFFBF0',
  },
  silverRank: {
    borderLeftWidth: 5,
    borderLeftColor: '#C0C0C0',
    backgroundColor: '#F8F8F8',
  },
  bronzeRank: {
    borderLeftWidth: 5,
    borderLeftColor: '#CD7F32',
    backgroundColor: '#FFF8F0',
  },
  normalRank: {
    borderLeftWidth: 5,
    borderLeftColor: gameColors.gray[300],
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
  },
  nameContainer: {
    flex: 1,
    marginLeft: 10,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
  },
  dateText: {
    fontSize: 12,
    color: gameColors.textLight,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: gameColors.primary.solid,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: gameColors.textSecondary,
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: gameColors.textLight,
  },
  refreshButton: {
    backgroundColor: gameColors.primary.solid,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  refreshButtonText: {
    color: gameColors.cardBg,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
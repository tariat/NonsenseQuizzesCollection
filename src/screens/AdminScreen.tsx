import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { QuizService } from '../services/quizService';
import { gameColors } from '../constants/colors';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';

interface QuizSubmission {
  id: string;
  question: string;
  answer: string;
  submitted_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function AdminScreen() {
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // FlatList 성능 최적화 함수들
  const keyExtractor = useCallback((item: QuizSubmission) => item.id, []);
  
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 220, // submissionItem 높이 + marginBottom 추산치
    offset: 220 * index,
    index,
  }), []);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log('Loading pending submissions...');
      const data = await QuizService.getPendingSubmissions();
      console.log('Received submissions data:', data);
      console.log('Number of submissions:', data?.length || 0);
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
      Alert.alert('오류', '제출된 퀴즈를 불러오는데 실패했습니다.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleApprove = async (submissionId: string) => {
    console.log('Approve button clicked for submission:', submissionId);
    try {
      console.log('Calling QuizService.approveQuizSubmission...');
      const success = await QuizService.approveQuizSubmission(submissionId);
      console.log('Approval result:', success);
      if (success) {
        Alert.alert('성공', '퀴즈가 승인되었습니다.');
        console.log('Reloading submissions after approval...');
        loadSubmissions();
      } else {
        Alert.alert('오류', '퀴즈 승인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Approval error:', error);
      Alert.alert('오류', '승인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async (submissionId: string) => {
    console.log('Reject button clicked for submission:', submissionId);
    try {
      console.log('Calling QuizService.rejectQuizSubmission...');
      const success = await QuizService.rejectQuizSubmission(submissionId);
      console.log('Rejection result:', success);
      if (success) {
        Alert.alert('완료', '퀴즈가 거절되었습니다.');
        console.log('Reloading submissions after rejection...');
        loadSubmissions();
      } else {
        Alert.alert('오류', '퀴즈 거절에 실패했습니다.');
      }
    } catch (error) {
      console.error('Rejection error:', error);
      Alert.alert('오류', '거절 처리 중 오류가 발생했습니다.');
    }
  };

  const renderSubmissionItem = useCallback(({ item, index }: { item: QuizSubmission; index: number }) => (
    <AnimatedCard delay={index * 60} distance={30}>
      <View style={styles.submissionItem}>
        <View style={styles.submissionHeader}>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          {item.submitted_by && (
            <Text style={styles.submitterText}>제출자: {item.submitted_by}</Text>
          )}
        </View>
        
        <View style={styles.submissionContent}>
          <Text style={styles.questionLabel}>문제:</Text>
          <Text style={styles.questionText}>{item.question}</Text>
          
          <Text style={styles.answerLabel}>답:</Text>
          <Text style={styles.answerText}>{item.answer}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <AnimatedButton 
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item.id)}
            scaleValue={0.92}
          >
            <Text style={styles.actionButtonText}>✅ 승인</Text>
          </AnimatedButton>
          
          <AnimatedButton 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
            scaleValue={0.92}
          >
            <Text style={styles.actionButtonText}>❌ 거절</Text>
          </AnimatedButton>
        </View>
      </View>
    </AnimatedCard>
  ), [handleApprove, handleReject]);

  return (
    <View style={styles.container}>
      <AnimatedCard delay={0}>
        <View style={styles.header}>
          <Text style={styles.title}>🔧 관리자 페이지</Text>
          <Text style={styles.subtitle}>제출된 퀴즈 승인 관리</Text>
        </View>
      </AnimatedCard>

      {submissions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>승인 대기 중인 퀴즈가 없습니다.</Text>
          <Text style={styles.emptySubText}>사용자들이 퀴즈를 제출하면 여기에 표시됩니다.</Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          renderItem={renderSubmissionItem}
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadSubmissions} />
          }
          showsVerticalScrollIndicator={false}
          style={styles.list}
          // 성능 최적화 속성들
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={8}
          initialNumToRender={5}
          getItemLayout={getItemLayout}
        />
      )}

      <AnimatedButton style={styles.refreshButton} onPress={loadSubmissions}>
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
    fontSize: 24,
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
  submissionItem: {
    backgroundColor: gameColors.cardBg,
    padding: 25,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: gameColors.gray[200],
  },
  dateText: {
    fontSize: 12,
    color: gameColors.textLight,
  },
  submitterText: {
    fontSize: 12,
    color: gameColors.textSecondary,
    fontStyle: 'italic',
  },
  submissionContent: {
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 5,
  },
  questionText: {
    fontSize: 16,
    color: gameColors.textPrimary,
    marginBottom: 15,
    backgroundColor: gameColors.gray[50],
    padding: 12,
    borderRadius: 12,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: gameColors.textPrimary,
    marginBottom: 5,
  },
  answerText: {
    fontSize: 16,
    color: gameColors.primary.solid,
    fontWeight: '600',
    backgroundColor: gameColors.primary.start + '20',
    padding: 12,
    borderRadius: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  approveButton: {
    backgroundColor: gameColors.correct.solid,
  },
  rejectButton: {
    backgroundColor: gameColors.wrong.solid,
  },
  actionButtonText: {
    color: gameColors.cardBg,
    fontSize: 14,
    fontWeight: 'bold',
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
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: gameColors.textLight,
    textAlign: 'center',
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
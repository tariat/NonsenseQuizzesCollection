import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { QuizService } from '../services/quizService';

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

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
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
  };

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

  const renderSubmissionItem = ({ item }: { item: QuizSubmission }) => (
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
        <TouchableOpacity 
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item.id)}
        >
          <Text style={styles.actionButtonText}>✅ 승인</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.id)}
        >
          <Text style={styles.actionButtonText}>❌ 거절</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 관리자 페이지</Text>
        <Text style={styles.subtitle}>제출된 퀴즈 승인 관리</Text>
      </View>

      {submissions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>승인 대기 중인 퀴즈가 없습니다.</Text>
          <Text style={styles.emptySubText}>사용자들이 퀴즈를 제출하면 여기에 표시됩니다.</Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          renderItem={renderSubmissionItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadSubmissions} />
          }
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={loadSubmissions}>
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
    fontSize: 24,
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
  submissionItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  submitterText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  submissionContent: {
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  answerText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
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
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
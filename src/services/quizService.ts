import { supabase } from '../config/supabase';
import { Quiz, QuizRating, Score } from '../types';

export class QuizService {
  // 퀴즈 검색
  static async searchQuizzes(searchText: string): Promise<Quiz[]> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('approved', true)
        .ilike('question', `%${searchText}%`)
        .order('likes', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching quizzes:', error);
      return [];
    }
  }

  // 랜덤 퀴즈 가져오기 (가중치 적용)
  static async getRandomQuiz(excludeIds: string[] = []): Promise<Quiz | null> {
    try {
      let query = supabase
        .from('quizzes')
        .select('*')
        .eq('approved', true);

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      if (!data || data.length === 0) return null;

      // 가중치 적용 (좋아요가 많을수록 선택될 확률 높음)
      const weightedQuizzes = data.map(quiz => ({
        ...quiz,
        weight: Math.max(1, quiz.likes - quiz.dislikes + 1)
      }));

      const totalWeight = weightedQuizzes.reduce((sum, quiz) => sum + quiz.weight, 0);
      let random = Math.random() * totalWeight;

      for (const quiz of weightedQuizzes) {
        random -= quiz.weight;
        if (random <= 0) {
          return quiz;
        }
      }

      return weightedQuizzes[0];
    } catch (error) {
      console.error('Error getting random quiz:', error);
      return null;
    }
  }

  // 게임용: 여러 퀴즈를 한 번에 가져오기 (성능 최적화)
  static async getRandomQuizzes(count: number = 10, excludeIds: string[] = []): Promise<Quiz[]> {
    try {
      console.log(`Getting ${count} random quizzes from database, excluding ${excludeIds.length} quizzes...`);
      
      let query = supabase
        .from('quizzes')
        .select('*')
        .eq('approved', true);

      // 사용된 퀴즈 제외
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.map(id => `'${id}'`).join(',')})`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(Math.min(count * 3, 100)); // 더 많이 가져와서 중복 방지

      console.log('Quiz fetch result:', { data: data?.length, error, excludedCount: excludeIds.length });
      
      if (error) {
        console.error('Error fetching quizzes:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('No quizzes found in database (excluding used ones)');
        return [];
      }

      // 가중치 적용하여 섞기
      const weightedQuizzes = data.map(quiz => ({
        ...quiz,
        weight: Math.max(1, quiz.likes - quiz.dislikes + 1)
      }));

      // 가중치 기반으로 퀴즈 선택
      const selectedQuizzes: Quiz[] = [];
      const availableQuizzes = [...weightedQuizzes];

      // for (let i = 0; i < Math.min(count, availableQuizzes.length); i++) {
      //   if (availableQuizzes.length === 0) break;

      //   const totalWeight = availableQuizzes.reduce((sum, quiz) => sum + quiz.weight, 0);
      //   let random = Math.random() * totalWeight;

      //   let selectedIndex = 0;
      //   for (let j = 0; j < availableQuizzes.length; j++) {
      //     random -= availableQuizzes[j].weight;
      //     if (random <= 0) {
      //       selectedIndex = j;
      //       break;
      //     }
      //   }

      //   const selectedQuiz = availableQuizzes[selectedIndex];
      //   selectedQuizzes.push(selectedQuiz);
      //   availableQuizzes.splice(selectedIndex, 1); // 선택된 퀴즈 제거
      // }

      for (let i = 0; i < Math.min(count, availableQuizzes.length); i++) {
        if (availableQuizzes.length === 0) break;

        const selectedQuiz = availableQuizzes[i];
        selectedQuizzes.push(selectedQuiz);
      }

      console.log(`Selected ${selectedQuizzes.length} quizzes for game`);
      return selectedQuizzes;
    } catch (error) {
      console.error('Error getting random quizzes:', error);
      return [];
    }
  }

  // 퀴즈 평가 저장
  static async rateQuiz(quizId: string, rating: 'like' | 'dislike' | 'pass', sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('quiz_ratings')
        .insert({
          quiz_id: quizId,
          rating,
          session_id: sessionId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rating quiz:', error);
      return false;
    }
  }

  // 퀴즈 제출
  static async submitQuiz(question: string, answer: string, submittedBy?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('quiz_submissions')
        .insert({
          question,
          answer,
          submitted_by: submittedBy
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      return false;
    }
  }

  // 점수 저장
  static async saveScore(userName: string, score: number): Promise<boolean> {
    try {
      console.log('Saving score to database:', { userName, score });
      const { error } = await supabase
        .from('scores')
        .insert({
          user_name: userName,
          score
        });

      console.log('Score save result:', { error });
      if (error) {
        console.error('Database error saving score:', error);
        throw error;
      }
      console.log('Score saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving score:', error);
      return false;
    }
  }

  // 스코어보드 가져오기
  static async getScoreboard(limit: number = 10): Promise<Score[]> {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting scoreboard:', error);
      return [];
    }
  }

  // 관리자용: 제출된 퀴즈 목록
  static async getPendingSubmissions(): Promise<any[]> {
    try {
      console.log('Querying quiz_submissions table...');
      const { data, error } = await supabase
        .from('quiz_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      console.log('Supabase query result:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Returning data:', data || []);
      return data || [];
    } catch (error) {
      console.error('Error getting pending submissions:', error);
      return [];
    }
  }

  // 관리자용: 퀴즈 승인
  static async approveQuizSubmission(submissionId: string): Promise<boolean> {
    try {
      console.log('Starting approval process for submission ID:', submissionId);
      
      // 제출된 퀴즈 정보 가져오기
      console.log('Fetching submission details...');
      const { data: submission, error: fetchError } = await supabase
        .from('quiz_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      console.log('Submission fetch result:', { submission, fetchError });
      if (fetchError) {
        console.error('Error fetching submission:', fetchError);
        throw fetchError;
      }

      // 퀴즈 테이블에 추가
      console.log('Adding quiz to main quizzes table:', {
        question: submission.question,
        answer: submission.answer
      });
      const { error: insertError } = await supabase
        .from('quizzes')
        .insert({
          question: submission.question,
          answer: submission.answer,
          approved: true
        });

      console.log('Quiz insert result:', { insertError });
      if (insertError) {
        console.error('Error inserting quiz:', insertError);
        throw insertError;
      }

      // 제출 상태 업데이트
      console.log('Updating submission status to approved...');
      const { error: updateError } = await supabase
        .from('quiz_submissions')
        .update({ status: 'approved' })
        .eq('id', submissionId);

      console.log('Status update result:', { updateError });
      if (updateError) {
        console.error('Error updating submission status:', updateError);
        throw updateError;
      }
      
      console.log('Approval process completed successfully');
      return true;
    } catch (error) {
      console.error('Error approving quiz submission:', error);
      return false;
    }
  }

  // 관리자용: 퀴즈 거절
  static async rejectQuizSubmission(submissionId: string): Promise<boolean> {
    try {
      console.log('Starting rejection process for submission ID:', submissionId);
      
      const { error } = await supabase
        .from('quiz_submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId);

      console.log('Rejection update result:', { error });
      if (error) {
        console.error('Error updating submission to rejected:', error);
        throw error;
      }
      
      console.log('Rejection process completed successfully');
      return true;
    } catch (error) {
      console.error('Error rejecting quiz submission:', error);
      return false;
    }
  }
}
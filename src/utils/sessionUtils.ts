import AsyncStorage from '@react-native-async-storage/async-storage';

export class SessionUtils {
  private static SESSION_KEY = 'user_session_id';

  // 세션 ID 생성 또는 가져오기
  static async getOrCreateSessionId(): Promise<string> {
    try {
      let sessionId = await AsyncStorage.getItem(this.SESSION_KEY);
      
      if (!sessionId) {
        sessionId = this.generateSessionId();
        await AsyncStorage.setItem(this.SESSION_KEY, sessionId);
      }
      
      return sessionId;
    } catch (error) {
      console.error('Error managing session ID:', error);
      return this.generateSessionId();
    }
  }

  // 고유한 세션 ID 생성
  private static generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 세션 ID 초기화 (필요시)
  static async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }
}
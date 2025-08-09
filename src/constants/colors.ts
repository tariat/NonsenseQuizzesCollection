// 게임형 색상 시스템
export const gameColors = {
  // 메인 컬러 (퍼플-핑크 그라디언트)
  primary: {
    start: '#667eea',
    end: '#764ba2',
    solid: '#667eea',
  },
  secondary: {
    start: '#ffecd2',
    end: '#fcb69f',
    solid: '#fcb69f',
  },
  
  // 게임 상태 컬러
  correct: {
    start: '#11998e',
    end: '#38ef7d',
    solid: '#38ef7d',
  },
  wrong: {
    start: '#fc4a1a',
    end: '#f7b733',
    solid: '#f7b733',
  },
  timeout: {
    start: '#f093fb',
    end: '#f5576c',
    solid: '#f5576c',
  },
  
  // 버튼 컬러
  challenge: {
    start: '#ff9800',
    end: '#ff5722',
    solid: '#ff9800',
  },
  
  // 뉴트럴
  background: '#f8f9ff',
  cardBg: '#ffffff',
  textPrimary: '#2d3748',
  textSecondary: '#718096',
  textLight: '#a0aec0',
  
  // 그레이 스케일
  gray: {
    50: '#f7fafc',
    100: '#edf2f7',
    200: '#e2e8f0',
    300: '#cbd5e0',
    400: '#a0aec0',
    500: '#718096',
    600: '#4a5568',
    700: '#2d3748',
    800: '#1a202c',
    900: '#171923',
  },
};

// 기존 색상 호환을 위한 별칭
export const colors = {
  primary: gameColors.primary.solid,
  success: gameColors.correct.solid,
  warning: gameColors.timeout.solid,
  error: gameColors.wrong.solid,
  background: gameColors.background,
  white: gameColors.cardBg,
  text: gameColors.textPrimary,
  textSecondary: gameColors.textSecondary,
};
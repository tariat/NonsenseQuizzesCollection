export interface Quiz {
  id: string;
  question: string;
  answer: string;
  likes: number;
  dislikes: number;
  created_at: string;
  approved: boolean;
}

export interface User {
  id: string;
  name: string;
  created_at: string;
}

export interface Score {
  id: string;
  user_name: string;
  score: number;
  created_at: string;
}

export interface QuizRating {
  id: string;
  quiz_id: string;
  rating: 'like' | 'dislike' | 'pass';
  created_at: string;
}

export type RootStackParamList = {
  Home: undefined;
  QuizSearch: undefined;
  QuizGame: undefined;
  QuizSubmit: undefined;
  Scoreboard: undefined;
};
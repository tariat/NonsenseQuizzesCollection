-- 퀴즈 테이블
CREATE TABLE quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 퀴즈 평가 테이블
CREATE TABLE quiz_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  rating TEXT CHECK (rating IN ('like', 'dislike', 'pass')) NOT NULL,
  session_id TEXT, -- 익명 사용자 세션 구분용
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 게임 점수 테이블
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 퀴즈 제출 테이블 (관리자 승인 대기용)
CREATE TABLE quiz_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  submitted_by TEXT, -- 제출자 정보 (선택사항)
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 퀴즈 좋아요/싫어요 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_quiz_rating_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.rating = 'like' THEN
      UPDATE quizzes SET likes = likes + 1 WHERE id = NEW.quiz_id;
    ELSIF NEW.rating = 'dislike' THEN
      UPDATE quizzes SET dislikes = dislikes + 1 WHERE id = NEW.quiz_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER quiz_rating_update_trigger
  AFTER INSERT ON quiz_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_rating_counts();

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 퀴즈 테이블에 업데이트 시간 자동 갱신 트리거 적용
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 정책 설정
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

-- 퀴즈 조회: 승인된 퀴즈만 조회 가능
CREATE POLICY "Anyone can view approved quizzes" ON quizzes
  FOR SELECT USING (approved = true);

-- 퀴즈 추가: 누구나 승인된 퀴즈 추가 가능 (관리자 승인 과정에서 필요)
CREATE POLICY "Anyone can insert approved quizzes" ON quizzes
  FOR INSERT WITH CHECK (approved = true);

-- 퀴즈 평가: 누구나 추가 가능
CREATE POLICY "Anyone can insert quiz ratings" ON quiz_ratings
  FOR INSERT WITH CHECK (true);

-- 점수: 누구나 조회/추가 가능
CREATE POLICY "Anyone can view scores" ON scores
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert scores" ON scores
  FOR INSERT WITH CHECK (true);

-- 퀴즈 제출: 누구나 추가 가능
CREATE POLICY "Anyone can submit quizzes" ON quiz_submissions
  FOR INSERT WITH CHECK (true);

-- 관리자용 정책 (관리자는 모든 데이터 접근 가능)
-- 실제 구현시에는 auth.jwt() 를 사용하여 관리자 권한 확인
CREATE POLICY "Admins can do everything on quizzes" ON quizzes
  FOR ALL USING (auth.role() = 'admin');

-- CREATE POLICY "Admins can view all submissions" ON quiz_submissions
--   FOR SELECT USING (auth.role() = 'admin');
-- CREATE POLICY "Admins can update submissions" ON quiz_submissions
--   FOR UPDATE USING (auth.role() = 'admin');

-- 임시: 누구나 제출된 퀴즈 조회 가능 (실제 운영시에는 관리자만 가능하도록 수정 필요)
CREATE POLICY "Anyone can view submissions" ON quiz_submissions
  FOR SELECT USING (true);
CREATE POLICY "Anyone can update submissions" ON quiz_submissions
  FOR UPDATE USING (true);

-- 샘플 데이터 추가
INSERT INTO quizzes (question, answer, approved) VALUES
  ('바나나가 웃으면?', '바나나킥', true),
  ('물고기가 화나면?', '화나리', true),
  ('똥이 엄마한테 혼나면?', '똥화남', true),
  ('개가 얼음을 먹으면?', '개아이스', true),
  ('고양이가 커피를 마시면?', '고냥이', true);
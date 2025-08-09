# 넌센스 퀴즈 모음 앱

React Native와 Supabase를 사용한 넌센스 퀴즈 모바일 앱입니다.

실행명령: npm run web

## 주요 기능

### 🔍 퀴즈 검색
- 키워드로 퀴즈 검색
- 좋아요 순으로 정렬된 결과

### 🎮 퀴즈 맞추기
- 단어 그리드 방식으로 답 맞추기
- 문제별 평가 시스템 (좋아요/싫어요/패스)
- 가중치 기반 퀴즈 노출 (좋아요가 많은 퀴즈 우선)

### 📝 퀴즈 등록
- 사용자 직접 퀴즈 제출
- 관리자 승인 시스템

### 🏆 스코어보드
- 최고 점수 랭킹
- 개인 점수 저장 및 비교

## 설치 및 실행

### 사전 요구사항
- Node.js 16+
- Expo CLI
- Supabase 계정

### 설치
```bash
npm install
```

### Supabase 설정
1. Supabase 프로젝트 생성
2. `supabase-schema.sql` 파일의 SQL을 실행하여 테이블 생성
3. `src/config/supabase.ts`에서 Supabase URL과 API 키 설정:
```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

### 실행
```bash
# iOS
npm run ios

# Android
npm run android

# 웹
npm run web
```

## 프로젝트 구조

```
src/
├── components/         # 재사용 가능한 컴포넌트
├── config/            # 설정 파일
├── navigation/        # 네비게이션 설정
├── screens/           # 화면 컴포넌트
├── services/          # API 서비스
├── types/             # TypeScript 타입 정의
└── utils/             # 유틸리티 함수
```

## 데이터베이스 스키마

### 주요 테이블
- `quizzes`: 퀴즈 문제와 답
- `quiz_ratings`: 퀴즈 평가 (좋아요/싫어요/패스)
- `scores`: 게임 점수 기록
- `quiz_submissions`: 사용자 제출 퀴즈 (승인 대기)

## 개발 상태

✅ 완료된 기능:
- React Native 프로젝트 초기 설정
- Supabase 데이터베이스 스키마 설계
- 네비게이션 구조 설정
- 퀴즈 검색 화면
- 퀴즈 맞추기 게임 화면
- 퀴즈 평가 시스템
- 가중치 기반 퀴즈 노출
- 스코어보드 시스템
- 퀴즈 등록 화면
- Supabase API 연동

🔄 진행 중:
- 관리자 승인 시스템
- UI/UX 개선

## 기술 스택

- **Frontend**: React Native, Expo
- **Navigation**: React Navigation
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **Storage**: AsyncStorage

## 라이선스

MIT License
# 리팩토링 TODO

> 최종 업데이트: 2025-11-23

---

## 📋 우선순위: 높음

### 1. URL 라우팅 네이밍 개선

**현재 문제:**
- `/upload` 라우트가 너무 포괄적임
- 향후 다른 플랫폼(텔레그램, 디스코드 등) 업로드 기능 추가 시 충돌 가능

**권장 리팩토링:**

#### 옵션 1: 플랫 구조
```javascript
// src/router/index.jsx
/kakao-upload     // 카카오톡 업로드
/telegram-upload  // 텔레그램 업로드 (향후)
/discord-upload   // 디스코드 업로드 (향후)
```

#### 옵션 2: 계층 구조 (권장)
```javascript
// src/router/index.jsx
/upload/kakao     // 카카오톡 업로드
/upload/telegram  // 텔레그램 업로드 (향후)
/upload/discord   // 디스코드 업로드 (향후)
```

**영향 범위:**
- `src/router/index.jsx` - 라우트 경로 변경
- `src/components/layout/Header.jsx` - 네비게이션 경로 변경
- `src/pages/upload/KakaoUploadPage.jsx` - 컴포넌트 이름 유지 가능

**예상 작업 시간:** 10분

---

### 2. API 엔드포인트 파일 구조 개선

**현재 구조:**
```
src/api/endpoints/
├── chat.js          // Telegram API
└── relationship.js  // Relationship API
```

**문제점:**
- `chat.js`가 실제로는 Telegram 전용인데 이름이 모호함
- 향후 카카오톡, 디스코드 등 다른 플랫폼 추가 시 혼란

**권장 리팩토링:**
```
src/api/endpoints/
├── telegram.js      // Telegram API (chat.js에서 변경)
├── kakao.js         // Kakao API (새로 추가)
└── relationship.js  // Relationship API (유지)
```

**영향 범위:**
- `src/api/endpoints/chat.js` → `telegram.js`로 이름 변경
- 모든 import 구문 수정:
  - `src/pages/main/MainPage.jsx`
  - `src/pages/chat/ChatPage.jsx`

**예상 작업 시간:** 15분

---

### 3. 컴포넌트 폴더 구조 정리

**현재 구조:**
```
src/pages/
├── auth/
├── chat/
├── main/
├── test/
└── upload/
    └── KakaoUploadPage.jsx
```

**권장 리팩토링:**
```
src/pages/
├── auth/
├── chat/
├── main/
├── test/
└── upload/
    ├── KakaoUploadPage.jsx      // 현재
    ├── TelegramUploadPage.jsx   // 향후
    └── DiscordUploadPage.jsx    // 향후
```

또는 더 구체적으로:
```
src/pages/
├── auth/
├── chat/
├── main/
├── test/
├── kakao-upload/
│   └── KakaoUploadPage.jsx
├── telegram-upload/             // 향후
│   └── TelegramUploadPage.jsx
└── discord-upload/              // 향후
    └── DiscordUploadPage.jsx
```

**예상 작업 시간:** 20분

---

## 📋 우선순위: 중간

### 4. CSS 모듈 중복 제거

**문제점:**
- `MainPage.module.css`와 `ChatPage.module.css`에 중복 스타일 다수
- 예: `.avatar`, `.conversationItem`, `.name` 등

**권장 리팩토링:**
```
src/styles/
├── shared/
│   ├── conversation.module.css  // 대화 목록 공통 스타일
│   ├── message.module.css       // 메시지 공통 스타일
│   └── form.module.css          // 폼 공통 스타일
└── variables.css                // CSS 변수
```

**예상 작업 시간:** 1-2시간

---

### 5. 환경 변수 분리

**현재 문제:**
- API URL이 하드코딩되어 있음
- 예: `http://localhost:3000` 직접 사용

**권장 리팩토링:**
```javascript
// .env.development
VITE_API_BASE_URL=http://localhost:3000

// .env.production
VITE_API_BASE_URL=https://api.production.com

// src/config/env.js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

**영향 범위:**
- 모든 API 호출 코드
- `src/api/clients/http.js`
- SSE 연결 코드

**예상 작업 시간:** 30분

---

### 6. 상수 파일 통합

**현재 상태:**
- Relationship 관련 상수가 `relationship.js`에 섞여 있음

**권장 리팩토링:**
```
src/constants/
├── relationship.js   // RELATIONSHIP_CATEGORIES, LABELS 등
├── routes.js         // 라우트 경로 상수
└── api.js            // API 엔드포인트 상수
```

**예상 작업 시간:** 20분

---

## 📋 우선순위: 낮음

### 7. 타입스크립트 마이그레이션

**권장 사항:**
- 프로젝트가 일정 규모 이상 커지면 TypeScript로 마이그레이션 고려
- API 응답 타입, Props 타입 등 명확하게 정의

**예상 작업 시간:** 1-2주

---

### 8. 에러 바운더리 추가

**권장 사항:**
- React Error Boundary 추가로 전역 에러 핸들링
- 사용자에게 친화적인 에러 메시지 표시

**예상 작업 시간:** 2-3시간

---

### 9. 로딩 컴포넌트 통합

**현재 문제:**
- 각 페이지마다 로딩 UI가 중복됨

**권장 리팩토링:**
```javascript
// src/components/common/Loading.jsx
export const Loading = ({ message = '로딩 중...' }) => (
  <div className={styles.loading}>{message}</div>
);

// 사용
<Loading />
<Loading message="업로드 중..." />
```

**예상 작업 시간:** 30분

---

## 📚 참고 자료

- [React 공식 문서 - 파일 구조](https://react.dev/learn/thinking-in-react#step-1-break-the-ui-into-a-component-hierarchy)
- [Vite 환경 변수 가이드](https://vitejs.dev/guide/env-and-mode.html)
- [CSS Modules 모범 사례](https://github.com/css-modules/css-modules)

---

## 📝 작업 이력

(아직 없음)

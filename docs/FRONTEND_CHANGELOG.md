# 프론트엔드 개발 변경 이력

> 최종 업데이트: 2025-11-20

---

## 2025-11-20: 관계 설정 기능 및 UI 개선

### ✅ 완료된 작업

#### 1. 관계 설정 기능 구현

**새로 생성된 파일:**
- `src/api/endpoints/relationship.js` - Relationship API 클라이언트

**주요 기능:**
- ✅ 관계 CRUD API 함수 구현
  - `getRelationships()` - 모든 관계 목록 조회
  - `getRelationship(id)` - 특정 관계 조회
  - `createRelationship(data)` - 관계 생성
  - `updateRelationship(id, data)` - 관계 수정
  - `deleteRelationship(id)` - 관계 삭제

**관계 설정 옵션:**
```javascript
// 관계 카테고리 (10종)
FAMILY_ELDER_CLOSE       // 어른 가족 (부모/조부모)
FAMILY_SIBLING_ELDER     // 형/오빠/언니/누나
FAMILY_SIBLING_YOUNGER   // 남/여동생
PARTNER_INTIMATE         // 연인/배우자
FRIEND_CLOSE             // 친한 친구
ACQUAINTANCE_CASUAL      // 가벼운 지인
WORK_SENIOR_FORMAL       // 상사/교수/임원
WORK_SENIOR_FRIENDLY     // 가까운 선배/멘토
WORK_PEER                // 동료/파트너
WORK_JUNIOR              // 후배/인턴/팀원

// 존댓말 수준 (3종)
FORMAL   // 격식 존댓말 (-습니다)
POLITE   // 일반 존댓말 (-요)
CASUAL   // 반말

// 대화 분위기 (4종)
CALM      // 차분
DIRECT    // 직설적
PLAYFUL   // 장난스러운
CARING    // 배려하는

// 이모지 사용 빈도: 0-5 (슬라이더)
```

#### 2. ChatPage 관계 설정 UI 추가

**파일:** `src/pages/chat/ChatPage.jsx`, `src/pages/chat/ChatPage.module.css`

**추가된 UI 요소:**

1. **채팅 헤더 관계 정보 표시**
   - 위치: 채팅 상대 이름 하단 부제목
   - 표시 내용: `{관계 카테고리} · {메시지 개수}개의 메시지`
   - 예시: "친한 친구 · 5개의 메시지" 또는 "관계 미설정 · 3개의 메시지"

2. **관계 설정 버튼**
   - 위치: 채팅 헤더 우측 (⚙️ 아이콘)
   - 기능: 클릭 시 관계 설정 모달 열기

3. **관계 설정 모달**
   - 크기: 최대 480px 너비, 90vh 최대 높이
   - 구성:
     - 헤더: "관계 설정" 제목 + 닫기 버튼 (✕)
     - 바디: 4개 폼 그룹
       - 관계 카테고리 (select)
       - 존댓말 수준 (select)
       - 대화 분위기 (select)
       - 이모지 사용 빈도 (range slider 0-5)
     - 푸터: 취소/저장 버튼

**동작 흐름:**
1. ChatPage 진입 시 자동으로 관계 정보 조회 (`fetchRelationship`)
2. 관계가 존재하면 폼에 자동 채움, 없으면 기본값 사용
3. 저장 버튼 클릭 시:
   - 기존 관계 있음 → `PATCH /relationships/:id` (수정)
   - 기존 관계 없음 → `POST /relationships` (생성)
4. 저장 성공 시 관계 정보 재조회 후 모달 닫기

#### 3. AI 추천 답변 로딩 UI 개선

**파일:** `src/pages/chat/ChatPage.jsx`, `src/pages/chat/ChatPage.module.css`

**개선 내용:**
- ✅ `recommendationLoading` 상태 활용
- ✅ 로딩 중 표시: "💡 AI 추천 답변 생성 중..." + 회전 스피너
- ✅ 로딩 완료 후 추천 답변 버튼 표시
- ✅ CSS 애니메이션: `@keyframes spin` (0.8초 회전)

#### 4. 레이아웃 크기 통일

**수정된 파일:**
- `src/pages/main/MainPage.module.css`
- `src/pages/chat/ChatPage.module.css`

**변경 내용:**
- MainPage 대화 목록: 35% → **30%**
- ChatPage 대화 목록: **30%** (유지)
- 채팅창 영역: **70%** (양쪽 동일)

**효과:**
- MainPage와 ChatPage 간 레이아웃 일관성 확보
- 사용자가 페이지 전환 시 레이아웃 변화 없음

---

### 📁 수정된 파일 목록

#### 신규 생성
1. `src/api/endpoints/relationship.js` - Relationship API 클라이언트 (141줄)

#### 수정
1. `src/pages/chat/ChatPage.jsx`
   - 관계 설정 상태 관리 추가 (4개 state)
   - 관계 조회/저장 함수 추가 (`fetchRelationship`, `handleSaveRelationship`)
   - useEffect에 관계 조회 추가
   - 채팅 헤더에 관계 정보 표시 및 설정 버튼 추가
   - 관계 설정 모달 UI 추가 (91줄)
   - AI 추천 로딩 UI 개선

2. `src/pages/chat/ChatPage.module.css`
   - 관계 설정 버튼 스타일 추가 (`.relationshipButton`)
   - AI 추천 로딩 스피너 스타일 추가 (`.loadingSpinner`, `.spinner`)
   - 관계 설정 모달 스타일 추가 (173줄):
     - `.modalOverlay` - 반투명 배경
     - `.modalContent` - 모달 본체
     - `.modalHeader` - 모달 헤더
     - `.modalBody` - 모달 본문
     - `.formGroup`, `.formLabel`, `.formSelect` - 폼 요소
     - `.formRange` - 슬라이더 (Chrome/Firefox 호환)
     - `.modalFooter` - 모달 푸터
     - `.modalCancelButton`, `.modalSaveButton` - 버튼

3. `src/pages/main/MainPage.module.css`
   - 대화 목록 너비: 35% → 30%

---

### 🔧 기술적 세부사항

#### API 통합
```javascript
// 관계 조회 (컴포넌트 마운트 시)
const relationships = await relationshipAPI.getRelationships();
const currentRelationship = relationships.find(rel => rel.partner_id === partnerId);

// 관계 생성
await relationshipAPI.createRelationship({
  partnerId: partnerId,
  category: 'FRIEND_CLOSE',
  politeness: 'CASUAL',
  vibe: 'PLAYFUL',
  emojiLevel: 3
});

// 관계 수정
await relationshipAPI.updateRelationship(relationshipId, {
  category: 'FRIEND_CLOSE',
  politeness: 'POLITE',
  vibe: 'CALM',
  emojiLevel: 2
});
```

#### CSS 주요 기술
- **모달 오버레이**: `position: fixed` + `z-index: 2000`
- **모달 센터링**: Flexbox (`align-items: center`, `justify-content: center`)
- **스피너 애니메이션**: CSS `@keyframes` + `transform: rotate(360deg)`
- **슬라이더 스타일링**: `-webkit-slider-thumb` + `-moz-range-thumb`
- **반응형**: 기존 모바일 대응 유지

---

### 📝 알려진 이슈 및 제한사항

1. **관계 미설정 시 AI 답변**
   - 관계가 설정되지 않은 경우 백엔드 기본값 사용
   - 프론트엔드에서 명시적 안내 제공 ("관계 미설정")

2. **관계 삭제 기능 미구현**
   - 현재는 생성/수정만 가능
   - 필요시 추가 구현 가능

3. **슬라이더 브라우저 호환성**
   - Chrome/Firefox: 정상 동작
   - Safari: 기본 스타일 적용 가능성

---

### 🎯 다음 단계 (예정)

#### 우선순위: 높음
1. **백엔드 Default 답변 추가 대응**
   - `docs/BACKEND_REQUESTS.md` 참조
   - 백엔드에서 default 답변 추가 시 프론트엔드 UI 업데이트 필요
   - `isDefault: true` 플래그 처리 (예: 다른 스타일 적용)

2. **관계 설정 후 AI 답변 테스트**
   - 실제 Telegram 메시지로 관계 설정 전/후 AI 답변 차이 확인
   - 톤, 이모지, 존댓말 수준이 제대로 반영되는지 검증

#### 우선순위: 중간
3. **관계 삭제 기능 추가**
   - 모달에 "삭제" 버튼 추가
   - 삭제 확인 다이얼로그 구현

4. **관계 설정 프리셋**
   - 자주 사용하는 관계 조합 미리 저장
   - 예: "친한 친구 (반말, 장난스러운, 이모지 많음)"

5. **반응형 모달 개선**
   - 모바일에서 모달 크기 최적화
   - 슬라이더 터치 UX 개선

#### 우선순위: 낮음
6. **관계별 통계**
   - 각 관계 카테고리별 사용자 수
   - 가장 많이 사용된 설정 조합

7. **관계 변경 이력**
   - 관계 설정 변경 기록 저장
   - 언제 어떻게 변경했는지 확인

---

### 📌 참고 문서

- [Relationship API 명세](./API_SPECIFICATION.md#5-관계-relationships)
- [Telegram API 요약](./TELEGRAM_API_SUMMARY.md)
- [백엔드 요청사항](./BACKEND_REQUESTS.md)
- [데이터베이스 스키마](./DB_SCHEMA.md)

---

## 이전 변경 이력

### 2025-11-20: 채팅 페이지 레이아웃 및 UI 개선

- ✅ ChatPage 레이아웃 30/70 비율로 변경
- ✅ 모바일 반응형 햄버거 메뉴 추가
- ✅ AI 추천 답변 인라인 배치
- ✅ 직접 메시지 입력 기능 추가
- ✅ 수신 메시지 텍스트 가시성 개선 (검은색)

### 2025-11-20: 백엔드 API 통합

- ✅ Telegram API 클라이언트 구현 (`src/api/endpoints/chat.js`)
- ✅ Conversations API 통합
- ✅ MainPage 대화 목록 API 연동
- ✅ 실시간 메시지 수신 (SSE)

### 2025-11-11 이전: 초기 개발

- ✅ 로그인/회원가입 페이지 구현
- ✅ JWT 인증 플로우 구현
- ✅ MainPage 기본 레이아웃
- ✅ Header 컴포넌트

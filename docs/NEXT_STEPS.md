# 다음 작업 단계

> 최종 업데이트: 2025-11-20

---

## 📋 현재 상태

### ✅ 완료된 주요 기능
1. **인증 시스템**
   - 로그인/회원가입 페이지
   - JWT 토큰 관리
   - 자동 토큰 갱신

2. **메인 페이지**
   - 대화 목록 표시 (30% 너비)
   - 실시간 메시지 수신 (SSE)
   - Telegram API 통합

3. **채팅 페이지**
   - 30/70 레이아웃 (대화 목록 + 채팅창)
   - AI 추천 답변 생성 및 표시
   - 직접 메시지 입력
   - 로딩 인디케이터
   - 모바일 반응형 (햄버거 메뉴)

4. **관계 설정 기능**
   - 관계 카테고리, 존댓말, 분위기, 이모지 설정
   - 관계 설정 모달 UI
   - API 통합 (생성/수정)

---

## 🎯 즉시 진행 가능한 작업

### 우선순위: 높음 🔥

#### 1. 백엔드 Default 답변 추가 반영
**상태:** 백엔드 대기 중
**관련 문서:** [BACKEND_REQUESTS.md](./BACKEND_REQUESTS.md)

**백엔드 완료 후 프론트엔드 작업:**
1. `recommendations` 배열에서 `isDefault: true` 플래그 확인
2. Default 답변에 시각적 구분 추가:
   ```jsx
   <button className={rec.isDefault ? styles.defaultRecommendation : styles.recommendationButton}>
     {rec.isDefault && '⭐ '}
     {rec.text}
   </button>
   ```
3. CSS 스타일 추가:
   ```css
   .defaultRecommendation {
     background-color: #fff3cd;
     border-color: #ffc107;
   }
   ```

**예상 소요 시간:** 30분
**파일 수정:** `ChatPage.jsx`, `ChatPage.module.css`

---

#### 2. 관계 설정 실제 테스트 및 검증
**상태:** 준비 완료
**목적:** 관계 설정이 AI 답변에 제대로 반영되는지 확인

**테스트 시나리오:**
1. **테스트 1: 격식 존댓말**
   - 관계: `WORK_SENIOR_FORMAL`, `FORMAL`, `CALM`, 이모지 0
   - 예상: "네, 확인했습니다. 처리하겠습니다."

2. **테스트 2: 친구 반말**
   - 관계: `FRIEND_CLOSE`, `CASUAL`, `PLAYFUL`, 이모지 4
   - 예상: "ㅇㅋㅇㅋ ㅋㅋㅋ 😆🎉"

3. **테스트 3: 연인**
   - 관계: `PARTNER_INTIMATE`, `CASUAL`, `CARING`, 이모지 5
   - 예상: "알았어 ❤️💕 금방 갈게! 😊✨"

**검증 항목:**
- [ ] 톤 변화 (격식/반말)
- [ ] 이모지 개수 증감
- [ ] 분위기 반영 (차분/장난스러운)
- [ ] 관계 수정 시 즉시 반영

**예상 소요 시간:** 1시간
**필요 환경:** Telegram 봇, 실제 메시지 수신

---

#### 3. 에러 처리 개선
**상태:** 기본적인 에러 처리만 존재
**개선 필요 영역:**

1. **관계 설정 저장 실패**
   ```javascript
   catch (err) {
     console.error('관계 저장 실패:', err);
     alert('관계 설정 저장에 실패했습니다');  // 너무 단순
   }
   ```

   **개선안:**
   ```javascript
   catch (err) {
     const errorMessage = err.response?.data?.message || '관계 설정 저장에 실패했습니다';
     setErrorModal({
       show: true,
       title: '저장 실패',
       message: errorMessage,
       type: 'error'
     });
   }
   ```

2. **AI 추천 생성 실패**
   - 현재: 콘솔 로그만 출력
   - 개선: 사용자에게 재시도 옵션 제공

3. **네트워크 오류**
   - 오프라인 상태 감지
   - 재연결 시 자동 재시도

**예상 소요 시간:** 2시간
**파일 수정:** `ChatPage.jsx`, 에러 모달 컴포넌트 신규 생성

---

### 우선순위: 중간 ⚡

#### 4. 관계 삭제 기능 추가
**상태:** 준비 완료 (API 존재)
**작업 내용:**

1. **모달에 삭제 버튼 추가**
   ```jsx
   <div className={styles.modalFooter}>
     {relationship && (
       <button className={styles.deleteButton} onClick={handleDeleteRelationship}>
         삭제
       </button>
     )}
     <button className={styles.modalCancelButton} onClick={...}>취소</button>
     <button className={styles.modalSaveButton} onClick={...}>저장</button>
   </div>
   ```

2. **삭제 확인 다이얼로그**
   ```javascript
   const handleDeleteRelationship = () => {
     if (confirm('관계 설정을 삭제하시겠습니까? AI는 기본 설정으로 답변을 생성합니다.')) {
       await relationshipAPI.deleteRelationship(relationship.id);
       setRelationship(null);
       setShowRelationshipModal(false);
     }
   };
   ```

**예상 소요 시간:** 1시간
**파일 수정:** `ChatPage.jsx`, `ChatPage.module.css`

---

#### 5. 대화 검색 기능
**상태:** 신규 기능
**목적:** 메시지가 많을 때 특정 내용 빠르게 찾기

**UI 위치:** 채팅 헤더 (이름과 관계 설정 버튼 사이)

**구현 방안:**
1. 검색 아이콘 버튼 추가
2. 클릭 시 검색 입력창 표시
3. 입력한 키워드로 메시지 필터링
4. 일치하는 메시지 하이라이트

**예상 소요 시간:** 3시간
**파일 수정:** `ChatPage.jsx`, `ChatPage.module.css`

---

#### 6. 메시지 전송 실패 재시도
**상태:** 신규 기능
**현재 문제:** 메시지 전송 실패 시 alert만 표시하고 재시도 불가

**개선안:**
1. 전송 실패한 메시지 임시 저장
2. 재시도 버튼 표시
3. 3번 실패 시 완전 실패 처리

**예상 소요 시간:** 2시간
**파일 수정:** `ChatPage.jsx`

---

### 우선순위: 낮음 💡

#### 7. 관계 프리셋
**상태:** 신규 기능
**목적:** 자주 사용하는 관계 조합을 빠르게 선택

**예시:**
- "친한 친구" → `FRIEND_CLOSE` + `CASUAL` + `PLAYFUL` + 이모지 3
- "직장 상사" → `WORK_SENIOR_FORMAL` + `FORMAL` + `CALM` + 이모지 0
- "가족 어른" → `FAMILY_ELDER_CLOSE` + `FORMAL` + `CARING` + 이모지 1

**구현:**
1. 프리셋 목록 정의 (상수)
2. 모달 상단에 프리셋 버튼 추가
3. 클릭 시 해당 값으로 폼 자동 채우기

**예상 소요 시간:** 2시간

---

#### 8. 대화 통계 페이지
**상태:** 신규 기능
**표시 내용:**
- 총 대화 상대 수
- 총 메시지 수
- 가장 많이 대화한 상대 TOP 5
- 관계별 분포 (파이 차트)
- 이모지 사용 빈도 평균

**예상 소요 시간:** 5시간
**새 파일:** `pages/stats/StatsPage.jsx`

---

#### 9. 다크 모드
**상태:** 신규 기능
**작업 내용:**
1. 다크 모드 토글 버튼 (Header)
2. CSS 변수 활용한 테마 시스템
3. localStorage에 설정 저장
4. 모든 페이지 다크 모드 스타일 적용

**예상 소요 시간:** 4시간
**파일 수정:** 거의 모든 CSS 파일

---

#### 10. 카카오톡 업로드 페이지
**상태:** 백엔드 준비 완료, 프론트엔드 미구현
**기능:**
- 카카오톡 txt 파일 드래그앤드롭
- Partner 이름 입력
- 관계 카테고리 선택
- 업로드 진행률 표시
- 통계 표시 (내 메시지 수, 상대 메시지 수)

**예상 소요 시간:** 4시간
**새 파일:** `pages/upload/KakaoUploadPage.jsx`

---

## 🛠️ 기술 부채 및 리팩토링

### 1. API 클라이언트 통합
**현재 상태:**
- `chat.js` - Telegram API
- `relationship.js` - Relationship API
- 인증 API는 별도 파일 없음

**개선안:**
- `api/endpoints/index.js` 생성하여 모든 API 중앙 관리
- API 에러 처리 공통화

**예상 소요 시간:** 2시간

---

### 2. 컴포넌트 분리
**현재 문제:** ChatPage가 너무 복잡 (450줄)

**분리 대상:**
- `ConversationList.jsx` - 대화 목록 사이드바
- `MessageList.jsx` - 메시지 리스트
- `RecommendationPanel.jsx` - AI 추천 답변
- `MessageInput.jsx` - 메시지 입력
- `RelationshipModal.jsx` - 관계 설정 모달

**예상 소요 시간:** 4시간

---

### 3. 상태 관리 개선
**현재:** useState 15개 이상 사용

**개선안:**
- useReducer로 복잡한 상태 통합
- 또는 Zustand/Jotai 같은 경량 상태 관리 도입

**예상 소요 시간:** 3시간

---

## 📝 권장 작업 순서

### Phase 1: 긴급 (이번 주)
1. ✅ 관계 설정 기능 완료 (완료됨)
2. ⏳ 백엔드 Default 답변 대기 → 프론트 반영
3. ⏳ 관계 설정 실제 테스트 및 검증

### Phase 2: 중요 (다음 주)
4. 에러 처리 개선
5. 관계 삭제 기능
6. 메시지 전송 실패 재시도

### Phase 3: 편의성 개선 (2주 후)
7. 대화 검색 기능
8. 관계 프리셋
9. 컴포넌트 분리 (리팩토링)

### Phase 4: 확장 기능 (3주 후)
10. 카카오톡 업로드 페이지
11. 대화 통계 페이지
12. 다크 모드

---

## 🐛 알려진 버그 및 이슈

### 버그 1: SSE 연결 끊김
**증상:** 오래 유지 시 SSE 연결이 끊어짐
**영향:** 새 메시지 실시간 수신 불가
**임시 해결:** 페이지 새로고침
**근본 해결:** SSE 재연결 로직 추가

---

### 버그 2: 모바일에서 슬라이더 터치 감도
**증상:** 모바일에서 이모지 슬라이더 조작 어려움
**영향:** 관계 설정 불편
**해결:** 슬라이더 터치 영역 확대, 터치 이벤트 최적화

---

### 버그 3: 대화 목록 정렬 기준 불명확
**증상:** 때때로 최신 메시지 순이 아님
**영향:** 사용자 혼란
**해결:** 백엔드 정렬 기준 확인 및 명시

---

## 📞 문의 및 협업

### 백엔드 팀 요청사항
- [ ] Default 답변 추가 ([BACKEND_REQUESTS.md](./BACKEND_REQUESTS.md))
- [ ] SSE 재연결 로직 지원
- [ ] 대화 목록 정렬 기준 명확화

### 디자인 요청사항
- [ ] 에러 모달 디자인
- [ ] 다크 모드 색상 팔레트
- [ ] 로딩 스켈레톤 UI

---

## 📚 참고 문서

- [프론트엔드 변경 이력](./FRONTEND_CHANGELOG.md)
- [관계 설정 기능 가이드](./RELATIONSHIP_FEATURE.md)
- [API 명세서](./API_SPECIFICATION.md)
- [Telegram API 요약](./TELEGRAM_API_SUMMARY.md)
- [백엔드 요청사항](./BACKEND_REQUESTS.md)

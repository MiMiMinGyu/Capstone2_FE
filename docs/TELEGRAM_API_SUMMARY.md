# Telegram API 엔드포인트 정리

> 최종 업데이트: 2025-11-20
>
> **목적**: 채팅 페이지 구현을 위한 Telegram API 연동 가이드

## 📋 개요

LikemeLikeMe 프로젝트는 Telegram 봇을 통해 메시지를 수신하고, LLM가 사용자의 말투를 학습하여 추천 답변을 생성합니다.

### 핵심 플로우
1. 사용자가 Telegram 계정 연동
2. 친구로부터 메시지 수신
3. 프론트엔드에서 메시지 확인
4. AI 추천 답변 생성 요청
5. 추천 답변 중 하나를 선택하여 전송

---

## 🔌 API 엔드포인트

### 1. 봇 상태 확인
**목적**: Telegram 봇이 정상적으로 실행 중인지 확인

```http
GET /telegram/status
```

**응답 예시**:
```json
{
  "status": "Telegram bot is running",
  "timestamp": "2025-11-20T01:02:45.341Z"
}
```

**프론트엔드 사용**:
```javascript
import { telegramAPI } from '@/api/endpoints/chat';

const checkBotStatus = async () => {
  const status = await telegramAPI.getBotStatus();
  console.log(status); // { status: "Telegram bot is running", ... }
};
```

---

### 2. 대화 상대 목록 가져오기 ⭐ (추천)
**목적**: 사용자의 모든 대화 상대 목록 조회 (MainPage용)

```http
GET /telegram/conversations
Authorization: Bearer {access_token}
```

**응답 예시**:
```json
[
  {
    "partner_id": "70b84a01-96d8-4c32-a78a-6a7e1ddc8b2b",
    "partner_name": "재영",
    "partner_telegram_id": "8221575607",
    "last_message": "안녕",
    "last_message_time": "2025-11-11T04:49:14.462Z",
    "updated_at": "2025-11-11T04:49:14.454Z"
  }
]
```

**필드 설명**:
- `partner_id`: Partner 테이블의 UUID (채팅 페이지 라우팅에 사용)
- `partner_name`: 대화 상대 이름
- `partner_telegram_id`: Telegram 사용자 ID
- `last_message`: 마지막 메시지 내용
- `last_message_time`: 마지막 메시지 시간
- `updated_at`: 대화 업데이트 시간

**프론트엔드 사용**:
```javascript
const fetchConversations = async () => {
  const conversations = await telegramAPI.getConversations();
  console.log(conversations); // 대화 상대 배열

  // 채팅 페이지로 이동
  navigate(`/chat/${conversations[0].partner_id}`);
};
```

**장점**:
- ✅ 백엔드에서 이미 그룹핑 및 정렬 완료
- ✅ 마지막 메시지 정보 포함
- ✅ MainPage 구현이 훨씬 간단해짐
- ✅ `/telegram/messages`보다 성능 우수

---

### 3. 특정 대화 상대의 메시지 가져오기 (참고용)
**목적**: 특정 Partner와의 대화 내역 조회 (페이지네이션 지원)

```http
GET /telegram/conversations/{partnerId}/messages
Authorization: Bearer {access_token}
```

**쿼리 파라미터**:
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 50)

**응답 예시**:
```json
{
  "partner": {
    "id": "70b84a01-96d8-4c32-a78a-6a7e1ddc8b2b",
    "name": "재영",
    "telegram_id": "8221575607"
  },
  "messages": [
    {
      "id": "96f5990f-badd-4212-8730-8234ad484930",
      "role": "user",
      "text": "안녕",
      "created_at": "2025-11-11T04:49:14.462Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "totalPages": 1
  }
}
```

**비고**:
- 현재 미사용 (채팅 페이지에서 필요시 사용 가능)
- 페이지네이션 지원으로 대량 메시지 처리 가능

---

### 4. 메시지 가져오기 (전체)
**목적**: 수신된 모든 Telegram 메시지 조회 (원시 데이터)

```http
GET /telegram/messages
```

**쿼리 파라미터**:
- `isPolling` (optional): 폴링 여부

**응답 예시**:
```json
[
  {
    "message_id": 12345,
    "from": {
      "id": 987654321,
      "is_bot": false,
      "first_name": "홍길동",
      "last_name": "",
      "username": "hong_gildong"
    },
    "chat": {
      "id": 987654321,
      "first_name": "홍길동",
      "type": "private"
    },
    "date": 1700000000,
    "text": "오늘 뭐해?"
  }
]
```

**프론트엔드 사용**:
```javascript
const fetchMessages = async () => {
  const messages = await telegramAPI.getMessages();
  console.log(messages); // 메시지 배열
};
```

---

### 3. AI 추천 답변 생성
**목적**: 특정 메시지에 대한 AI 추천 답변 생성

```http
POST /telegram/recommendations
Content-Type: application/json
Authorization: Bearer {access_token}
```

**요청 바디**:
```json
{
  "messageId": 12345
}
```

**응답 예시**:
```json
[
  {
    "text": "오늘은 좀 바쁜데 나중에 연락할게!",
    "messageId": 12345
  },
  {
    "text": "지금 집에서 쉬고 있어 ㅋㅋ",
    "messageId": 12345
  },
  {
    "text": "별로 특별한 건 없어~",
    "messageId": 12345
  }
]
```

**프론트엔드 사용**:
```javascript
const getRecommendations = async (messageId) => {
  const recommendations = await telegramAPI.generateRecommendations(messageId);
  console.log(recommendations); // 추천 답변 배열 (보통 3개)
};
```

---

### 4. 답변 전송
**목적**: 선택한 추천 답변을 Telegram으로 전송

```http
POST /telegram/reply
Content-Type: application/json
Authorization: Bearer {access_token}
```

**요청 바디**:
```json
{
  "messageId": 12345,
  "selectedReply": "오늘은 좀 바쁜데 나중에 연락할게!"
}
```

**응답 예시**:
```json
{
  "success": true,
  "message": "Reply sent successfully"
}
```

**프론트엔드 사용**:
```javascript
const sendReply = async (messageId, replyText) => {
  const result = await telegramAPI.sendReply(messageId, replyText);
  console.log(result); // { success: true, ... }
};
```

---

### 5. 직접 메시지 전송 (옵션)
**목적**: 추천 답변이 아닌 사용자 작성 메시지 전송

```http
POST /telegram/send
Content-Type: application/json
Authorization: Bearer {access_token}
```

**요청 바디**:
```json
{
  "chatId": 987654321,
  "text": "안녕! 잘 지내?"
}
```

**응답 예시**:
```json
{
  "success": true,
  "message_id": 12346
}
```

**프론트엔드 사용**:
```javascript
const sendCustomMessage = async (chatId, text) => {
  const result = await telegramAPI.sendMessage(chatId, text);
  console.log(result); // { success: true, message_id: 12346 }
};
```

---

### 6. 실시간 메시지 이벤트 (SSE)
**목적**: 새 메시지가 도착하면 실시간으로 알림

```http
GET /telegram/events
```

**SSE 스트림**:
```
data: {"message_id": 12347, "from": {...}, "text": "새 메시지!"}
```

**프론트엔드 사용**:
```javascript
useEffect(() => {
  const eventSource = new EventSource('http://localhost:3000/telegram/events');

  eventSource.onmessage = (event) => {
    const newMessage = JSON.parse(event.data);
    console.log('새 메시지 도착:', newMessage);
    // 메시지 목록 갱신 로직
  };

  return () => {
    eventSource.close();
  };
}, []);
```

---

## 🛠 기존 코드 구조

### API 클라이언트 (`src/api/clients/http.js`)
- Axios 인스턴스 설정
- JWT 토큰 자동 주입 (요청 인터셉터)
- 401 에러 시 토큰 자동 갱신 (응답 인터셉터)
- 에러 핸들링 및 사용자 친화적 메시지 생성

### Telegram API 함수들 (`src/api/endpoints/chat.js`)
현재 6개의 함수가 정의되어 있습니다:

| 함수명 | 설명 | 엔드포인트 | 권장 |
|--------|------|-----------|------|
| `getConversations()` | 대화 목록 가져오기 | GET /telegram/conversations | ⭐ MainPage용 |
| `getMessages()` | 메시지 가져오기 | GET /telegram/messages | |
| `generateRecommendations(messageId)` | AI 추천 생성 | POST /telegram/recommendations | |
| `sendReply(messageId, selectedReply)` | 답변 전송 | POST /telegram/reply | |
| `sendMessage(chatId, text)` | 직접 메시지 전송 | POST /telegram/send | |
| `getBotStatus()` | 봇 상태 확인 | GET /telegram/status | |

**사용 예시**:
```javascript
import { telegramAPI } from '@/api/endpoints/chat';

// 또는 개별 import
import { getConversations, getMessages, generateRecommendations, sendReply } from '@/api/endpoints/chat';
```

---

## 📝 채팅 페이지 구현 시 고려사항

### 1. 대화 목록 표시 (MainPage)
**추천**: `/telegram/conversations` API 사용

```javascript
// 기존 방식 (비추천): 메시지를 가져와서 수동 그룹핑
const messages = await getMessages();
const grouped = groupMessagesByUser(messages); // 수동 그룹핑 필요

// 새로운 방식 (추천): 백엔드에서 이미 그룹핑된 데이터
const conversations = await getConversations();
// 바로 사용 가능! 그룹핑 불필요
```

**장점**:
- ✅ 코드 간결화
- ✅ 성능 향상 (백엔드에서 최적화)
- ✅ 마지막 메시지 정보 자동 포함

### 2. 실시간 업데이트
SSE를 통해 새 메시지 도착 시 자동 갱신:
```javascript
useEffect(() => {
  const eventSource = new EventSource('http://localhost:3000/telegram/events');

  eventSource.onmessage = (event) => {
    const newMessage = JSON.parse(event.data);
    fetchMessages(); // 메시지 목록 갱신
  };

  return () => eventSource.close();
}, []);
```

### 3. 에러 핸들링
API 클라이언트에서 `userMessage` 필드를 추가하므로 UI에서 표시:
```javascript
try {
  const messages = await getMessages();
} catch (error) {
  alert(error.userMessage || '알 수 없는 오류가 발생했습니다.');
}
```

---

## 🧪 테스트 페이지

테스트 페이지를 `/test/telegram` 경로에 추가했습니다.

**접속 방법**:
1. 로그인 후
2. 브라우저에서 `http://localhost:5173/test/telegram` 접속
3. 각 API 버튼 클릭하여 동작 확인

**테스트 항목**:
- ✅ 봇 상태 확인
- ✅ 메시지 가져오기
- ✅ AI 추천 답변 생성
- ✅ 답변 전송

**파일 위치**:
- `src/pages/test/TelegramAPITest.jsx`
- `src/pages/test/TelegramAPITest.module.css`

---

## 🚀 다음 단계: 채팅 페이지 구현

### 예상 컴포넌트 구조
```
src/pages/chat/
├── ChatPage.jsx                # 메인 채팅 페이지
├── ChatPage.module.css
└── components/
    ├── MessageList.jsx         # 메시지 목록 (왼쪽)
    ├── ChatWindow.jsx          # 채팅 창 (중앙)
    ├── RecommendationPanel.jsx # AI 추천 패널 (오른쪽)
    └── MessageBubble.jsx       # 메시지 말풍선
```

### 레이아웃 구조
```
┌─────────────────────────────────────────────────┐
│                    Header                        │
├──────────────┬───────────────────┬──────────────┤
│ MessageList  │   ChatWindow      │ Recommend    │
│ (대화 목록)   │   (메시지 내역)    │ Panel        │
│ 20%          │   50%             │ (AI 추천)    │
│              │                   │ 30%          │
│              ├───────────────────┤              │
│              │ 메시지 입력 (옵션) │              │
└──────────────┴───────────────────┴──────────────┘
```

### 핵심 기능
1. **메시지 목록**: 대화 상대 표시 (MainPage와 동일)
2. **채팅 창**: 선택한 상대와의 메시지 내역 표시
3. **AI 추천 패널**:
   - 최신 메시지에 대한 추천 답변 자동 생성
   - 추천 답변 클릭 시 전송
4. **실시간 업데이트**: SSE로 새 메시지 자동 반영

---

## 📚 참고 문서

- [프론트엔드 API 가이드](./FRONTEND_API_GUIDE.md)
- [프론트엔드 진행 상황](./FRONTEND_PROGRESS.md)
- [API 명세서](./API_SPECIFICATION.md)

---

## ✅ 백엔드 연동 확인 결과

### 테스트 날짜: 2025-11-20

| API | 상태 | 비고 |
|-----|------|------|
| GET /telegram/status | ✅ 성공 | 봇 정상 실행 중 |
| GET /telegram/conversations | ✅ 성공 | 대화 목록 1개 확인 (재영) |
| GET /telegram/messages | ✅ 성공 | 원시 메시지 데이터 |
| POST /telegram/recommendations | ⏳ 대기 | 메시지 수신 후 테스트 가능 |
| POST /telegram/reply | ⏳ 대기 | 추천 답변 생성 후 테스트 가능 |
| POST /telegram/send | ⏳ 대기 | 필요 시 테스트 |
| GET /telegram/events (SSE) | ✅ 성공 | MainPage에서 이미 사용 중 |

**결론**:
- 백엔드 서버 정상 실행 중
- API 엔드포인트 모두 준비 완료
- 채팅 페이지 구현 준비 완료 ✅

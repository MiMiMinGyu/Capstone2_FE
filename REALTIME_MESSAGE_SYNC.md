# 실시간 메시지 동기화 가이드 (이벤트 기반)

## 📌 개요
이 문서는 텔레그램 봇으로 새 메시지를 받았을 때 **폴링 없이** 프론트엔드에 실시간으로 반영하는 방법을 설명합니다.

**절대 금지**: 5초마다, 10초마다 등 주기적인 리로드 방식(폴링)은 사용하지 않습니다.
**권장 방식**: Server-Sent Events(SSE)를 사용하여 서버에서 새 메시지 이벤트가 발생했을 때만 프론트엔드에 알림을 보냅니다.

---

## 🔍 현재 문제점

### 1. 백엔드 SSE 엔드포인트 부재
- 프론트엔드: `ChatPage.jsx:181`에서 `new EventSource('http://localhost:3000/telegram/events')` 연결 시도
- 백엔드: `/telegram/events` 엔드포인트가 존재하지 않음 → **404 에러 발생**

### 2. 메시지가 실시간으로 반영되지 않는 이유
```
[텔레그램 봇] → [백엔드 인메모리 저장] → ❌ 프론트엔드에 알림 없음
                                          ↓
                                   [수동 새로고침 필요]
```

---

## ✅ 해결 방법: SSE(Server-Sent Events) 구현

### SSE란?
- 서버에서 클라이언트로 **단방향 실시간 데이터 스트림** 전송
- WebSocket보다 가볍고 구현이 간단
- 새 메시지 알림 같은 서버 → 클라이언트 푸시에 최적

### 동작 흐름
```
[텔레그램 봇] → [백엔드: 메시지 수신]
                     ↓
              [SSE로 이벤트 발행]
                     ↓
         [프론트엔드: 이벤트 수신]
                     ↓
         [메시지 목록 자동 갱신]
```

---

## 🛠️ 백엔드 구현 가이드

### 1단계: TelegramService에 EventEmitter 추가

**파일**: `likeme-like-me-api/src/modules/telegram/telegram.service.ts`

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { TelegramMessage, SavedMessage, TelegramChat } from './interfaces';
import { EventEmitter } from 'events';  // ✅ 추가

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot!: Telegraf;

  // ✅ SSE를 위한 EventEmitter 추가
  public readonly messageEvents = new EventEmitter();

  private receivedMessages: SavedMessage[] = [];
  private messageIdCounter = 1;

  constructor(private readonly config: ConfigService) {}

  // ... (기존 코드)

  // ✅ 수정: saveReceivedMessage에서 이벤트 발행
  private saveReceivedMessage(message: TelegramMessage): void {
    const savedMessage: SavedMessage = {
      id: this.messageIdCounter++,
      ...message,
      isRead: false,
      aiRecommendations: [],
      replied: false,
    };

    this.receivedMessages.unshift(savedMessage);
    this.logger.log(`Message saved: ${JSON.stringify(savedMessage)}`);

    // ✅ 새 메시지 이벤트 발행 - SSE로 프론트엔드에 전달됨
    this.messageEvents.emit('newMessage', savedMessage);
  }
}
```

---

### 2단계: TelegramController에 SSE 엔드포인트 추가

**파일**: `likeme-like-me-api/src/modules/telegram/telegram.controller.ts`

```typescript
import { Body, Controller, Post, Get, Sse } from '@nestjs/common';  // ✅ Sse 추가
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { Observable, fromEvent } from 'rxjs';  // ✅ 추가
import { map } from 'rxjs/operators';  // ✅ 추가
import {
  SendMessageDto,
  GenerateRecommendationsDto,
  SendReplyDto,
} from './dto';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly tg: TelegramService) {}

  // ✅ 새로운 엔드포인트: SSE를 통한 실시간 메시지 스트림
  @Sse('events')
  @ApiOperation({ summary: '실시간 메시지 이벤트 스트림 (SSE)' })
  @ApiResponse({ status: 200, description: '실시간 메시지 이벤트' })
  streamMessages(): Observable<MessageEvent> {
    return fromEvent(this.tg.messageEvents, 'newMessage').pipe(
      map((message) => ({
        data: JSON.stringify(message),
        type: 'newMessage',
      })) as any,
    );
  }

  // ... (기존 코드들)
}
```

---

### 3단계: main.ts에 CORS 설정 확인

**파일**: `likeme-like-me-api/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORS 설정 - SSE 연결에 필수
  app.enableCors({
    origin: 'http://localhost:5173',  // 프론트엔드 주소
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('LikeMe API')
    .setDescription('AI 답변 추천 서비스 API')
    .setVersion('1.0')
    .addTag('telegram', '텔레그램 봇 관련 API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);

  console.log(`🚀 Server running on http://localhost:${process.env.PORT || 3000}`);
  console.log(`📚 Swagger docs available at http://localhost:${process.env.PORT || 3000}/api`);
}
void bootstrap();
```

---

### 4단계: package.json에 필요한 패키지 확인

**파일**: `likeme-like-me-api/package.json`

RxJS가 이미 설치되어 있는지 확인:
```bash
npm list rxjs
```

없다면 설치:
```bash
npm install rxjs
```

---

## 🎨 프론트엔드 구현 가이드

### ✅ 이미 구현됨!
프론트엔드 코드는 이미 올바르게 구현되어 있습니다.

**파일**: `src/pages/chat/ChatPage.jsx:178-224`

```javascript
// 실시간 메시지 수신을 위한 SSE(Server-Sent Events) 연결 관리
useEffect(() => {
  let isMounted = true;
  const eventSource = new EventSource('http://localhost:3000/telegram/events');

  // 새로 수신된 메시지를 처리하는 헬퍼 함수
  const handleNewMessage = (messageData) => {
    try {
      const newMessage = JSON.parse(messageData);
      // 중복 메시지 방지: 이미 존재하는 메시지는 추가하지 않음
      setServerMessages(prevMessages => {
        const exists = prevMessages.find(msg => msg.id === newMessage.id);
        if (exists) return prevMessages;
        return [...prevMessages, newMessage];
      });
    } catch (error) {
      console.error('메시지 파싱 오류:', error);
    }
  };

  eventSource.onopen = () => {
    if (!isMounted) return;
    retryCount.current = 0;
  };

  eventSource.onmessage = (event) => {
    if (!isMounted) return;
    handleNewMessage(event.data);
  };

  eventSource.addEventListener('newMessage', (event) => {
    if (!isMounted) return;
    handleNewMessage(event.data);
  });

  eventSource.onerror = (error) => {
    console.error('SSE 연결 오류:', error);
    handleSSEError();
  };

  return () => {
    isMounted = false;
    if (eventSource.readyState !== EventSource.CLOSED) {
      eventSource.close();
    }
  };
}, [handleSSEError]);
```

**핵심 포인트**:
- ✅ **폴링 없음**: `setInterval`이나 주기적인 API 호출 없음
- ✅ **이벤트 기반**: SSE로 새 메시지 이벤트가 발생했을 때만 자동 업데이트
- ✅ **중복 방지**: 같은 메시지 ID는 추가하지 않음
- ✅ **클린업**: 컴포넌트 언마운트 시 연결 종료

---

## 🚀 적용 절차

### 1. 백엔드 수정
```bash
cd ../likeme-like-me-api
```

1. `src/modules/telegram/telegram.service.ts` 수정
   - EventEmitter 추가
   - saveReceivedMessage에서 이벤트 발행

2. `src/modules/telegram/telegram.controller.ts` 수정
   - SSE 엔드포인트 추가

3. `src/main.ts` 수정
   - CORS 설정 추가

### 2. 백엔드 재시작
```bash
npm run start:dev
```

### 3. 프론트엔드 테스트
```bash
cd ../LikemeLikeMe
npm run dev
```

### 4. 동작 확인
1. 프론트엔드 콘솔에서 SSE 연결 성공 확인
2. 텔레그램 봇으로 메시지 전송
3. **폴링 없이** 프론트엔드에 즉시 메시지 표시 확인

---

## ⚠️ 중요 주의사항

### ❌ 절대 하지 말아야 할 것

```javascript
// ❌ 절대 금지: 주기적인 폴링
setInterval(() => {
  fetchMessages();
}, 5000);  // 5초마다 API 호출 - 절대 사용하지 말 것!

// ❌ 절대 금지: 수동 갱신
useEffect(() => {
  const timer = setInterval(checkNewMessages, 10000);
  return () => clearInterval(timer);
}, []);
```

### ✅ 올바른 방식

```javascript
// ✅ 권장: 이벤트 기반 SSE 연결
useEffect(() => {
  const eventSource = new EventSource('/telegram/events');

  eventSource.onmessage = (event) => {
    // 새 메시지 이벤트가 발생했을 때만 실행됨
    const newMessage = JSON.parse(event.data);
    setMessages(prev => [...prev, newMessage]);
  };

  return () => eventSource.close();
}, []);
```

---

## 🔧 디버깅 가이드

### 1. SSE 연결 확인
브라우저 개발자도구 > Network 탭:
- `telegram/events` 요청 찾기
- Status: `200`
- Type: `eventsource`
- 연결이 유지되는지 확인

### 2. 이벤트 수신 확인
브라우저 콘솔:
```javascript
const es = new EventSource('http://localhost:3000/telegram/events');
es.onmessage = (e) => console.log('받은 이벤트:', e.data);
```

### 3. 백엔드 로그 확인
```bash
# 텔레그램 봇으로 메시지 전송 시 다음 로그가 출력되어야 함:
[TelegramService] Message received - from=12345 chat=12345 text="테스트"
[TelegramService] Message saved: {"id":1,...}
```

---

## 📊 성능 비교

### 폴링 방식 (❌ 금지)
- 10초마다 API 호출 → 1시간에 360번 요청
- 새 메시지 없어도 계속 요청
- 서버 리소스 낭비
- 최대 10초 지연

### SSE 방식 (✅ 권장)
- 연결 1번 → 이벤트만 수신
- 새 메시지 있을 때만 데이터 전송
- 서버 리소스 효율적
- 즉시 반영 (지연 없음)

---

## 🎯 핵심 원칙

1. **폴링 절대 금지**: `setInterval`, `setTimeout` 같은 주기적인 API 호출 금지
2. **이벤트 기반**: 서버에서 새 메시지 이벤트 발생 시에만 프론트엔드에 알림
3. **SSE 사용**: WebSocket보다 가볍고 구현이 간단한 SSE 활용
4. **단방향 통신**: 서버 → 클라이언트 푸시만 필요하므로 SSE가 최적

---

## 📚 추가 참고자료

- [NestJS SSE 공식 문서](https://docs.nestjs.com/techniques/server-sent-events)
- [MDN EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [Server-Sent Events 표준](https://html.spec.whatwg.org/multipage/server-sent-events.html)

---

## 🔄 문제 해결 체크리스트

- [ ] 백엔드에 `/telegram/events` 엔드포인트 구현됨
- [ ] TelegramService에 EventEmitter 추가됨
- [ ] saveReceivedMessage에서 이벤트 발행됨
- [ ] CORS 설정에 프론트엔드 주소 추가됨
- [ ] 백엔드 서버 재시작함
- [ ] 프론트엔드에서 SSE 연결 성공 확인
- [ ] 텔레그램 봇 메시지 전송 시 즉시 반영되는지 테스트
- [ ] 폴링 코드가 없는지 재확인

---

**작성일**: 2025-11-04
**최종 수정**: 2025-11-04
**버전**: 1.0

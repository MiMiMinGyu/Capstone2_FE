# 백엔드 개발 요청사항

> 최종 업데이트: 2025-11-23

## 📋 현재 요청사항

### 1. JWT 파싱 문제 - 잘못된 사용자 인식 🔴

**문제 상황:**

프론트엔드에서 `test@mju.ac.kr`로 로그인했지만, 백엔드 로그에서 다른 사용자(`mingyu@example.com`, userId: `75f7f032-...`)로 인식되고 있습니다.

**프론트엔드 확인 완료 ✅**

1. **localStorage 확인:**
   - 올바른 사용자 정보 저장됨
   - email: `test@mju.ac.kr`
   - userId: `5ffc7298-98c5-44d0-a62e-7a2ac180a64d`

2. **JWT Access Token 디코딩 확인:**
   - https://jwt.io 에서 디코딩 결과 `test@mju.ac.kr` 정보 포함
   - 토큰 자체는 올바름 ✅

3. **프론트엔드 코드 확인:**
   - axios 요청 시 `Authorization: Bearer {access_token}` 헤더 정상 전송 ✅
   - 토큰 갱신 로직 정상 작동 ✅

**백엔드 확인 요청 사항:**

#### 1. JWT 파싱 로직 확인

```typescript
// JwtAuthGuard 또는 JwtStrategy에서
// 토큰을 어떻게 파싱하고 있는지 확인

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: any) {
    // 여기서 payload를 출력해서 어떤 userId가 들어오는지 확인
    console.log('JWT Payload:', payload);

    // userId를 어떻게 추출하는지 확인
    return { userId: payload.sub, email: payload.email };
  }
}
```

#### 2. 요청 헤더 로그 확인

```typescript
// 컨트롤러나 미들웨어에서
@Post('/telegram/recommendations')
async generateRecommendations(
  @Headers('authorization') authHeader: string,
  @Body() dto: GenerateRecommendationsDto,
  @Request() req
) {
  console.log('Authorization Header:', authHeader);
  console.log('Decoded User:', req.user);
  console.log('Request UserId:', req.user?.userId);

  // 실제 사용되는 userId 확인
}
```

#### 3. 캐싱 문제 확인

- 혹시 userId를 메모리나 Redis에 캐싱하고 있나요?
- 캐시 키가 잘못 설정되어 다른 사용자의 데이터를 반환하는 건 아닌가요?

#### 4. 재현 방법

1. 프론트엔드에서 `test@mju.ac.kr`로 로그인
2. 아무 API 호출 (예: `/telegram/conversations`)
3. 백엔드 로그에서 userId 확인
4. **예상:** `5ffc7298-98c5-44d0-a62e-7a2ac180a64d` (test@mju.ac.kr)
5. **실제:** `75f7f032-...` (mingyu@example.com) ← 잘못됨

**백엔드에서 다음 정보를 로그로 출력해주세요:**
1. `Authorization` 헤더 전체 내용
2. JWT 디코딩 후 payload 전체
3. `req.user` 또는 `@CurrentUser()` 데코레이터로 가져온 사용자 정보

**우선순위:** 🔴 높음 (추천 답변 기능이 잘못된 사용자 데이터로 작동 중)

---

### 2. messageId 타입 불일치 문제 ⚠️

**문제 상황:**

`POST /telegram/recommendations` API 요청 시 400 에러 발생:
```
"messageId must be a number conforming to the length: 1"
```

**현재 상황:**

프론트엔드가 `GET /telegram/conversations/:partnerId/messages`에서 받은 메시지 객체:
```json
{
  "id": "d70e7086-5367-4656-88fb-e670f1a43479",  // ⚠️ UUID 문자열
  "role": "user",
  "text": "dkssud",
  "created_at": "2025-11-11T04:49:06.299Z"
}
```

백엔드 DTO 요구사항:
```typescript
{
  "messageId": 123  // ✅ number 타입 요구
}
```

**질문:**

1. `/telegram/recommendations`에서 기대하는 `messageId`는 무엇인가요?
   - 옵션 A: **텔레그램 메시지 ID** (number) - 예: `123456789`
   - 옵션 B: **데이터베이스 UUID** (string) - 예: `"d70e7086-..."`
   - 옵션 C: **다른 숫자형 ID 필드**가 메시지 객체에 있어야 함

2. 만약 텔레그램 메시지 ID를 사용해야 한다면, `/telegram/conversations/:partnerId/messages` 응답에 해당 필드를 추가해주실 수 있나요?
   ```json
   {
     "id": "d70e7086-5367-4656-88fb-e670f1a43479",
     "telegram_message_id": 123456789,  // ✅ 추가 필요
     "role": "user",
     "text": "dkssud",
     "created_at": "2025-11-11T04:49:06.299Z"
   }
   ```

**우선순위:** 높음 🔴 (추천 답변 기능 차단 중)

---

## 📝 과거 요청사항

(현재 없음)

---

## ✅ 완료된 요청사항

### 1. Default 답변 추가 (완료일: 2025-11-23) ✅

**요청 내용**:
`POST /telegram/recommendations` API에서 AI가 생성한 추천 답변 외에, **항상 기본 답변을 하나 추가**로 포함해주세요.

**구현 결과**:

```json
{
  "recommendations": [
    {
      "messageId": "abc123",
      "text": "긍정적인 답변 (동의/수락)",
      "tone": "positive"
    },
    {
      "messageId": "abc123",
      "text": "부정적인 답변 (거절/불가)",
      "tone": "negative"
    },
    {
      "messageId": "abc123",
      "text": "지금은 답장하기 힘드니, 최대한 빠르게 확인하겠습니다!",
      "isDefault": true
    }
  ]
}
```

**개선 사항**:

- 총 3개 답변 반환 (긍정, 부정, Default)
- `tone` 필드 추가로 답변 성격 구분
- GPT API 1회 호출로 긍정/부정 답변 동시 생성 (비용 절감)

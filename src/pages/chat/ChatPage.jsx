import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ChatContainer from '../../features/chat/components/ChatContainer';
import { telegramAPI } from '../../api/endpoints/chat.js';
import '../../styles/telegram-theme.css';
import styles from './ChatPage.module.css';

const ChatPage = () => {
  // 메시지 상태 관리
  const [serverMessages, setServerMessages] = useState([]);
  const [localMessages, setLocalMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('localMessages');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('로컬 메시지 복원 실패:', error);
      return [];
    }
  });

  // UI 상태 관리
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [botStatus, setBotStatus] = useState('online');

  // 재시도 관리
  const retryCount = useRef(0);
  const maxRetries = 3;

  // 메시지 병합 및 시간순 정렬 (서버 메시지와 로컬 메시지 통합)
  const messages = useMemo(() => {
    const allMessages = [...serverMessages, ...localMessages];
    return allMessages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
  }, [serverMessages, localMessages]);

  // 서버에서 메시지 목록을 가져오는 함수 (재시도 로직 포함)
  const fetchMessages = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) setError(null);

      const data = await telegramAPI.getMessages(isRetry);
      const newMessages = Array.isArray(data) ? data : [];

      // 메시지가 변경된 경우에만 상태 업데이트 (불필요한 리렌더링 방지)
      setServerMessages(prevMessages => {
        if (JSON.stringify(prevMessages) !== JSON.stringify(newMessages)) {
          return newMessages;
        }
        return prevMessages;
      });

      retryCount.current = 0;
      if (error) setError(null);
    } catch (err) {
      console.error('메시지 로딩 오류:', err);
      const errorMessage = err.userMessage || err.message || '메시지를 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);

      if (err.code === 'ERR_NETWORK') {
        retryCount.current++;
        if (retryCount.current >= maxRetries) {
          console.error('최대 재시도 횟수 초과:', retryCount.current);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [error]);

  // 봇 상태 확인
  const checkBotStatus = useCallback(async () => {
    try {
      const status = await telegramAPI.getBotStatus();
      setBotStatus(status?.status === 'Telegram bot is running' ? 'online' : 'offline');
    } catch (err) {
      console.error('봇 상태 확인 오류:', err);
      setBotStatus('offline');
    }
  }, []);

  // 특정 메시지에 대한 AI 추천 답변 생성
  const handleGenerateRecommendations = useCallback(async (messageId) => {
    try {
      const result = await telegramAPI.generateRecommendations(messageId);

      // 해당 메시지에 AI 추천 결과 추가
      setServerMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId
            ? { ...msg, aiRecommendations: result.recommendations || [] }
            : msg
        )
      );

      return result;
    } catch (err) {
      console.error('AI 추천 생성 오류:', err);
      const errorMessage = err.userMessage || 'AI 추천 생성에 실패했습니다.';
      throw new Error(errorMessage);
    }
  }, []);

  // 선택한 답변을 텔레그램으로 전송하는 함수
  const handleSendReply = useCallback(async (messageId, selectedReply) => {
    try {
      // 원본 메시지를 답장 완료 상태로 업데이트
      setServerMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId
            ? { ...msg, replied: true, selectedReply, isRead: true }
            : msg
        )
      );

      // 내가 보낸 답장을 로컬 메시지 목록에 추가
      const originalMessage = serverMessages.find(msg => msg.id === messageId);
      const replyMessage = {
        id: `reply_${messageId}_${Date.now()}`,
        messageId: Date.now(),
        from: {
          id: 'user',
          first_name: '나',
          username: 'me'
        },
        chat: originalMessage?.chat || { id: 'unknown', type: 'private' },
        text: selectedReply,
        timestamp: new Date().toISOString(),
        isRead: true,
        replied: false,
        aiRecommendations: [],
        isOutgoing: true
      };

      setLocalMessages(prevMessages => [...prevMessages, replyMessage]);

      // 백엔드 API 호출
      await telegramAPI.sendReply(messageId, selectedReply);
      return { success: true };
    } catch (err) {
      console.error('답장 전송 실패:', err);
      const errorMessage = err.userMessage || '답변 전송에 실패했습니다.';
      throw new Error(errorMessage);
    }
  }, [serverMessages]);

  // 로컬 메시지 localStorage 저장
  useEffect(() => {
    try {
      localStorage.setItem('localMessages', JSON.stringify(localMessages));
    } catch (error) {
      console.error('로컬 메시지 저장 실패:', error);
    }
  }, [localMessages]);

  // 수동 새로고침
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    retryCount.current = 0;
    await fetchMessages();
    await checkBotStatus();
  }, [fetchMessages, checkBotStatus]);


  // SSE 오류 처리
  const handleSSEError = useCallback(() => {
    checkBotStatus();
  }, [checkBotStatus]);

  // 초기 로드
  useEffect(() => {
    fetchMessages();
    checkBotStatus();
  }, [fetchMessages, checkBotStatus]);

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

  return (
    <div className={styles.chatPage}>
      <ChatContainer
        messages={messages}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        onGenerateRecommendations={handleGenerateRecommendations}
        onSendReply={handleSendReply}
        botStatus={botStatus}
      />
    </div>
  );
};

export default ChatPage;

import { useState } from 'react';
import { telegramAPI } from '../../api/endpoints/chat';
import styles from './TelegramAPITest.module.css';

const TelegramAPITest = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [botStatus, setBotStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. 대화 목록 가져오기 테스트 (추천)
  const handleGetConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await telegramAPI.getConversations();
      setConversations(data);
      console.log('✅ 대화 목록 가져오기 성공:', data);
    } catch (err) {
      setError(err.userMessage || err.message);
      console.error('❌ 대화 목록 가져오기 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. 메시지 가져오기 테스트
  const handleGetMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await telegramAPI.getMessages();
      setMessages(data);
      console.log('✅ 메시지 가져오기 성공:', data);
    } catch (err) {
      setError(err.userMessage || err.message);
      console.error('❌ 메시지 가져오기 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. AI 추천 답변 생성 테스트
  const handleGetRecommendations = async (messageId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await telegramAPI.generateRecommendations(messageId);
      setRecommendations(data);
      console.log('✅ AI 추천 생성 성공:', data);
    } catch (err) {
      setError(err.userMessage || err.message);
      console.error('❌ AI 추천 생성 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 4. 답변 전송 테스트
  const handleSendReply = async (messageId, reply) => {
    setLoading(true);
    setError(null);
    try {
      const data = await telegramAPI.sendReply(messageId, reply);
      console.log('✅ 답변 전송 성공:', data);
      alert('답변이 전송되었습니다!');
    } catch (err) {
      setError(err.userMessage || err.message);
      console.error('❌ 답변 전송 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 5. 봇 상태 확인 테스트
  const handleGetBotStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await telegramAPI.getBotStatus();
      setBotStatus(data);
      console.log('✅ 봇 상태 조회 성공:', data);
    } catch (err) {
      setError(err.userMessage || err.message);
      console.error('❌ 봇 상태 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Telegram API 테스트</h1>

      {/* 에러 메시지 */}
      {error && (
        <div className={styles.error}>
          ❌ {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && <div className={styles.loading}>로딩 중...</div>}

      {/* 테스트 버튼들 */}
      <div className={styles.buttonGroup}>
        <button onClick={handleGetConversations} disabled={loading}>
          💬 대화 목록 가져오기 (추천)
        </button>
        <button onClick={handleGetMessages} disabled={loading}>
          📨 원시 메시지 가져오기
        </button>
        <button onClick={handleGetBotStatus} disabled={loading}>
          🤖 봇 상태 확인
        </button>
      </div>

      {/* 봇 상태 표시 */}
      {botStatus && (
        <div className={styles.section}>
          <h2>🤖 봇 상태</h2>
          <pre>{JSON.stringify(botStatus, null, 2)}</pre>
        </div>
      )}

      {/* 대화 목록 */}
      {conversations.length > 0 && (
        <div className={styles.section}>
          <h2>💬 대화 목록 ({conversations.length}개)</h2>
          <div className={styles.messageList}>
            {conversations.map((conv, index) => (
              <div key={index} className={styles.messageCard}>
                <div className={styles.messageHeader}>
                  <strong>{conv.partner_name}</strong>
                  <span className={styles.messageId}>ID: {conv.partner_id}</span>
                </div>
                <p className={styles.messageText}>
                  마지막 메시지: {conv.last_message}
                </p>
                <p style={{ fontSize: '12px', color: '#999' }}>
                  {new Date(conv.last_message_time).toLocaleString('ko-KR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메시지 목록 */}
      {messages.length > 0 && (
        <div className={styles.section}>
          <h2>📨 메시지 목록 ({messages.length}개)</h2>
          <div className={styles.messageList}>
            {messages.map((msg, index) => (
              <div key={index} className={styles.messageCard}>
                <div className={styles.messageHeader}>
                  <strong>
                    {msg.from?.first_name} {msg.from?.last_name}
                  </strong>
                  <span className={styles.messageId}>ID: {msg.message_id}</span>
                </div>
                <p className={styles.messageText}>{msg.text}</p>
                <div className={styles.messageActions}>
                  <button
                    onClick={() => handleGetRecommendations(msg.message_id)}
                    disabled={loading}
                    className={styles.smallButton}
                  >
                    💡 AI 추천 받기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 추천 답변 */}
      {recommendations.length > 0 && (
        <div className={styles.section}>
          <h2>💡 AI 추천 답변</h2>
          <div className={styles.recommendationList}>
            {recommendations.map((rec, index) => (
              <div key={index} className={styles.recommendationCard}>
                <p>{rec.text}</p>
                <button
                  onClick={() => handleSendReply(rec.messageId, rec.text)}
                  disabled={loading}
                  className={styles.sendButton}
                >
                  ✉️ 전송하기
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramAPITest;

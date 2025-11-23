import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { telegramAPI } from '../../api/endpoints/chat';
import Header from '../../components/layout/Header';
import styles from './MainPage.module.css';

const MainPage = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();

    // SSE로 실시간 메시지 수신
    const eventSource = new EventSource('http://localhost:3000/telegram/events');

    eventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      console.log('새 메시지 도착:', newMessage);
      fetchConversations(); // 새 메시지 도착 시 목록 갱신
    };

    eventSource.onerror = (error) => {
      console.error('SSE 연결 오류:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await telegramAPI.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('대화 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (partnerId) => {
    navigate(`/chat/${partnerId}`);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 2 * oneDay) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={styles.container}>
      <Header />

      {/* 대화 목록 */}
      <div className={styles.mainContent}>
        <div className={styles.conversationList}>
          <div className={styles.conversationListHeader}>
            <h2 className={styles.conversationListTitle}>메시지</h2>
          </div>

          <div className={styles.conversationItems}>
            {loading && conversations.length === 0 ? (
              <div className={styles.loading}>로딩 중...</div>
            ) : conversations.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyText}>메시지가 없습니다</p>
                <p className={styles.emptySubtext}>
                  텔레그램 봇으로 메시지를 보내보세요!
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.partner_id}
                  className={styles.conversationItem}
                  onClick={() => handleConversationClick(conv.partner_id)}
                >
                  <div className={styles.avatar}>
                    <span className={styles.avatarText}>
                      {conv.partner_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>

                  <div className={styles.conversationContent}>
                    <div className={styles.conversationHeader}>
                      <span className={styles.name}>{conv.partner_name}</span>
                      <span className={styles.time}>
                        {formatTime(conv.last_message_time)}
                      </span>
                    </div>

                    <div className={styles.conversationFooter}>
                      <span className={styles.lastMessage}>
                        {conv.last_message || '메시지가 없습니다'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;

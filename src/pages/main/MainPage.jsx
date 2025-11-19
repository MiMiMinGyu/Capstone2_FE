import { useState, useEffect } from 'react';
import api from '../../api/clients/http';
import Header from '../../components/layout/Header';
import styles from './MainPage.module.css';

const MainPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();

    // SSE로 실시간 메시지 수신
    const eventSource = new EventSource('http://localhost:3000/telegram/events');

    eventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      console.log('새 메시지 도착:', newMessage);
      fetchConversations();
    };

    eventSource.onerror = (error) => {
      console.error('SSE 연결 오류:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/telegram/messages');
      const groupedMessages = groupMessagesByUser(response.data);
      setConversations(groupedMessages);
    } catch (err) {
      console.error('대화 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupMessagesByUser = (messages) => {
    const grouped = {};

    messages.forEach((message) => {
      const userId = message.from?.id;
      if (!userId) return;

      if (!grouped[userId]) {
        grouped[userId] = {
          user: message.from,
          messages: [],
          unreadCount: 0,
          lastMessage: null,
        };
      }

      grouped[userId].messages.push(message);

      if (!message.isRead) {
        grouped[userId].unreadCount++;
      }

      if (!grouped[userId].lastMessage ||
          new Date(message.timestamp) > new Date(grouped[userId].lastMessage.timestamp)) {
        grouped[userId].lastMessage = message;
      }
    });

    return Object.values(grouped).sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp) : new Date(0);
      const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp) : new Date(0);
      return timeB - timeA;
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('ko-KR', { weekday: 'short' });
    }

    return date.toLocaleDateString('ko-KR', {
      month: 'numeric',
      day: 'numeric'
    });
  };

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className={styles.container}>
      <Header />

      {/* 메인 영역 (채팅 목록 + 채팅창) */}
      <div className={styles.mainContent}>
        {/* 왼쪽: 채팅 목록 (30-35%) */}
        <aside className={styles.conversationList}>
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
              conversations.map((conversation) => (
                <div
                  key={conversation.user.id}
                  className={`${styles.conversationItem} ${
                    selectedConversation?.user.id === conversation.user.id
                      ? styles.conversationItemActive
                      : ''
                  }`}
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className={styles.avatar}>
                    <span className={styles.avatarText}>
                      {conversation.user.first_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>

                  <div className={styles.conversationContent}>
                    <div className={styles.conversationHeader}>
                      <span className={styles.name}>
                        {conversation.user.first_name || conversation.user.username || '알 수 없음'}
                      </span>
                      {conversation.lastMessage && (
                        <span className={styles.time}>
                          {formatTime(conversation.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>

                    <div className={styles.conversationFooter}>
                      <span className={styles.lastMessage}>
                        {conversation.lastMessage?.text || '메시지가 없습니다'}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className={styles.unreadBadge}>
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* 오른쪽: 채팅창 (65-70%) */}
        <main className={styles.chatArea}>
          {selectedConversation ? (
            <div className={styles.chatContainer}>
              <div className={styles.chatHeader}>
                <h2 className={styles.chatTitle}>
                  {selectedConversation.user.first_name || selectedConversation.user.username}
                </h2>
              </div>

              <div className={styles.chatMessages}>
                <div className={styles.chatPlaceholder}>
                  <p>채팅 기능은 곧 구현될 예정입니다</p>
                  <p className={styles.chatPlaceholderSub}>
                    선택된 대화: {selectedConversation.user.first_name}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.chatPlaceholder}>
              <p className={styles.chatPlaceholderText}>
                대화를 선택하세요
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MainPage;

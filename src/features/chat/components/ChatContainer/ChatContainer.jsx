import { useState } from 'react';
import MessageList from '../MessageList';
import RecommendationPanel from '../RecommendationPanel';
import styles from './ChatContainer.module.css';

// 채팅 인터페이스의 메인 컴포넌트 (메시지 목록과 AI 추천 패널 통합)
const ChatContainer = ({
  messages = [],
  loading = false,
  error = null,
  onRefresh,
  onGenerateRecommendations,
  onSendReply,
  botStatus = 'online'
}) => {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [showMobileRecommendation, setShowMobileRecommendation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // AI 추천 답변 생성 핸들러 (메시지 선택 및 추천 요청)
  const handleGenerateRecommendations = async (messageId) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    setSelectedMessage(message);
    setRecommendationLoading(true);
    setShowMobileRecommendation(true);

    try {
      const result = await onGenerateRecommendations(messageId);
      setRecommendations(result?.recommendations || []);
    } catch (error) {
      console.error('AI 추천 생성 실패:', error);
      setRecommendations([]);
    } finally {
      setRecommendationLoading(false);
    }
  };

  // 선택된 답변 전송 핸들러
  const handleSendReply = async (messageId, selectedReply) => {
    try {
      await onSendReply(messageId, selectedReply);

      // 전송 후 선택 상태 및 추천 내용 초기화
      setSelectedMessage(null);
      setRecommendations([]);
      setShowMobileRecommendation(false);
    } catch (error) {
      console.error('답변 전송 실패:', error);
      throw error;
    }
  };

  // 수동 새로고침 핸들러 (로딩 상태 처리 포함)
  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;

    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('메시지 새로고침 실패:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 모바일 추천 패널 닫기
  const closeMobileRecommendation = () => {
    setShowMobileRecommendation(false);
    setSelectedMessage(null);
    setRecommendations([]);
  };


  return (
    <div className={styles.chatContainer}>
      <header className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={() => window.history.back()}>
            ←
          </button>
          <div>
            <h1 className={styles.headerTitle}>텔레그램 채팅</h1>
            <p className={styles.headerSubtitle}>
              {messages.length}개의 메시지
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.statusIndicator}>
            <div className={`${styles.statusDot} ${botStatus === 'offline' ? styles.offline : ''}`} />
            <span>{botStatus === 'online' ? '온라인' : '오프라인'}</span>
          </div>

          <button
            className={`${styles.refreshButton} ${refreshing ? styles.spinning : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            title="수동 새로고침 (SSE 연결 실패 시 사용)"
          >
            {refreshing ? '⏳' : '🔄'}
          </button>
        </div>
      </header>

      <div className={styles.chatBody}>
        <div className={styles.messagesSection}>
          <MessageList
            messages={messages}
            loading={loading}
            error={error}
            onRetry={onRefresh}
            onGenerateRecommendations={handleGenerateRecommendations}
            autoScroll={true}
          />
        </div>

        <div className={styles.recommendationSection}>
          <RecommendationPanel
            selectedMessage={selectedMessage}
            recommendations={recommendations}
            loading={recommendationLoading}
            onGenerateRecommendations={handleGenerateRecommendations}
            onSendReply={handleSendReply}
            disabled={loading}
          />
        </div>
      </div>

      {showMobileRecommendation && window.innerWidth <= 480 && (
        <div className={styles.mobileRecommendationOverlay}>
          <div className={styles.mobileRecommendationHeader}>
            <button
              className={styles.closeButton}
              onClick={closeMobileRecommendation}
            >
              ←
            </button>
            <h2 className={styles.headerTitle}>AI 추천 답변</h2>
          </div>

          <RecommendationPanel
            selectedMessage={selectedMessage}
            recommendations={recommendations}
            loading={recommendationLoading}
            onGenerateRecommendations={handleGenerateRecommendations}
            onSendReply={handleSendReply}
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;

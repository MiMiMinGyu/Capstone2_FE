import { useMemo } from 'react';
import styles from './MessageBubble.module.css';

// 개별 메시지를 표시하는 버블 컴포넌트
const MessageBubble = ({
  message,
  isOutgoing = false,
  showAvatar = true,
  onGenerateRecommendations
}) => {
  const {
    id,
    text,
    from,
    timestamp,
    isRead,
    replied,
    aiRecommendations = []
  } = message;

  // 시간 포맷 최적화 (한국 시간 형식으로 표시)
  const formattedTime = useMemo(() => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }, [timestamp]);

  // 사용자 이름 첫 글자로 아바타 생성
  const senderInitial = useMemo(() => {
    if (!from?.first_name) return '?';
    return from.first_name.charAt(0).toUpperCase();
  }, [from]);

  // AI 추천 답변 생성 버튼 클릭 핸들러
  const handleGenerateRecommendations = () => {
    if (onGenerateRecommendations && !replied) {
      onGenerateRecommendations(id);
    }
  };

  return (
    <div className={`${styles.messageBubble} ${!isRead ? styles.unread : ''} ${replied ? styles.replied : ''}`}>
      <div className={`${styles.messageContainer} ${isOutgoing ? styles.outgoing : styles.incoming}`}>
        {!isOutgoing && showAvatar && (
          <div className={styles.avatar}>
            {senderInitial}
          </div>
        )}

        <div className={styles.bubble + ' ' + (isOutgoing ? styles.outgoing : styles.incoming)}>
          {!isOutgoing && from?.first_name && (
            <div className={styles.senderName}>
              {from.first_name}
            </div>
          )}

          <p className={styles.messageText}>
            {text || '메시지 내용 없음'}
          </p>

          <div className={styles.messageInfo}>
            <span className={`${styles.timestamp} ${isOutgoing ? styles.outgoing : styles.incoming}`}>
              {formattedTime}
            </span>

            <div className={styles.status}>
              {isOutgoing && (
                <span className={styles.statusIcon}>
                  {isRead ? '✓✓' : '✓'}
                </span>
              )}

              {replied && (
                <span className={styles.statusIcon}>
                  💬
                </span>
              )}
            </div>
          </div>

          {!isOutgoing && !replied && (
            <button
              className={styles.actionButton}
              onClick={handleGenerateRecommendations}
              disabled={aiRecommendations.length > 0}
            >
              {aiRecommendations.length > 0 ? 'AI 추천 생성됨' : 'AI 추천 받기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
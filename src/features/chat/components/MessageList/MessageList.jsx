import { useEffect, useRef, useState } from 'react';
import MessageBubble from '../MessageBubble';
import styles from './MessageList.module.css';

const MessageList = ({
  messages = [],
  loading = false,
  error = null,
  onRetry,
  onGenerateRecommendations,
  autoScroll = true
}) => {
  const listRef = useRef(null);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const previousMessagesLength = useRef(messages.length);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (!autoScroll || !listRef.current) return;

    const isNewMessage = messages.length > previousMessagesLength.current;
    previousMessagesLength.current = messages.length;

    if (isNewMessage) {
      const scrollToBottom = () => {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      };

      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, autoScroll]);

  // Check if user is at bottom to show new message indicator
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = listElement;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setShowNewMessageIndicator(!isAtBottom && messages.length > 0);
    };

    listElement.addEventListener('scroll', handleScroll);
    return () => listElement.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
      setShowNewMessageIndicator(false);
    }
  };

  // Loading state
  if (loading && messages.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        메시지를 불러오는 중...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3 className={styles.errorTitle}>메시지를 불러올 수 없습니다</h3>
        <p className={styles.errorDescription}>
          네트워크 연결을 확인하고 다시 시도해주세요.
        </p>
        {onRetry && (
          <button
            className={styles.retryButton}
            onClick={onRetry}
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>💬</div>
        <h3 className={styles.emptyTitle}>메시지가 없습니다</h3>
        <p className={styles.emptyDescription}>
          텔레그램으로 메시지를 보내면 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.messageList} ref={listRef}>
      {/* New message indicator */}
      {showNewMessageIndicator && (
        <div
          className={styles.newMessageIndicator}
          onClick={scrollToBottom}
        >
          ↓ 새 메시지가 있습니다
        </div>
      )}

      {/* Message list */}
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        const nextMessage = messages[index + 1];
        const isOutgoing = message.isOutgoing || false; // Check if message is outgoing
        const isConsecutive = nextMessage &&
          nextMessage.from?.id === message.from?.id &&
          nextMessage.isOutgoing === isOutgoing &&
          new Date(nextMessage.timestamp) - new Date(message.timestamp) < 60000; // 1분 이내

        return (
          <MessageBubble
            key={message.id || index}
            message={message}
            isOutgoing={isOutgoing}
            showAvatar={!isConsecutive || isLastMessage}
            onGenerateRecommendations={onGenerateRecommendations}
          />
        );
      })}

      {/* Loading indicator for new messages */}
      {loading && messages.length > 0 && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          새 메시지 확인 중...
        </div>
      )}
    </div>
  );
};

export default MessageList;
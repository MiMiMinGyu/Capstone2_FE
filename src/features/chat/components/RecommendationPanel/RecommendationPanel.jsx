import { useState } from 'react';
import styles from './RecommendationPanel.module.css';

// AI 추천 답변을 생성하고 전송하는 패널 컴포넌트
const RecommendationPanel = ({
  selectedMessage = null,
  recommendations = [],
  loading = false,
  onGenerateRecommendations,
  onSendReply,
  disabled = false
}) => {
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [sending, setSending] = useState(false);

  // AI 추천 답변 생성 함수
  const handleGenerateRecommendations = async () => {
    if (!selectedMessage || loading) return;

    try {
      await onGenerateRecommendations(selectedMessage.id);
    } catch (error) {
      console.error('AI 추천 생성 실패:', error);
    }
  };

  // 추천 답변 선택 함수
  const handleSelectRecommendation = (recommendation, index) => {
    setSelectedRecommendation({ text: recommendation, index });
  };

  // 선택된 답변 전송 함수
  const handleSendReply = async () => {
    if (!selectedRecommendation || !selectedMessage || sending) return;

    setSending(true);
    try {
      await onSendReply(selectedMessage.id, selectedRecommendation.text);
      setSelectedRecommendation(null);
    } catch (error) {
      console.error('답변 전송 실패:', error);
    } finally {
      setSending(false);
    }
  };

  // 선택된 메시지가 없는 경우
  if (!selectedMessage) {
    return (
      <div className={styles.recommendationPanel}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🤖</div>
          <p className={styles.emptyText}>
            메시지를 선택하면 AI 추천 답변을 생성할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.recommendationPanel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>AI 추천 답변</h3>
      </div>

      <div className={styles.selectedMessage}>
        <strong>{selectedMessage.from?.first_name || '알 수 없는 사용자'}:</strong>
        <br />
        {selectedMessage.text || '메시지 내용 없음'}
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          AI 추천 답변을 생성하는 중...
        </div>
      )}

      {/* No Recommendations Yet */}
      {!loading && recommendations.length === 0 && (
        <div className={styles.empty}>
          <button
            className={styles.generateButton}
            onClick={handleGenerateRecommendations}
            disabled={loading || disabled}
          >
            🤖 AI 추천 답변 생성하기
          </button>
        </div>
      )}

      {/* Recommendations List */}
      {!loading && recommendations.length > 0 && (
        <>
          <div className={styles.recommendationsList}>
            {recommendations.map((recommendation, index) => {
              const isSelected = selectedRecommendation?.index === index;

              return (
                <div
                  key={index}
                  className={`${styles.recommendationCard} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleSelectRecommendation(recommendation, index)}
                >
                  <p className={styles.recommendationText}>
                    {recommendation}
                  </p>

                  <div className={styles.recommendationActions}>
                    <span className={styles.cardIndex}>
                      옵션 {index + 1}
                    </span>
                    <button
                      className={styles.selectButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRecommendation(recommendation, index);
                      }}
                    >
                      {isSelected ? '선택됨' : '선택'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Send Button */}
          {selectedRecommendation && (
            <button
              className={styles.sendButton}
              onClick={handleSendReply}
              disabled={sending || disabled}
            >
              {sending ? (
                <>
                  <div className={styles.spinner} />
                  전송 중...
                </>
              ) : (
                <>
                  📤 답변 전송하기
                </>
              )}
            </button>
          )}

          {/* Regenerate Button */}
          <button
            className={styles.generateButton}
            onClick={handleGenerateRecommendations}
            disabled={loading || disabled}
            style={{ marginTop: 'var(--tg-spacing-sm)' }}
          >
            🔄 다시 생성하기
          </button>
        </>
      )}
    </div>
  );
};

export default RecommendationPanel;
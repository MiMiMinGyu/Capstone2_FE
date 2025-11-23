import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { telegramAPI } from '../../api/endpoints/chat';
import { relationshipAPI, RELATIONSHIP_LABELS, POLITENESS_LABELS, VIBE_LABELS } from '../../api/endpoints/relationship';
import Header from '../../components/layout/Header';
import styles from './ChatPage.module.css';

const ChatPage = () => {
  const { userId: partnerId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [showConversationList, setShowConversationList] = useState(false);
  const [relationship, setRelationship] = useState(null);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [relationshipForm, setRelationshipForm] = useState({
    category: '',
    politeness: '',
    vibe: '',
    emojiLevel: 0
  });

  // 대화 목록 가져오기
  const fetchConversations = useCallback(async () => {
    try {
      const data = await telegramAPI.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('대화 목록 조회 실패:', err);
    }
  }, []);

  // 관계 정보 가져오기
  const fetchRelationship = useCallback(async () => {
    if (!partnerId) return;

    try {
      const relationships = await relationshipAPI.getRelationships();
      const currentRelationship = relationships.find(
        (rel) => rel.partner_id === partnerId
      );

      if (currentRelationship) {
        setRelationship(currentRelationship);
        setRelationshipForm({
          category: currentRelationship.category,
          politeness: currentRelationship.politeness,
          vibe: currentRelationship.vibe,
          emojiLevel: currentRelationship.emoji_level
        });
      } else {
        setRelationship(null);
      }
    } catch (err) {
      console.error('관계 정보 조회 실패:', err);
    }
  }, [partnerId]);

  // 관계 저장/수정
  const handleSaveRelationship = async () => {
    // 필수 필드 검증
    if (!relationshipForm.category) {
      alert('관계 카테고리를 선택해주세요');
      return;
    }

    try {
      // 빈 값을 제거하고 API에 전달 (선택 필드만)
      const requestData = {
        partnerId: partnerId,
        category: relationshipForm.category,
        ...(relationshipForm.politeness && { politeness: relationshipForm.politeness }),
        ...(relationshipForm.vibe && { vibe: relationshipForm.vibe }),
        emojiLevel: relationshipForm.emojiLevel
      };

      if (relationship) {
        // 수정
        await relationshipAPI.updateRelationship(relationship.id, requestData);
      } else {
        // 생성
        await relationshipAPI.createRelationship(requestData);
      }
      await fetchRelationship();
      setShowRelationshipModal(false);
    } catch (err) {
      console.error('관계 저장 실패:', err);
      alert('관계 설정 저장에 실패했습니다');
    }
  };

  const handleGenerateRecommendations = useCallback(async (messageId) => {
    try {
      setRecommendationLoading(true);
      const result = await telegramAPI.generateRecommendations(messageId);
      setRecommendations(result.recommendations || []);
    } catch (err) {
      console.error('AI 추천 생성 실패:', err);
      setRecommendations([]);
    } finally {
      setRecommendationLoading(false);
    }
  }, []);

  const fetchConversationMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:3000/telegram/conversations/${partnerId}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('대화 내역을 불러오지 못했습니다');
      }

      const data = await response.json();
      setPartner(data.partner);
      setMessages(data.messages || []);

      if (data.messages && data.messages.length > 0) {
        const lastMessage = data.messages[data.messages.length - 1];
        if (lastMessage.role === 'user') {
          handleGenerateRecommendations(lastMessage.id);
        }
      }
    } catch (err) {
      console.error('대화 메시지 조회 실패:', err);
      setError(err.message || '대화를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, [partnerId, handleGenerateRecommendations]);

  useEffect(() => {
    fetchConversations();

    if (partnerId) {
      fetchConversationMessages();
      fetchRelationship();
    }

    const eventSource = new EventSource('http://localhost:3000/telegram/events');

    eventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      console.log('새 메시지 도착:', newMessage);
      fetchConversationMessages();
      fetchConversations();
    };

    eventSource.onerror = (error) => {
      console.error('SSE 연결 오류:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [partnerId, fetchConversationMessages, fetchConversations, fetchRelationship]);

  const handleSendReply = async (messageId, selectedReply) => {
    try {
      await telegramAPI.sendReply(messageId, selectedReply);
      setRecommendations([]);
      fetchConversationMessages();
    } catch (err) {
      console.error('답변 전송 실패:', err);
      alert('답변 전송에 실패했습니다');
    }
  };

  const handleSendCustomMessage = async () => {
    if (!inputText.trim()) return;

    try {
      // 직접 메시지 전송 API 호출
      await telegramAPI.sendMessage(partner.telegram_id, inputText);
      setInputText('');
      fetchConversationMessages();
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      alert('메시지 전송에 실패했습니다');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && messages.length === 0) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.chatLayout}>
        {/* 햄버거 메뉴 버튼 (작은 화면에서만 표시) */}
        <button
          className={styles.hamburgerButton}
          onClick={() => setShowConversationList(!showConversationList)}
        >
          ☰
        </button>

        {/* 왼쪽: 대화 목록 (30%) */}
        <div className={`${styles.conversationList} ${showConversationList ? styles.conversationListMobileShow : ''}`}>
          <div className={styles.conversationHeader}>
            <h3 className={styles.conversationTitle}>대화 목록</h3>
            <button
              className={styles.closeListButton}
              onClick={() => setShowConversationList(false)}
            >
              ✕
            </button>
          </div>
          <div className={styles.conversationItems}>
            {conversations.map((conv) => (
              <div
                key={conv.partner_id}
                className={`${styles.conversationItem} ${
                  conv.partner_id === partnerId ? styles.conversationItemActive : ''
                }`}
                onClick={() => {
                  navigate(`/chat/${conv.partner_id}`);
                  setShowConversationList(false);
                }}
              >
                <div className={styles.avatar}>
                  <span className={styles.avatarText}>
                    {conv.partner_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className={styles.conversationContent}>
                  <span className={styles.name}>{conv.partner_name}</span>
                  <span className={styles.lastMessage}>{conv.last_message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 채팅 윈도우 (70%) */}
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <button className={styles.backButton} onClick={() => navigate('/')}>
              ←
            </button>
            <div className={styles.chatHeaderInfo}>
              <h2 className={styles.chatTitle}>{partner?.name || '대화 상대'}</h2>
              <p className={styles.chatSubtitle}>
                {relationship ? RELATIONSHIP_LABELS[relationship.category] : '관계 미설정'} · {messages.length}개의 메시지
              </p>
            </div>
            <button
              className={styles.relationshipButton}
              onClick={() => setShowRelationshipModal(true)}
              title="관계 설정"
            >
              ⚙️
            </button>
          </div>

          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.emptyMessages}>
                <p>메시지가 없습니다</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.messageItem} ${
                    message.role === 'assistant' ? styles.messageOutgoing : styles.messageIncoming
                  }`}
                >
                  <div className={styles.messageBubble}>
                    <p className={styles.messageText}>{message.text}</p>
                    <span className={styles.messageTime}>
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* AI 추천 답변 (채팅창 하단에 인라인) */}
          {recommendationLoading && (
            <div className={styles.recommendationInline}>
              <p className={styles.recommendationLabel}>💡 AI 추천 답변 생성 중...</p>
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
              </div>
            </div>
          )}
          {!recommendationLoading && recommendations.length > 0 && (
            <div className={styles.recommendationInline}>
              <p className={styles.recommendationLabel}>💡 AI 추천 답변</p>
              <div className={styles.recommendationButtons}>
                {recommendations.map((rec, index) => (
                  <button
                    key={index}
                    className={styles.recommendationButton}
                    onClick={() => handleSendReply(rec.messageId, rec.text)}
                  >
                    {rec.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 메시지 입력창 */}
          <div className={styles.inputContainer}>
            <input
              type="text"
              className={styles.messageInput}
              placeholder="메시지를 입력하세요..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendCustomMessage()}
            />
            <button
              className={styles.sendButton}
              onClick={handleSendCustomMessage}
              disabled={!inputText.trim()}
            >
              전송
            </button>
          </div>
        </div>
      </div>

      {/* 관계 설정 모달 */}
      {showRelationshipModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRelationshipModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>관계 설정</h3>
              <button
                className={styles.modalCloseButton}
                onClick={() => setShowRelationshipModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>관계 카테고리</label>
                <select
                  className={styles.formSelect}
                  value={relationshipForm.category}
                  onChange={(e) => setRelationshipForm({ ...relationshipForm, category: e.target.value })}
                >
                  <option value="">-</option>
                  {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>존댓말 수준</label>
                <select
                  className={styles.formSelect}
                  value={relationshipForm.politeness}
                  onChange={(e) => setRelationshipForm({ ...relationshipForm, politeness: e.target.value })}
                >
                  <option value="">-</option>
                  {Object.entries(POLITENESS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>대화 분위기</label>
                <select
                  className={styles.formSelect}
                  value={relationshipForm.vibe}
                  onChange={(e) => setRelationshipForm({ ...relationshipForm, vibe: e.target.value })}
                >
                  <option value="">-</option>
                  {Object.entries(VIBE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>이모지 사용 빈도: {relationshipForm.emojiLevel}</label>
                <input
                  type="range"
                  className={styles.formRange}
                  min="0"
                  max="5"
                  value={relationshipForm.emojiLevel}
                  onChange={(e) => setRelationshipForm({ ...relationshipForm, emojiLevel: parseInt(e.target.value) })}
                />
                <div className={styles.rangeLabels}>
                  <span>없음</span>
                  <span>매우 많음</span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.modalCancelButton}
                onClick={() => setShowRelationshipModal(false)}
              >
                취소
              </button>
              <button
                className={styles.modalSaveButton}
                onClick={handleSaveRelationship}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;

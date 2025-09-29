import api from '../clients/http.js';

// 텔레그램 API 서비스 함수들
export const telegramAPI = {
  // 수신된 모든 메시지 가져오기
  getMessages: async (isPolling = false) => {
    try {
      const response = await api.get('/telegram/messages', {
        isPolling
      });
      return response.data;
    } catch (error) {
      console.error('메시지 가져오기 실패:', error);
      throw error;
    }
  },

  // 메시지에 대한 AI 추천 답변 생성
  generateRecommendations: async (messageId) => {
    try {
      const response = await api.post('/telegram/recommendations', {
        messageId
      });
      return response.data;
    } catch (error) {
      console.error('AI 추천 생성 실패:', error);
      throw error;
    }
  },

  // 선택한 답변 전송
  sendReply: async (messageId, selectedReply) => {
    try {
      const response = await api.post('/telegram/reply', {
        messageId,
        selectedReply
      });
      return response.data;
    } catch (error) {
      console.error('답변 전송 실패:', error);
      throw error;
    }
  },

  // 직접 메시지 전송 (옵션)
  sendMessage: async (chatId, text) => {
    try {
      const response = await api.post('/telegram/send', {
        chatId,
        text
      });
      return response.data;
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      throw error;
    }
  },

  // 봇 상태 확인
  getBotStatus: async () => {
    try {
      const response = await api.get('/telegram/status');
      return response.data;
    } catch (error) {
      console.error('봇 상태 확인 실패:', error);
      throw error;
    }
  }
};

// 개별 함수들을 편의를 위해 개별적으로 export
export const {
  getMessages,
  generateRecommendations,
  sendReply,
  sendMessage,
  getBotStatus
} = telegramAPI;
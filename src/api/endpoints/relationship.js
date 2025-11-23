import api from '../clients/http.js';

// Relationship API 서비스 함수들
export const relationshipAPI = {
  // 모든 관계 목록 조회
  getRelationships: async () => {
    try {
      const response = await api.get('/relationships');
      return response.data;
    } catch (error) {
      console.error('관계 목록 조회 실패:', error);
      throw error;
    }
  },

  // 특정 관계 조회
  getRelationship: async (relationshipId) => {
    try {
      const response = await api.get(`/relationships/${relationshipId}`);
      return response.data;
    } catch (error) {
      console.error('관계 조회 실패:', error);
      throw error;
    }
  },

  // 관계 생성
  createRelationship: async (data) => {
    try {
      const response = await api.post('/relationships', {
        partnerId: data.partnerId,
        category: data.category,
        politeness: data.politeness,
        vibe: data.vibe,
        emojiLevel: data.emojiLevel
      });
      return response.data;
    } catch (error) {
      console.error('관계 생성 실패:', error);
      throw error;
    }
  },

  // 관계 수정
  updateRelationship: async (relationshipId, data) => {
    try {
      const response = await api.patch(`/relationships/${relationshipId}`, {
        category: data.category,
        politeness: data.politeness,
        vibe: data.vibe,
        emojiLevel: data.emojiLevel
      });
      return response.data;
    } catch (error) {
      console.error('관계 수정 실패:', error);
      throw error;
    }
  },

  // 관계 삭제
  deleteRelationship: async (relationshipId) => {
    try {
      const response = await api.delete(`/relationships/${relationshipId}`);
      return response.data;
    } catch (error) {
      console.error('관계 삭제 실패:', error);
      throw error;
    }
  }
};

// 관계 카테고리 상수
export const RELATIONSHIP_CATEGORIES = {
  FAMILY_ELDER_CLOSE: 'FAMILY_ELDER_CLOSE',
  FAMILY_SIBLING_ELDER: 'FAMILY_SIBLING_ELDER',
  FAMILY_SIBLING_YOUNGER: 'FAMILY_SIBLING_YOUNGER',
  PARTNER_INTIMATE: 'PARTNER_INTIMATE',
  FRIEND_CLOSE: 'FRIEND_CLOSE',
  ACQUAINTANCE_CASUAL: 'ACQUAINTANCE_CASUAL',
  WORK_SENIOR_FORMAL: 'WORK_SENIOR_FORMAL',
  WORK_SENIOR_FRIENDLY: 'WORK_SENIOR_FRIENDLY',
  WORK_PEER: 'WORK_PEER',
  WORK_JUNIOR: 'WORK_JUNIOR'
};

// 관계 카테고리 한글 라벨
export const RELATIONSHIP_LABELS = {
  FAMILY_ELDER_CLOSE: '어른 가족 (부모/조부모)',
  FAMILY_SIBLING_ELDER: '형/오빠/언니/누나',
  FAMILY_SIBLING_YOUNGER: '남/여동생',
  PARTNER_INTIMATE: '연인/배우자',
  FRIEND_CLOSE: '친한 친구',
  ACQUAINTANCE_CASUAL: '가벼운 지인',
  WORK_SENIOR_FORMAL: '상사/교수/임원',
  WORK_SENIOR_FRIENDLY: '가까운 선배/멘토',
  WORK_PEER: '동료/파트너',
  WORK_JUNIOR: '후배/인턴/팀원'
};

// 존댓말 수준
export const POLITENESS_LEVELS = {
  FORMAL: 'FORMAL',
  POLITE: 'POLITE',
  CASUAL: 'CASUAL'
};

export const POLITENESS_LABELS = {
  FORMAL: '격식 존댓말 (-습니다)',
  POLITE: '일반 존댓말 (-요)',
  CASUAL: '반말'
};

// 대화 분위기
export const VIBE_TYPES = {
  CALM: 'CALM',
  DIRECT: 'DIRECT',
  PLAYFUL: 'PLAYFUL',
  CARING: 'CARING'
};

export const VIBE_LABELS = {
  CALM: '차분',
  DIRECT: '직설적',
  PLAYFUL: '장난스러운',
  CARING: '배려하는'
};

// 개별 함수들을 편의를 위해 개별적으로 export
export const {
  getRelationships,
  getRelationship,
  createRelationship,
  updateRelationship,
  deleteRelationship
} = relationshipAPI;

import axios from 'axios';

// axios 기본 설정 (단일한 HTTP 클라이언트 인스턴스)
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: false,
});

// 요청 인터셉터: 에러 처리만 수행
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error('요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리 및 사용자 친화적 메시지 생성
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 네트워크 에러 종류별 로그 출력
    if (error.code === 'ERR_NETWORK') {
      console.error('네트워크 에러: 백엔드 서버에 연결할 수 없습니다.');
    } else if (error.code === 'ERR_CORS') {
      console.error('CORS 에러: 백엔드에서 CORS 정책을 확인하세요.');
    } else if (error.response) {
      console.error(`서버 에러: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      console.error('응답 없음:', error.request);
    } else {
      console.error('알 수 없는 오류:', error.message);
    }

    // UI에서 사용할 사용자 친화적 에러 메시지 추가
    const enhancedError = {
      ...error,
      userMessage: getUserFriendlyErrorMessage(error)
    };

    return Promise.reject(enhancedError);
  }
);

// 사용자 친화적 에러 메시지 생성 헬퍼 함수
function getUserFriendlyErrorMessage(error) {
  if (error.code === 'ERR_NETWORK') {
    return '백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
  } else if (error.code === 'ERR_CORS') {
    return 'CORS 정책으로 인해 요청이 차단되었습니다.';
  } else if (error.response?.status === 404) {
    return '요청한 리소스를 찾을 수 없습니다.';
  } else if (error.response?.status === 500) {
    return '서버 내부 오류가 발생했습니다.';
  } else if (error.code === 'ECONNABORTED') {
    return '요청 시간이 초과되었습니다.';
  } else {
    return '알 수 없는 오류가 발생했습니다.';
  }
}

export default api;
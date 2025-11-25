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

// 토큰 갱신 함수 (SSE에서도 사용 가능하도록 export)
export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await axios.post('http://localhost:3000/auth/refresh', {
      refresh_token: refreshToken
    });

    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);
    return access_token;

  } catch (error) {
    // Refresh Token도 만료됨 - 로그아웃 처리
    console.error('토큰 갱신 실패:', error);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw error;
  }
};

// 요청 인터셉터: JWT 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('🔑 [Axios 요청]', config.method?.toUpperCase(), config.url);
    console.log('🔑 [토큰 존재 여부]', !!token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ [Authorization 헤더 추가됨]', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.warn('⚠️ [토큰 없음] Authorization 헤더 없이 요청');
    }

    return config;
  },
  (error) => {
    console.error('❌ [요청 인터셉터 오류]', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 시 토큰 갱신 및 에러 처리
api.interceptors.response.use(
  (response) => {
    console.log('✅ [Axios 응답 성공]', response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error('❌ [Axios 응답 에러]', error.response?.status, originalRequest?.url);

    // 401 에러이고 재시도가 아닌 경우 토큰 갱신
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('🔄 [401 에러] 토큰 갱신 시도...');
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        console.log('✅ [토큰 갱신 성공] 요청 재시도 중...');

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.error('❌ [토큰 갱신 실패]', refreshError);
        return Promise.reject(refreshError);
      }
    }

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
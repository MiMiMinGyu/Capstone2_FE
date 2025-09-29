// 프로덕션 환경을 위한 로거 유틸리티
const isDevelopment = import.meta.env.DEV;

export const logger = {
  // 개발 환경에서만 출력하는 로그
  dev: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  // 개발 환경에서만 출력하는 정보 로그
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  // 개발 환경에서만 출력하는 경고 로그
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  // 항상 출력하는 에러 로그 (프로덕션에서도 필요)
  error: (...args) => {
    console.error(...args);
  },

  // 중요한 이벤트 로그 (프로덕션에서도 필요)
  event: (...args) => {
    console.log(...args);
  },

  // 그룹 로그 (개발 환경에서만)
  group: (label, fn) => {
    if (isDevelopment) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  }
};

export default logger;

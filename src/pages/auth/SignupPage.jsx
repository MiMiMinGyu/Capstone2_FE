import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './SignupPage.module.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid =
      formData.name.length > 0 &&
      formData.username.length >= 3 &&
      emailRegex.test(formData.email) &&
      formData.password.length >= 6 &&
      formData.password === formData.passwordConfirm;
    setIsFormValid(isValid);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username || formData.username.length < 3) {
      newErrors.username = '사용자명은 3자 이상이어야 합니다';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = '올바른 이메일 주소를 입력해주세요';
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다';
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다';
    }

    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          name: formData.name
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErrors({ email: '이미 사용 중인 이메일 또는 사용자명입니다' });
        } else {
          setErrors({ general: data.message || '회원가입에 실패했습니다' });
        }
        return;
      }

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/chat');
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ general: '네트워크 오류가 발생했습니다' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <button
          className={styles.closeButton}
          onClick={() => navigate('/')}
          aria-label="닫기"
        >
          ✕
        </button>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>💬</span>
            <h1 className={styles.logoText}>LikemeLikeMe</h1>
          </div>
          <h2 className={styles.title}>회원가입</h2>
          <p className={styles.subtitle}>
            LikemeLikeMe와 함께 맞춤형 답변을 시작하세요!
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.general && (
            <div className={styles.errorAlert}>{errors.general}</div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              이름
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="카카오톡에서 사용하는 이름"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.name && (
              <span className={styles.errorText}>{errors.name}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>
              사용자명
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="사용자명을 입력해주세요"
              className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.username && (
              <span className={styles.errorText}>{errors.username}</span>
            )}
            <span className={styles.helpText}>
              3자 이상 입력해주세요
            </span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="이메일을 입력해주세요"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.email && (
              <span className={styles.errorText}>{errors.email}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력해주세요"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.password && (
              <span className={styles.errorText}>{errors.password}</span>
            )}
            <span className={styles.helpText}>
              6자 이상 입력해주세요
            </span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="passwordConfirm" className={styles.label}>
              비밀번호 확인
            </label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력해주세요"
              className={`${styles.input} ${errors.passwordConfirm ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.passwordConfirm && (
              <span className={styles.errorText}>{errors.passwordConfirm}</span>
            )}
          </div>

          <button
            type="submit"
            className={`${styles.submitButton} ${isFormValid ? styles.submitButtonActive : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            이미 계정이 있으신가요?
          </p>
          <Link to="/login" className={styles.link}>
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

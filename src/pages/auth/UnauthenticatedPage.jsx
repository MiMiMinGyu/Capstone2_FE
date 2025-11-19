import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import styles from './UnauthenticatedPage.module.css';

const UnauthenticatedPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.content}>
        <div className={styles.messageBox}>
          <div className={styles.icon}>🔒</div>
          <h1 className={styles.title}>로그인이 필요합니다</h1>
          <p className={styles.description}>
            채팅 기능을 사용하려면 로그인해 주세요
          </p>
          <button
            className={styles.loginButton}
            onClick={() => navigate('/login')}
          >
            로그인하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthenticatedPage;

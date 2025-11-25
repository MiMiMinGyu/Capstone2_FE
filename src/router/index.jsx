import { Routes, Route, Navigate } from 'react-router-dom';
import MainPage from '../pages/main/MainPage';
import ChatPage from '../pages/chat';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import KakaoUploadPage from '../pages/upload/KakaoUploadPage';
import TelegramAPITest from '../pages/test/TelegramAPITest';
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:userId"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <KakaoUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/test/telegram"
        element={
          <ProtectedRoute>
            <TelegramAPITest />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
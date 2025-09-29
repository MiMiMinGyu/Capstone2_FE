import { Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from '../pages/chat';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
};

export default AppRoutes;
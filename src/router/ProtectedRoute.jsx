import UnauthenticatedPage from '../pages/auth/UnauthenticatedPage';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    return !!token;
  };

  if (!isAuthenticated()) {
    return <UnauthenticatedPage />;
  }

  return children;
};

export default ProtectedRoute;
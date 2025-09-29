import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAuthenticated = true, redirectTo = "/login" }) => {
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
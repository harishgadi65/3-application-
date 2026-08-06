import { Navigate } from 'react-router-dom';
import { authApi } from '../lib/api.js';

export default function ProtectedRoute({ children }) {
  if (!authApi.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

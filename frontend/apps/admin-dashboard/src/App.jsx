import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StompProvider } from '@smartad/websocket';
import { ErrorBoundary, ToastProvider } from '@smartad/shared-ui';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SessionsPage from './pages/SessionsPage.jsx';
import SessionDetailPage from './pages/SessionDetailPage.jsx';
import AdvertisementsPage from './pages/AdvertisementsPage.jsx';
import ConfigPage from './pages/ConfigPage.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <StompProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/sessions/:code" element={<SessionDetailPage />} />
                <Route path="/advertisements" element={<AdvertisementsPage />} />
                <Route path="/advertisements/screens" element={<AdvertisementsPage initialTab="screens" />} />
                <Route path="/config" element={<ConfigPage />} />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </StompProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

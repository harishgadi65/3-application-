import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { StompProvider } from '@smartad/websocket';
import { ToastProvider, ErrorBoundary } from '@smartad/shared-ui';
import { authApi } from '@smartad/api-client';
import BottomNav from './components/BottomNav.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import JoinGamePage from './pages/JoinGamePage.jsx';
import ScanScreenPage from './pages/ScanScreenPage.jsx';
import GamePlayPage from './pages/GamePlayPage.jsx';
import GameSelectPage from './pages/GameSelectPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';

/**
 * Guards a single route: redirects to /login when not authenticated.
 * Used for the immersive game screen, which intentionally has no
 * BottomNav so the full-screen controllers (D-pad / tap button /
 * reaction flash) get maximum screen real estate.
 */
function RequireAuth({ children }) {
  if (!authApi.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * Shared chrome for the rest of the authenticated app: renders the
 * current page plus the fixed BottomNav (Play / History / Logout).
 */
function ProtectedLayout() {
  if (!authApi.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}

function IndexRedirect() {
  return <Navigate to={authApi.isAuthenticated() ? '/join' : '/login'} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <StompProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<ProtectedLayout />}>
                <Route path="/join" element={<JoinGamePage />} />
                <Route path="/result/:code" element={<ResultPage />} />
                <Route path="/history" element={<HistoryPage />} />
              </Route>

              <Route
                path="/scan/:displayCode"
                element={
                  <RequireAuth>
                    <ScanScreenPage />
                  </RequireAuth>
                }
              />

              <Route
                path="/select/:code"
                element={
                  <RequireAuth>
                    <GameSelectPage />
                  </RequireAuth>
                }
              />

              <Route
                path="/play/:code"
                element={
                  <RequireAuth>
                    <GamePlayPage />
                  </RequireAuth>
                }
              />

              <Route path="/" element={<IndexRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </StompProvider>
    </ErrorBoundary>
  );
}

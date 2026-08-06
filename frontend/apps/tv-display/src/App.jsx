import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StompProvider } from '@smartad/websocket';
import { ErrorBoundary, ToastProvider } from '@smartad/shared-ui';
import LandingPage from './pages/LandingPage.jsx';
import TVDisplayPage from './pages/TVDisplayPage.jsx';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <StompProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/display/:sessionCode" element={<TVDisplayPage />} />
            </Routes>
          </BrowserRouter>
        </StompProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DISPLAY_CODE_KEY = 'smartad_display_code';

/**
 * "/" is only ever reached once DisplayCodeGate has already required a
 * registered display code, so this just hands off to that screen's own
 * idle view (see ScreenIdlePage) - including after a game session ends,
 * since TVDisplayPage navigates back to "/" on completion.
 */
export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const displayCode = localStorage.getItem(DISPLAY_CODE_KEY);
    navigate(displayCode ? `/screen/${displayCode}` : '/', { replace: true });
  }, [navigate]);

  return <div className="h-screen w-screen bg-black" />;
}

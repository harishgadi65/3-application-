import { useCallback, useEffect, useState } from 'react';
import { adApi, gameApi } from '../lib/api.js';
import { LoadingSpinner } from '@smartad/shared-ui';
import AdUploader from '../components/AdUploader.jsx';
import AdList from '../components/AdList.jsx';
import ScreensPanel from '../components/ScreensPanel.jsx';

export default function AdvertisementsPage({ initialTab = 'advertisements' }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [games, setGames] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadAds = useCallback(async () => {
    setLoading(true);
    try {
      const [list, gameList] = await Promise.all([
        adApi.listAllAds(),
        gameApi.listGames(),
      ]);
      setAds(Array.isArray(list) ? list : []);
      setGames(Array.isArray(gameList) ? gameList : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Advertisements</h1>
        <p className="text-sm text-slate-500">
          Control the single starting-screen ad and the four edge ads shown around the game.
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('advertisements')}
          className={`border-b-2 px-5 py-3 text-sm font-semibold ${activeTab === 'advertisements' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Advertisements
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('screens')}
          className={`border-b-2 px-5 py-3 text-sm font-semibold ${activeTab === 'screens' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Screens
        </button>
      </div>

      {activeTab === 'advertisements' ? <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AdUploader onUploaded={loadAds} />
        </div>
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : (
            <AdList ads={ads} onChanged={loadAds} />
          )}
        </div>
      </div> : <ScreensPanel ads={ads} games={games} onAdsChanged={loadAds} />}
    </div>
  );
}

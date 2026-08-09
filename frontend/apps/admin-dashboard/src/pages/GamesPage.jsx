import { useCallback, useEffect, useState } from 'react';
import { gameApi } from '../lib/api.js';
import { LoadingSpinner } from '@smartad/shared-ui';
import GameUploader from '../components/GameUploader.jsx';
import GameList from '../components/GameList.jsx';
import GameTrashList from '../components/GameTrashList.jsx';

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('games');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catalog, trashed] = await Promise.all([
        gameApi.listCatalog(),
        gameApi.listTrash(),
      ]);
      setGames(Array.isArray(catalog) ? catalog : []);
      setTrash(Array.isArray(trashed) ? trashed : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const playableCount = games.filter((g) => g.playable).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Games</h1>
        <p className="text-sm text-slate-500">
          {loading
            ? 'Loading catalog...'
            : `${games.length} game${games.length === 1 ? '' : 's'} in the catalog, ${playableCount} playable.`}
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('games')}
          className={`border-b-2 px-5 py-3 text-sm font-semibold ${activeTab === 'games' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Games
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trash')}
          className={`border-b-2 px-5 py-3 text-sm font-semibold ${activeTab === 'trash' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Trash{trash.length > 0 ? ` (${trash.length})` : ''}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : activeTab === 'games' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <GameUploader onCreated={loadAll} />
          </div>
          <div className="lg:col-span-2">
            <GameList games={games} onChanged={loadAll} />
          </div>
        </div>
      ) : (
        <GameTrashList games={trash} onChanged={loadAll} />
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { adApi } from '../lib/api.js';
import { LoadingSpinner } from '@smartad/shared-ui';
import AdUploader from '../components/AdUploader.jsx';
import AdList from '../components/AdList.jsx';

export default function AdvertisementsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAds = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adApi.listAds();
      setAds(list || []);
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
          Upload creative assets and manage where and how often they appear.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
      </div>
    </div>
  );
}

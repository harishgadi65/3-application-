import { useCallback, useEffect, useState } from 'react';
import { couponApi } from '../lib/api.js';
import { LoadingSpinner } from '@smartad/shared-ui';
import CouponUploader from '../components/CouponUploader.jsx';
import CouponList from '../components/CouponList.jsx';
import CouponTrashList from '../components/CouponTrashList.jsx';
import CouponAssignmentsPanel from '../components/CouponAssignmentsPanel.jsx';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('coupons');

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const [list, trashList] = await Promise.all([
        couponApi.listAllCoupons(),
        couponApi.listTrash(),
      ]);
      setCoupons(Array.isArray(list) ? list : []);
      setTrash(Array.isArray(trashList) ? trashList : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Coupons</h1>
        <p className="text-sm text-slate-500">
          Create sponsor rewards and assign them to a game on any screen group, ungrouped screens, or a specific screen.
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          className={`border-b-2 px-5 py-3 text-sm font-semibold ${activeTab === 'coupons' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Coupons
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('assigned')}
          className={`border-b-2 px-5 py-3 text-sm font-semibold ${activeTab === 'assigned' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Assigned coupons
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trash')}
          className={`border-b-2 px-5 py-3 text-sm font-semibold ${activeTab === 'trash' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Trash{trash.length > 0 ? ` (${trash.length})` : ''}
        </button>
      </div>

      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <CouponUploader onUploaded={loadCoupons} />
          </div>
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <p className="text-sm text-rose-600">{error}</p>
            ) : (
              <CouponList coupons={coupons} onChanged={loadCoupons} />
            )}
          </div>
        </div>
      )}
      {activeTab === 'assigned' && <CouponAssignmentsPanel onCouponsChanged={loadCoupons} />}
      {activeTab === 'trash' && (
        loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <CouponTrashList coupons={trash} onChanged={loadCoupons} />
        )
      )}
    </div>
  );
}

import { useState } from 'react';
import { couponApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function CouponTrashList({ coupons = [], onChanged }) {
  if (coupons.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-slate-400">Trash is empty.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {coupons.map((coupon) => (
        <TrashedCouponCard key={coupon.id} coupon={coupon} onChanged={onChanged} />
      ))}
    </div>
  );
}

function TrashedCouponCard({ coupon, onChanged }) {
  const toast = useToast();
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingPurge, setConfirmingPurge] = useState(false);

  async function handleRestore() {
    setRestoring(true);
    try {
      await couponApi.restoreCoupon(coupon.id);
      toast('Coupon restored', { type: 'success' });
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to restore coupon', { type: 'error' });
    } finally {
      setRestoring(false);
    }
  }

  async function handlePurge() {
    setDeleting(true);
    try {
      await couponApi.permanentlyDeleteCoupon(coupon.id);
      toast('Coupon permanently deleted', { type: 'success' });
      setConfirmingPurge(false);
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Failed to permanently delete coupon', { type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3 opacity-75">
      {coupon.imageUrl ? (
        <div className="aspect-video overflow-hidden rounded-md bg-slate-100">
          <img src={coupon.imageUrl} alt={coupon.title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
          No image
        </div>
      )}

      <div>
        <p className="truncate font-medium text-slate-900">{coupon.title}</p>
        {coupon.clientName && <p className="truncate text-xs text-slate-500">{coupon.clientName}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="badge-slate font-mono">{coupon.code}</span>
          <span className="badge-rose">In trash</span>
        </div>
      </div>

      <div className="flex gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          className="btn-secondary flex-1"
          onClick={handleRestore}
          disabled={restoring || deleting}
        >
          {restoring ? 'Restoring...' : 'Restore'}
        </button>
        <button
          type="button"
          className="btn-danger flex-1"
          onClick={() => setConfirmingPurge(true)}
          disabled={restoring || deleting}
        >
          Delete forever
        </button>
      </div>

      <ConfirmDialog
        open={confirmingPurge}
        title="Permanently delete this coupon?"
        message={`"${coupon.title}" will be removed for good. This can't be undone.`}
        confirmLabel="Delete forever"
        danger
        busy={deleting}
        onConfirm={handlePurge}
        onCancel={() => setConfirmingPurge(false)}
      />
    </div>
  );
}

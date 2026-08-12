import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { couponApi, screenApi, gameApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';

const initialForm = {
  clientName: '',
  title: '',
  code: '',
  discountDescription: '',
  targetType: '',
  targetGroupId: '',
  targetScreenId: '',
  gameType: '',
};

export default function CouponUploader({ onUploaded }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [screens, setScreens] = useState([]);
  const [groups, setGroups] = useState([]);
  const [games, setGames] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadTargets = useCallback(async () => {
    try {
      const [screenList, groupList, gameList] = await Promise.all([
        screenApi.listScreens(),
        screenApi.listGroups(),
        gameApi.listGames(),
      ]);
      setScreens(Array.isArray(screenList) ? screenList : []);
      setGroups(Array.isArray(groupList) ? groupList : []);
      setGames(Array.isArray(gameList) ? gameList : []);
    } catch (err) {
      toast(err.message || 'Failed to load screens/games', { type: 'error' });
    }
  }, [toast]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateTargetType(targetType) {
    setForm((prev) => ({ ...prev, targetType, targetGroupId: '', targetScreenId: '' }));
  }

  const ungroupedScreens = useMemo(() => screens.filter((s) => !s.groupId), [screens]);

  const targetScreens = useMemo(() => {
    if (form.targetType === 'GROUP') {
      return screens.filter((s) => form.targetGroupId && String(s.groupId) === String(form.targetGroupId));
    }
    if (form.targetType === 'UNGROUPED' || form.targetType === 'SCREEN') {
      return screens.filter((s) => form.targetScreenId && String(s.id) === String(form.targetScreenId));
    }
    return [];
  }, [form.targetType, form.targetGroupId, form.targetScreenId, screens]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (!form.code.trim()) {
      setError('Please enter a coupon code.');
      return;
    }
    if (!form.discountDescription.trim()) {
      setError('Please describe the discount/reward.');
      return;
    }
    if (!form.gameType) {
      setError('Please choose a game.');
      return;
    }
    if (!form.targetType) {
      setError('Please choose who this should be assigned to.');
      return;
    }
    if (form.targetType === 'GROUP' && !form.targetGroupId) {
      setError('Please choose a screen group.');
      return;
    }
    if ((form.targetType === 'SCREEN' || form.targetType === 'UNGROUPED') && !form.targetScreenId) {
      setError('Please choose a screen.');
      return;
    }
    if (targetScreens.length === 0) {
      setError('No screens match that target.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      if (form.clientName.trim()) formData.append('clientName', form.clientName.trim());
      formData.append('code', form.code.trim());
      formData.append('discountDescription', form.discountDescription.trim());
      if (imageFile) formData.append('file', imageFile);

      const created = await couponApi.uploadCoupon(formData);
      const screenIds = targetScreens.map((screen) => screen.id);
      await couponApi.assignCoupon(screenIds, form.gameType, created.id);

      toast(`Assigned to ${targetScreens.length} screen${targetScreens.length === 1 ? '' : 's'}`, { type: 'success' });
      setForm(initialForm);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploaded?.();
    } catch (err) {
      setError(err.message || 'Failed to create coupon');
      toast(err.message || 'Failed to create coupon', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">Create coupon</h3>

      <div>
        <label className="label" htmlFor="coupon-client-name">Client name</label>
        <input
          id="coupon-client-name"
          type="text"
          className="input"
          value={form.clientName}
          onChange={(e) => updateField('clientName', e.target.value)}
          placeholder="Client or brand name"
        />
      </div>

      <div>
        <label className="label" htmlFor="coupon-title">Title</label>
        <input
          id="coupon-title"
          type="text"
          className="input"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Win and save"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="coupon-code">Coupon code</label>
          <input
            id="coupon-code"
            type="text"
            className="input"
            value={form.code}
            onChange={(e) => updateField('code', e.target.value)}
            placeholder="SAVE20"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="coupon-discount">Discount / reward</label>
          <input
            id="coupon-discount"
            type="text"
            className="input"
            value={form.discountDescription}
            onChange={(e) => updateField('discountDescription', e.target.value)}
            placeholder="20% off"
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="coupon-image">Image (optional)</label>
        <input
          id="coupon-image"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="input"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
      </div>

      <div>
        <label className="label" htmlFor="coupon-game">Game</label>
        <select
          id="coupon-game"
          className="input"
          value={form.gameType}
          onChange={(e) => updateField('gameType', e.target.value)}
        >
          <option value="">Select game</option>
          {games.map((game) => (
            <option key={game.gameType} value={game.gameType}>{game.displayName}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="coupon-target-type">Assign to</label>
        <select
          id="coupon-target-type"
          className="input"
          value={form.targetType}
          onChange={(e) => updateTargetType(e.target.value)}
        >
          <option value="">Select target type</option>
          <option value="GROUP">Screen group</option>
          <option value="UNGROUPED">Ungrouped screens</option>
          <option value="SCREEN">Specific screen</option>
        </select>
      </div>

      {form.targetType === 'GROUP' && (
        <select
          className="input"
          value={form.targetGroupId}
          onChange={(e) => updateField('targetGroupId', e.target.value)}
        >
          <option value="">Select group</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      )}

      {form.targetType === 'SCREEN' && (
        <select
          className="input"
          value={form.targetScreenId}
          onChange={(e) => updateField('targetScreenId', e.target.value)}
        >
          <option value="">Select screen</option>
          {screens.map((screen) => (
            <option key={screen.id} value={screen.id}>#{screen.screenNo} — {screen.displayCode}</option>
          ))}
        </select>
      )}

      {form.targetType === 'UNGROUPED' && (
        <select
          className="input"
          value={form.targetScreenId}
          onChange={(e) => updateField('targetScreenId', e.target.value)}
        >
          <option value="">
            {ungroupedScreens.length === 0 ? 'No ungrouped screens' : 'Select screen'}
          </option>
          {ungroupedScreens.map((screen) => (
            <option key={screen.id} value={screen.id}>#{screen.screenNo} — {screen.displayCode}</option>
          ))}
        </select>
      )}

      {form.targetType && (
        <p className="text-xs text-slate-500">
          Will apply to <span className="font-semibold text-slate-700">{targetScreens.length}</span> screen{targetScreens.length === 1 ? '' : 's'}.
        </p>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create coupon'}
      </button>
    </form>
  );
}

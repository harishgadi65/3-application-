import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adApi, screenApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';

const POSITIONS = ['STARTUP', 'TOP', 'BOTTOM', 'LEFT', 'RIGHT'];
const POSITION_LABELS = {
  STARTUP: 'Starting screen (single ad + QR)',
  TOP: 'Top edge',
  BOTTOM: 'Bottom edge',
  LEFT: 'Left edge',
  RIGHT: 'Right edge',
};
const AD_FIELD_BY_POSITION = {
  STARTUP: 'startupAdId',
  TOP: 'topAdId',
  BOTTOM: 'bottomAdId',
  LEFT: 'leftAdId',
  RIGHT: 'rightAdId',
};

const initialForm = {
  clientName: '',
  title: '',
  targetType: '',
  targetGroupId: '',
  targetScreenId: '',
  slots: { STARTUP: '', TOP: '', BOTTOM: '', LEFT: '', RIGHT: '' },
};

export default function AdUploader({ ads = [], onUploaded }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const uploadTargetRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [screens, setScreens] = useState([]);
  const [groups, setGroups] = useState([]);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadTargets = useCallback(async () => {
    try {
      const [screenList, groupList] = await Promise.all([
        screenApi.listScreens(),
        screenApi.listGroups(),
      ]);
      setScreens(Array.isArray(screenList) ? screenList : []);
      setGroups(Array.isArray(groupList) ? groupList : []);
    } catch (err) {
      toast(err.message || 'Failed to load screens', { type: 'error' });
    }
  }, [toast]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setSlot(position, adId) {
    setForm((prev) => ({ ...prev, slots: { ...prev.slots, [position]: adId } }));
  }

  function triggerUpload(position) {
    uploadTargetRef.current = position;
    setUploadingSlot(position);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    const position = uploadTargetRef.current;
    e.target.value = '';
    if (!file || !position) {
      setUploadingSlot(null);
      return;
    }
    if (!form.title.trim()) {
      setError('Enter a title before uploading a new advertisement file.');
      setUploadingSlot(null);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', form.title.trim());
      if (form.clientName.trim()) formData.append('clientName', form.clientName.trim());
      formData.append('mediaType', file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
      formData.append('position', position);
      formData.append('displayOrder', '0');

      const created = await adApi.uploadAd(formData);
      setSlot(position, String(created.id));
      onUploaded?.();
      toast('Advertisement uploaded', { type: 'success' });
    } catch (err) {
      toast(err.message || 'Upload failed', { type: 'error' });
    } finally {
      setUploadingSlot(null);
      uploadTargetRef.current = null;
    }
  }

  const targetScreens = useMemo(() => {
    if (form.targetType === 'GROUP') {
      return screens.filter((s) => form.targetGroupId && String(s.groupId) === String(form.targetGroupId));
    }
    if (form.targetType === 'UNGROUPED') {
      return screens.filter((s) => !s.groupId);
    }
    if (form.targetType === 'SCREEN') {
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
    if (!form.targetType) {
      setError('Please choose who this should be assigned to.');
      return;
    }
    if (form.targetType === 'GROUP' && !form.targetGroupId) {
      setError('Please choose a screen group.');
      return;
    }
    if (form.targetType === 'SCREEN' && !form.targetScreenId) {
      setError('Please choose a screen.');
      return;
    }
    const slotEntries = POSITIONS
      .filter((position) => form.slots[position])
      .map((position) => [AD_FIELD_BY_POSITION[position], Number(form.slots[position])]);
    if (slotEntries.length === 0) {
      setError('Pick at least one advertisement slot to assign.');
      return;
    }
    if (targetScreens.length === 0) {
      setError('No screens match that target.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = Object.fromEntries(slotEntries);
      await Promise.all(targetScreens.map((screen) => screenApi.updateScreen(screen.id, payload)));
      toast(`Assigned to ${targetScreens.length} screen${targetScreens.length === 1 ? '' : 's'}`, { type: 'success' });
      setForm(initialForm);
      onUploaded?.();
    } catch (err) {
      setError(err.message || 'Failed to assign advertisement');
      toast(err.message || 'Failed to assign advertisement', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm(initialForm);
    setError('');
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">Upload advertisement</h3>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div>
        <label className="label" htmlFor="ad-client-name">Client name</label>
        <input
          id="ad-client-name"
          type="text"
          className="input"
          value={form.clientName}
          onChange={(e) => updateField('clientName', e.target.value)}
          placeholder="Client or brand name"
        />
      </div>

      <div>
        <label className="label" htmlFor="ad-title">Title</label>
        <input
          id="ad-title"
          type="text"
          className="input"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Sponsor spotlight"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="ad-target-type">Assign to</label>
        <select
          id="ad-target-type"
          className="input"
          value={form.targetType}
          onChange={(e) => updateField('targetType', e.target.value)}
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

      {form.targetType && (
        <p className="text-xs text-slate-500">
          Will apply to <span className="font-semibold text-slate-700">{targetScreens.length}</span> screen{targetScreens.length === 1 ? '' : 's'}.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {POSITIONS.map((position) => {
          const choices = ads.filter((ad) => ad.position === position && ad.isActive !== false);
          const selectedAd = form.slots[position];
          const isUploading = uploadingSlot === position;
          return (
            <label key={position} className={position === 'STARTUP' ? 'block sm:col-span-2' : 'block'}>
              <span className="label">{POSITION_LABELS[position]}</span>
              <div className="relative">
                <select
                  className="input min-w-0 appearance-none pr-16"
                  value={selectedAd}
                  disabled={isUploading}
                  onChange={(e) => setSlot(position, e.target.value)}
                >
                  <option value="">No advertisement</option>
                  {choices.map((ad) => <option key={ad.id} value={ad.id}>{ad.title}</option>)}
                </select>
                <div className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 text-slate-400">⌄</div>
                <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 gap-1">
                  <button
                    type="button"
                    onClick={() => setSlot(position, '')}
                    disabled={!selectedAd || isUploading}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Clear ${POSITION_LABELS[position]}`}
                    title="Clear this slot"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerUpload(position)}
                    disabled={isUploading}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Upload a new ${POSITION_LABELS[position]}`}
                    title="Upload a new advertisement"
                  >
                    +
                  </button>
                </div>
              </div>
              {isUploading && <p className="mt-1 text-xs text-indigo-500">Uploading…</p>}
            </label>
          );
        })}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={handleReset} disabled={submitting}>
          Reset
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={submitting}>
          {submitting ? 'Assigning...' : 'Upload advertisement'}
        </button>
      </div>
    </form>
  );
}

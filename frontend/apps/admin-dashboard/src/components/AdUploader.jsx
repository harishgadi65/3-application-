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

const initialForm = {
  clientName: '',
  title: '',
  targetType: '',
  targetGroupId: '',
  targetScreenId: '',
  slots: { STARTUP: [], TOP: [], BOTTOM: [], LEFT: [], RIGHT: [] },
};

export default function AdUploader({ onUploaded }) {
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

  function updateTargetType(targetType) {
    setForm((prev) => ({ ...prev, targetType, targetGroupId: '', targetScreenId: '' }));
  }

  function addToSlot(position, ad) {
    setForm((prev) => ({ ...prev, slots: { ...prev.slots, [position]: [...prev.slots[position], ad] } }));
  }

  function triggerUpload(position) {
    uploadTargetRef.current = position;
    setUploadingSlot(position);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e) {
    const files = Array.from(e.target.files || []);
    const position = uploadTargetRef.current;
    e.target.value = '';
    if (files.length === 0 || !position) {
      setUploadingSlot(null);
      return;
    }
    if (!form.title.trim()) {
      setError('Enter a title before uploading advertisement files.');
      setUploadingSlot(null);
      return;
    }
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', form.title.trim());
        if (form.clientName.trim()) formData.append('clientName', form.clientName.trim());
        formData.append('mediaType', file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
        formData.append('position', position);
        formData.append('displayOrder', '0');

        const created = await adApi.uploadAd(formData);
        addToSlot(position, { id: created.id, title: created.title });
      }
      onUploaded?.();
      toast(files.length > 1 ? `${files.length} advertisements uploaded` : 'Advertisement uploaded', { type: 'success' });
    } catch (err) {
      toast(err.message || 'Upload failed', { type: 'error' });
    } finally {
      setUploadingSlot(null);
      uploadTargetRef.current = null;
    }
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
    const adEntries = POSITIONS.flatMap((position) =>
      form.slots[position].map((ad) => ({ position, adId: ad.id }))
    );
    if (adEntries.length === 0) {
      setError('Upload at least one advertisement to assign.');
      return;
    }
    if (targetScreens.length === 0) {
      setError('No screens match that target.');
      return;
    }

    setSubmitting(true);
    try {
      const screenIds = targetScreens.map((screen) => screen.id);
      await Promise.all(
        adEntries.map(({ position, adId }) => screenApi.assignAd(screenIds, position, adId))
      );
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

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">Upload advertisement</h3>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {POSITIONS.map((position) => {
          const slotAds = form.slots[position];
          const isUploading = uploadingSlot === position;
          return (
            <div key={position} className={position === 'STARTUP' ? 'block sm:col-span-2' : 'block'}>
              <span className="label">{POSITION_LABELS[position]}</span>
              <div className="flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2">
                <div className="flex-1 truncate text-sm">
                  {isUploading ? (
                    <span className="text-indigo-500">Uploading…</span>
                  ) : slotAds.length > 0 ? (
                    <span className="text-slate-700">
                      {slotAds.length} ad{slotAds.length === 1 ? '' : 's'}: {slotAds.map((a) => a.title).join(', ')}
                    </span>
                  ) : (
                    <span className="text-slate-400">No advertisement uploaded</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => triggerUpload(position)}
                  disabled={isUploading}
                  className="btn-secondary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {slotAds.length > 0 ? 'Add more' : 'Upload'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">
        Upload several photos or videos per slot to build a rotating playlist — they play one by one and repeat.
      </p>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Assigning...' : 'Upload advertisement'}
      </button>
    </form>
  );
}

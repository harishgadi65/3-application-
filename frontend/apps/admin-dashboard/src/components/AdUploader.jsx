import { useRef, useState } from 'react';
import { adApi } from '../lib/api.js';
import { useToast } from '@smartad/shared-ui';

const MEDIA_TYPES = ['IMAGE', 'VIDEO'];
const POSITIONS = ['TOP', 'BOTTOM', 'LEFT', 'RIGHT'];

const initialForm = {
  title: '',
  mediaType: 'IMAGE',
  position: 'BOTTOM',
  displayOrder: 0,
};

export default function AdUploader({ onUploaded }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', form.title);
      formData.append('mediaType', form.mediaType);
      formData.append('position', form.position);
      formData.append('displayOrder', String(form.displayOrder));

      await adApi.uploadAd(formData);
      toast('Advertisement uploaded', { type: 'success' });

      setForm(initialForm);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploaded?.();
    } catch (err) {
      setError(err.message || 'Upload failed');
      toast(err.message || 'Upload failed', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">
        Upload advertisement
      </h3>

      <div>
        <label className="label" htmlFor="ad-file">
          Media file
        </label>
        <input
          id="ad-file"
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="input"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="ad-title">
          Title
        </label>
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

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="ad-media-type">
            Media type
          </label>
          <select
            id="ad-media-type"
            className="input"
            value={form.mediaType}
            onChange={(e) => updateField('mediaType', e.target.value)}
          >
            {MEDIA_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ad-position">
            Position
          </label>
          <select
            id="ad-position"
            className="input"
            value={form.position}
            onChange={(e) => updateField('position', e.target.value)}
          >
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ad-order">
            Display order
          </label>
          <input
            id="ad-order"
            type="number"
            min={0}
            className="input"
            value={form.displayOrder}
            onChange={(e) => updateField('displayOrder', e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Uploading...' : 'Upload advertisement'}
      </button>
    </form>
  );
}

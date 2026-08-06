import {
  API_BASE_URL,
  WS_URL,
  TV_DISPLAY_URL,
  MOBILE_WEB_URL,
} from '../lib/env.js';
import { copyToClipboard } from '../lib/format.js';
import { useToast } from '@smartad/shared-ui';

const rows = [
  {
    label: 'REST API base URL',
    value: API_BASE_URL,
    hint: 'VITE_API_BASE_URL',
  },
  {
    label: 'WebSocket (STOMP) URL',
    value: WS_URL,
    hint: 'VITE_WS_URL',
  },
  {
    label: 'TV Display app',
    value: TV_DISPLAY_URL,
    hint: 'VITE_TV_DISPLAY_URL',
    link: true,
  },
  {
    label: 'Mobile web app',
    value: MOBILE_WEB_URL,
    hint: 'VITE_MOBILE_WEB_URL',
    link: true,
  },
];

export default function DemoConfigPanel() {
  const toast = useToast();

  async function handleCopy(value) {
    try {
      await copyToClipboard(value);
      toast('Copied to clipboard', { type: 'success' });
    } catch {
      toast('Could not copy to clipboard', { type: 'error' });
    }
  }

  return (
    <div className="card">
      <h3 className="mb-1 text-sm font-semibold text-slate-900">
        Resolved environment
      </h3>
      <p className="mb-4 text-xs text-slate-400">
        Convenience view of the origins this demo is currently pointed at.
        These come from Vite env variables and fall back to the documented
        localhost defaults.
      </p>

      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">
                {row.label}
              </p>
              <p className="truncate font-mono text-xs text-slate-500">
                {row.value}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                {row.hint}
              </p>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              {row.link && (
                <a
                  href={row.value}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  Open
                </a>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleCopy(row.value)}
              >
                Copy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

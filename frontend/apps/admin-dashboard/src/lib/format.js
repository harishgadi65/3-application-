export function formatSeconds(totalSeconds) {
  if (totalSeconds == null) return '--';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

export function phaseBadgeClass(phase) {
  switch (phase) {
    case 'WAITING':
      return 'badge-slate';
    case 'COUNTDOWN':
      return 'badge-amber';
    case 'PLAYING':
      return 'badge-green';
    case 'FINISHED':
      return 'badge-indigo';
    default:
      return 'badge-slate';
  }
}

export async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for older/insecure contexts.
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

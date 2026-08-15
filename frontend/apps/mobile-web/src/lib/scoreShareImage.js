const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1920;

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Shrinks font size until `text` fits within `maxWidth`, down to a floor. */
function fitText(ctx, text, maxWidth, startPx, family, minPx = 28) {
  let size = startPx;
  do {
    ctx.font = `${family.weight || 'bold'} ${size}px ${family.name}`;
    if (ctx.measureText(text).width <= maxWidth || size <= minPx) break;
    size -= 4;
  } while (size > minPx);
  return size;
}

/**
 * Renders a 1080x1920 portrait "share your score" poster on a canvas and
 * resolves with a PNG Blob. No third-party image library - plain Canvas2D.
 * Coupon codes are intentionally never drawn here.
 */
export async function generateSharePoster({
  gameLabel,
  displayName,
  isWinner,
  rank,
  score,
  offerTitle,
}) {
  const canvas = document.createElement('canvas');
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const ctx = canvas.getContext('2d');
  const family = { name: '"Segoe UI", Arial, sans-serif' };
  const centerX = POSTER_WIDTH / 2;

  const bg = ctx.createLinearGradient(0, 0, 0, POSTER_HEIGHT);
  bg.addColorStop(0, '#04140d');
  bg.addColorStop(0.55, '#050a16');
  bg.addColorStop(1, '#03050b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#34d399';
  ctx.font = `bold 36px ${family.name}`;
  ctx.fillText(`SMART PLAY · ${(gameLabel || 'GAME NIGHT').toUpperCase()}`, centerX, 130);

  const trophyBoxSize = 220;
  const trophyGrad = ctx.createLinearGradient(0, 220, 0, 220 + trophyBoxSize);
  trophyGrad.addColorStop(0, '#fcd34d');
  trophyGrad.addColorStop(1, '#d97706');
  ctx.fillStyle = trophyGrad;
  roundedRect(ctx, centerX - trophyBoxSize / 2, 220, trophyBoxSize, trophyBoxSize, 48);
  ctx.fill();
  ctx.font = '120px serif';
  ctx.fillText('🏆', centerX, 220 + trophyBoxSize / 2 + 42);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 92px ${family.name}`;
  ctx.fillText(isWinner ? 'CHAMPION!' : `#${rank || '-'} FINISH`, centerX, 590);

  if (displayName) {
    ctx.fillStyle = '#34d399';
    ctx.font = `italic bold 58px ${family.name}`;
    ctx.fillText(displayName, centerX, 665);
  }

  let cursorY = 760;
  if (offerTitle) {
    const cardW = 880;
    const cardH = 260;
    const cardX = centerX - cardW / 2;
    const rewardGrad = ctx.createLinearGradient(cardX, cursorY, cardX, cursorY + cardH);
    rewardGrad.addColorStop(0, '#fbbf24');
    rewardGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = rewardGrad;
    roundedRect(ctx, cardX, cursorY, cardW, cardH, 36);
    ctx.fill();

    ctx.fillStyle = '#78350f';
    ctx.font = `72px serif`;
    ctx.fillText('🎁', centerX, cursorY + 90);

    ctx.font = `900 28px ${family.name}`;
    ctx.fillText('YOU UNLOCKED A WINNER REWARD', centerX, cursorY + 135);

    const offerSize = fitText(ctx, offerTitle, cardW - 80, 56, { ...family, weight: '900' });
    ctx.font = `900 ${offerSize}px ${family.name}`;
    ctx.fillText(offerTitle, centerX, cursorY + 205);

    ctx.font = `28px ${family.name}`;
    ctx.fillText('Smart Play Rewards', centerX, cursorY + 245);

    cursorY += cardH + 60;
  }

  const statsW = 880;
  const statsH = 190;
  const statsX = centerX - statsW / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundedRect(ctx, statsX, cursorY, statsW, statsH, 32);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  roundedRect(ctx, statsX, cursorY, statsW, statsH, 32);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.moveTo(centerX, cursorY + 24);
  ctx.lineTo(centerX, cursorY + statsH - 24);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = `bold 26px ${family.name}`;
  ctx.fillText('FINAL SCORE', centerX - statsW / 4, cursorY + 62);
  ctx.fillText('FINAL RANK', centerX + statsW / 4, cursorY + 62);

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 76px ${family.name}`;
  ctx.fillText(String(score ?? 0), centerX - statsW / 4, cursorY + 140);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`#${rank || '-'}`, centerX + statsW / 4, cursorY + 140);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = `bold 36px ${family.name}`;
  ctx.fillText('I won. Your turn.', centerX, POSTER_HEIGHT - 140);

  ctx.fillStyle = '#34d399';
  ctx.font = `900 30px ${family.name}`;
  ctx.fillText('SCAN  ·  PLAY  ·  WIN', centerX, POSTER_HEIGHT - 90);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

function posterFile(blob) {
  return new File([blob], 'smart-play-score.png', { type: 'image/png' });
}

function canShareFiles(file) {
  return typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] });
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'smart-play-score.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Native share sheet with the poster file when supported, else a direct download. */
export async function shareScorePoster(blob, { title, text } = {}) {
  const file = posterFile(blob);
  if (canShareFiles(file)) {
    await navigator.share({ files: [file], title, text });
    return 'shared';
  }
  downloadBlob(blob);
  return 'downloaded';
}

export function downloadScorePoster(blob) {
  downloadBlob(blob);
}

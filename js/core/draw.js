// Tiện ích vẽ dùng chung cho các cảnh mô phỏng Canvas 2D.
// Mọi màu lấy từ biến CSS để tự đổi theo chế độ sáng/tối.
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

export function theme() {
  return {
    ink: cssVar('--ink'), muted: cssVar('--muted'), line: cssVar('--line'), card: cssVar('--card'),
    accent: cssVar('--accent'), soft: cssVar('--accent-soft'), ok: cssVar('--ok'), bad: cssVar('--bad'),
    road: cssVar('--road'), car: cssVar('--car'), s2: cssVar('--series2'), s3: cssVar('--series3'),
    grid: cssVar('--grid'), axis: cssVar('--axis'),
  };
}

// Mũi tên vector từ (x1,y1) đến (x2,y2).
export function arrow(ctx, x1, y1, x2, y2, color, width = 2.5, head = 9) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  if (L < 1) return;
  const ux = dx / L, uy = dy / L, h = Math.min(head, L * 0.6);
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * h * 0.7, y2 - uy * h * 0.7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * h - uy * h * 0.45, y2 - uy * h + ux * h * 0.45);
  ctx.lineTo(x2 - ux * h + uy * h * 0.45, y2 - uy * h - ux * h * 0.45);
  ctx.closePath(); ctx.fill(); ctx.restore();
}

// Chữ có căn lề; align: 'left'|'center'|'right'.
export function text(ctx, s, x, y, { color = '#000', size = 13, align = 'left', base = 'alphabetic', bold = false } = {}) {
  ctx.save(); ctx.fillStyle = color; ctx.font = `${bold ? '600 ' : ''}${size}px system-ui, sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = base; ctx.fillText(s, x, y); ctx.restore();
}

// Thước thẳng nằm ngang từ x0 đến x1 (pixel), vạch mỗi `step` đơn vị thực, tỉ lệ pxPerUnit.
export function ruler(ctx, x0, y, pxPerUnit, vmin, vmax, step, th, { unit = '', labelEvery = 1 } = {}) {
  ctx.save(); ctx.strokeStyle = th.axis; ctx.fillStyle = th.muted; ctx.lineWidth = 1;
  ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.beginPath(); ctx.moveTo(x0 + vmin * pxPerUnit, y); ctx.lineTo(x0 + vmax * pxPerUnit, y); ctx.stroke();
  let i = 0;
  for (let v = vmin; v <= vmax + 1e-9; v += step, i++) {
    const X = x0 + v * pxPerUnit, big = i % labelEvery === 0;
    ctx.beginPath(); ctx.moveTo(X, y); ctx.lineTo(X, y + (big ? 8 : 4)); ctx.stroke();
    if (big) ctx.fillText(String(+v.toFixed(6)).replace('.', ','), X, y + 10);
  }
  if (unit) { ctx.textAlign = 'right'; ctx.fillText(unit, x0 + vmax * pxPerUnit, y + 24); }
  ctx.restore();
}

// Mặt đất có gạch chéo.
export function ground(ctx, x0, x1, y, th, depth = 10) {
  ctx.save(); ctx.strokeStyle = th.axis; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  ctx.lineWidth = 1;
  for (let x = x0; x < x1; x += 10) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - depth * 0.7, y + depth); ctx.stroke(); }
  ctx.restore();
}

export function circle(ctx, x, y, r, fill, stroke) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

export function rect(ctx, x, y, w, h, fill, stroke, r = 4) {
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

export function line(ctx, x1, y1, x2, y2, color, width = 1.5, dash = []) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}

// Lò xo dọc theo đoạn (x1,y1)-(x2,y2) với n vòng.
export function spring(ctx, x1, y1, x2, y2, color, n = 10, amp = 8) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1);
  const lead = Math.min(12, L * 0.15);
  ctx.lineTo(x1 + ux * lead, y1 + uy * lead);
  const body = L - 2 * lead;
  for (let i = 0; i < n * 2; i++) {
    const s = lead + (body * (i + 0.5)) / (n * 2), a = i % 2 ? -amp : amp;
    ctx.lineTo(x1 + ux * s + nx * a, y1 + uy * s + ny * a);
  }
  ctx.lineTo(x2 - ux * lead, y2 - uy * lead); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}

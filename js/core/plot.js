// Đồ thị Canvas nhẹ, tự co giãn theo màn hình, dùng chung cho mọi thí nghiệm.
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function niceTicks(min, max, n = 6) {
  const span = max - min || 1;
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const r = raw / mag;
  const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
  const ticks = [];
  for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + 1e-9; v += step) ticks.push(+v.toFixed(10));
  return { ticks, step };
}
export { niceTicks };

export class Plot {
  constructor(canvas, opts = {}) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.o = { xlabel: '', ylabel: '', ...opts };
    this.spec = null;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
  }
  resize() {
    const r = this.c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.w = Math.max(100, r.width);
    this.h = Math.max(80, r.height);
    this.c.width = Math.round(this.w * dpr);
    this.c.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.spec) this.draw(this.spec);
  }
  destroy() { this.ro.disconnect(); }

  // spec = { range:{xmin,xmax,ymin,ymax}, series:[{pts, color, width, dash, mode:'line'|'points'}] }
  draw(spec) {
    this.spec = spec;
    const { ctx, w, h } = this;
    const L = 52, R = 12, T = 10, Bm = 38;
    const { xmin, xmax, ymin, ymax } = spec.range;
    const X = (x) => L + ((x - xmin) / (xmax - xmin)) * (w - L - R);
    const Y = (y) => h - Bm - ((y - ymin) / (ymax - ymin)) * (h - T - Bm);
    const grid = cssVar('--grid'), axis = cssVar('--axis'), ink = cssVar('--muted');
    ctx.clearRect(0, 0, w, h);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = ink; ctx.strokeStyle = grid; ctx.lineWidth = 1;

    const xt = niceTicks(xmin, xmax, Math.max(3, Math.floor((w - L - R) / 70)));
    const yt = niceTicks(ymin, ymax, Math.max(3, Math.floor((h - T - Bm) / 38)));
    const dec = (step) => Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const v of xt.ticks) {
      ctx.beginPath(); ctx.moveTo(X(v), T); ctx.lineTo(X(v), h - Bm); ctx.stroke();
      ctx.fillText(v.toFixed(dec(xt.step)).replace('.', ','), X(v), h - Bm + 4);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const v of yt.ticks) {
      ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(w - R, Y(v)); ctx.stroke();
      ctx.fillText(v.toFixed(dec(yt.step)).replace('.', ',').replace('-', '−'), L - 6, Y(v));
    }
    ctx.strokeStyle = axis; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, h - Bm); ctx.lineTo(w - R, h - Bm); ctx.stroke();
    if (ymin < 0 && ymax > 0) { ctx.beginPath(); ctx.moveTo(L, Y(0)); ctx.lineTo(w - R, Y(0)); ctx.stroke(); }

    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(this.o.xlabel, L + (w - L - R) / 2, h - 2);
    ctx.save(); ctx.translate(13, T + (h - T - Bm) / 2); ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'top'; ctx.fillText(this.o.ylabel, 0, -6); ctx.restore();

    ctx.save(); ctx.beginPath(); ctx.rect(L, T, w - L - R, h - T - Bm); ctx.clip();
    for (const s of spec.series) {
      if (!s.pts || !s.pts.length) continue;
      ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = s.width || 2;
      ctx.setLineDash(s.dash || []);
      if (s.mode === 'points') {
        ctx.setLineDash([]);
        for (const [x, y] of s.pts) { ctx.beginPath(); ctx.arc(X(x), Y(y), s.r || 4.5, 0, 6.2832); ctx.fill(); }
      } else {
        ctx.beginPath();
        s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
        ctx.stroke();
      }
    }
    ctx.restore(); ctx.setLineDash([]);
  }
}

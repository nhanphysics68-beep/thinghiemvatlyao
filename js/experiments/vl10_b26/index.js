// Vật lí 10 – Bài 26: Cơ năng và định luật bảo toàn cơ năng.
// Ba bố trí: con lắc đơn, trượt dốc không ma sát, trượt dốc có ma sát. Đo h, v tại nhiều vị trí; tính Wđ, Wt, W.
import { mountLab } from '../../core/lab.js';
import { fmt, linearFit } from '../../core/stats.js';
import { arrow, text, rect, line, circle } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
export const G = 9.8;
const rad = (a) => (a * Math.PI) / 180;

// Con lắc đơn: tích phân số RK4 phương trình θ'' = −(g/L) sinθ (không xấp xỉ góc nhỏ). Có nhớ đệm theo (L, θ₀).
let cache = { key: '' };
function pendTable(p) {
  const key = p.L + '|' + p.th0;
  if (cache.key === key) return cache;
  const dt = 0.001, k = G / p.L, f = (th, om) => [om, -k * Math.sin(th)];
  const th = [rad(p.th0)], om = [0];
  let tq = null, i = 0;
  for (;;) {
    const a = th[i], b = om[i];
    const [k1a, k1b] = f(a, b), [k2a, k2b] = f(a + 0.5 * dt * k1a, b + 0.5 * dt * k1b);
    const [k3a, k3b] = f(a + 0.5 * dt * k2a, b + 0.5 * dt * k2b), [k4a, k4b] = f(a + dt * k3a, b + dt * k3b);
    th.push(a + (dt / 6) * (k1a + 2 * k2a + 2 * k3a + k4a)); om.push(b + (dt / 6) * (k1b + 2 * k2b + 2 * k3b + k4b)); i++;
    if (tq === null && th[i] <= 0) tq = (i - 1) * dt + (dt * th[i - 1]) / (th[i - 1] - th[i]);   // thời điểm đầu tiên qua vị trí cân bằng = T/4
    if (tq !== null && i * dt >= 6 * tq + dt) break;
  }
  cache = { key, dt, th, om, period: 4 * tq, dur: 6 * tq };
  return cache;
}

export const phys = {
  G, pendTable,
  mu: (p) => (p.mode === 'fric' ? p.mu : 0),
  c: (p) => (p.mode === 'fric' ? 1 - p.mu / Math.tan(rad(p.ang)) : 1),                          // c = 1 − μ·cotθ (hệ số trượt dốc)
  Hmax: (p) => (p.mode === 'pend' ? p.L * (1 - Math.cos(rad(p.th0))) : p.H),   // độ cao ban đầu so với điểm thấp nhất
  E0: (p) => p.m * G * phys.Hmax(p),
  slideA: (p) => G * (Math.sin(rad(p.ang)) - phys.mu(p) * Math.cos(rad(p.ang))),
  slideLen: (p) => p.H / Math.sin(rad(p.ang)),
  period: (p) => pendTable(p).period,
  duration: (p) => (p.mode === 'pend' ? pendTable(p).dur : Math.sqrt((2 * phys.slideLen(p)) / phys.slideA(p))),
  // Trạng thái tại t. W = Wđ + Wt (cơ năng), Q = nhiệt toả ra do ma sát (chỉ có ở trượt dốc có ma sát)
  at(p, t) {
    let h, v, extra = {};
    if (p.mode === 'pend') {
      const tb = pendTable(p), x = Math.min(Math.max(t, 0) / tb.dt, tb.th.length - 2), i = Math.floor(x), fr = x - i;
      const th = tb.th[i] * (1 - fr) + tb.th[i + 1] * fr, om = tb.om[i] * (1 - fr) + tb.om[i + 1] * fr;
      h = p.L * (1 - Math.cos(th)); v = Math.abs(p.L * om); extra = { th, om };
    } else {
      const a = phys.slideA(p), tt = Math.min(t, phys.duration(p)), s = 0.5 * a * tt * tt;
      h = p.H - s * Math.sin(rad(p.ang)); v = a * tt; extra = { s };
    }
    const Wd = 0.5 * p.m * v * v, Wt = p.m * G * h, W = Wd + Wt;
    return { h, v, Wd, Wt, W, Q: Math.max(0, phys.E0(p) - W), ...extra };
  },
  // Đường lí thuyết theo độ cao h
  WdOfH: (p, h) => p.m * G * phys.c(p) * (phys.Hmax(p) - h),
  WOfH: (p, h) => p.m * G * h + phys.WdOfH(p, h),
};
const sorted = (rows) => [...rows].sort((a, b) => a.t - b.t);

export const spec = {
  seed: 2626,
  intro: 'Thả con lắc hoặc vật trượt trên mặt phẳng nghiêng, em đo độ cao h và tốc độ v ở nhiều vị trí để tính động năng, thế năng, cơ năng. Em so sánh khi không có ma sát và khi có ma sát.',
  goals: [
    'Phát biểu và vận dụng định luật bảo toàn cơ năng: W = Wđ + Wt = hằng số khi chỉ có lực thế (trọng lực, lực đàn hồi) sinh công.',
    'Xác định g từ đồ thị Wđ – h khi bảo toàn cơ năng.',
    'Nhận biết khi có ma sát, cơ năng giảm và phần giảm chuyển thành nhiệt.',
  ],
  theory: 'Cơ năng: <b>W = Wđ + Wt = ½mv² + mgh</b> (g = 9,8 m/s²)<br>' +
    'Chỉ có trọng lực sinh công: <b>W = hằng số</b>, tức mgh₁ + ½mv₁² = mgh₂ + ½mv₂².<br>' +
    'Có lực ma sát: W giảm; độ giảm cơ năng bằng độ lớn công của lực ma sát: ΔW = −|A_ms| = −Q.',
  setup: 'Chọn bố trí thí nghiệm. Gốc thế năng ở điểm thấp nhất (h = 0). Kéo thanh t rồi bấm “Ghi số liệu” ở nhiều vị trí. Đổi bố trí hoặc thông số thì bảng số liệu tự xoá.',
  choices: [{ k: 'mode', label: 'Bố trí thí nghiệm', string: true, options: [['pend', 'Con lắc đơn'], ['slide', 'Trượt dốc không ma sát'], ['fric', 'Trượt dốc có ma sát']], def: 'pend' }],
  params: [
    { k: 'm', label: 'Khối lượng m', unit: 'kg', min: 0.2, max: 2, step: 0.1, def: 0.5, dec: 1 },
    { k: 'L', label: 'Chiều dài dây L', unit: 'm', min: 0.5, max: 2, step: 0.1, def: 1, dec: 1, show: (p) => p.mode === 'pend' },
    { k: 'th0', label: 'Góc lệch ban đầu', unit: '°', min: 10, max: 80, step: 5, def: 50, dec: 0, show: (p) => p.mode === 'pend' },
    { k: 'H', label: 'Độ cao ban đầu H', unit: 'm', min: 0.5, max: 3, step: 0.1, def: 1.5, dec: 1, show: (p) => p.mode !== 'pend' },
    { k: 'ang', label: 'Góc nghiêng của dốc', unit: '°', min: 20, max: 50, step: 5, def: 30, dec: 0, show: (p) => p.mode !== 'pend' },
    { k: 'mu', label: 'Hệ số ma sát μ', unit: '', min: 0.05, max: 0.3, step: 0.05, def: 0.2, dec: 2, show: (p) => p.mode === 'fric' },
  ],
  clearOnParam: ['m', 'L', 'th0', 'H', 'ang', 'mu'],
  toggles: [{ k: 'vec', label: 'Hiện vector vận tốc', def: true }],
  stageHeight: 270,
  ariaLabel: 'Con lắc đơn hoặc vật trượt trên mặt phẳng nghiêng, kèm biểu đồ cột động năng, thế năng, cơ năng và nhiệt toả ra',
  duration: (p) => phys.duration(p),
  state: (p, t) => phys.at(p, t),
  readouts: (p, s) => [['h', fmt(s.h, 2) + ' m'], ['v', fmt(s.v, 2) + ' m/s'], ['Wđ', fmt(s.Wd, 2) + ' J'], ['Wt', fmt(s.Wt, 2) + ' J'], ['W', fmt(s.W, 2) + ' J']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const xb = w >= 500 ? w * 0.6 : w * 0.5, S = xb - 10, E = phys.E0(p), vm = Math.sqrt((2 * E) / p.m);
    const vlen = (v) => (v / vm) * 44;
    text(ctx, `h = ${fmt(s.h, 2)} m`, 12, 18, { color: th.ink, size: 12 });
    if (p.mode === 'pend') {
      const px = S / 2, py = 40, Lpx = Math.min(h - 84, (S / 2 - 18) / Math.max(Math.sin(rad(p.th0)), 0.45));
      const yl = py + Lpx;                                                    // mức thấp nhất (h = 0)
      const bx = px + Lpx * Math.sin(s.th), by = py + Lpx * Math.cos(s.th);
      line(ctx, px - 24, py, px + 24, py, th.axis, 3);
      line(ctx, 8, yl + 12, S, yl + 12, th.muted, 1, [4, 3]);
      text(ctx, 'h = 0', 10, yl + 26, { color: th.muted, size: 11 });
      line(ctx, 8, by, bx, by, th.muted, 1, [3, 3]);
      line(ctx, px, py, bx, by, th.ink, 1.8);
      circle(ctx, bx, by, 10, th.car, null);
      if (tg.vec && s.v > 0.03) {
        const sg = Math.sign(s.om) || 1, d = [Math.cos(s.th) * sg, -Math.sin(s.th) * sg];
        arrow(ctx, bx, by, bx + d[0] * vlen(s.v), by + d[1] * vlen(s.v), th.ok, 3);
      }
    } else {
      const yg = h - 40, ang = rad(p.ang), x0 = 18, sc = Math.min((S - x0 - 14) / (p.H / Math.tan(ang)), (yg - 38) / p.H);
      const top = [x0, yg - p.H * sc], bot = [x0 + (p.H / Math.tan(ang)) * sc, yg];
      ctx.save(); ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(bot[0], bot[1]); ctx.lineTo(top[0], bot[1]); ctx.closePath();
      ctx.fillStyle = th.road; ctx.fill(); ctx.strokeStyle = th.axis; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      line(ctx, 8, yg, S, yg, th.axis, 2);
      const pos = [top[0] + s.s * sc * Math.cos(ang), top[1] + s.s * sc * Math.sin(ang)];
      const bw = 26, bh = 16, cx = pos[0] + Math.sin(ang) * (bh / 2), cy = pos[1] - Math.cos(ang) * (bh / 2);
      line(ctx, 8, cy, cx, cy, th.muted, 1, [3, 3]);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); rect(ctx, -bw / 2, -bh / 2, bw, bh, th.car, null, 3); ctx.restore();
      if (tg.vec && s.v > 0.03) arrow(ctx, cx, cy, cx + Math.cos(ang) * vlen(s.v), cy + Math.sin(ang) * vlen(s.v), th.ok, 3);
      text(ctx, 'góc nghiêng ' + fmt(p.ang, 0) + '°', bot[0], yg + 18, { color: th.muted, size: 11, align: 'right' });
    }
    // biểu đồ cột
    const fr = p.mode === 'fric', names = fr ? ['Wt', 'Wđ', 'W', 'Q'] : ['Wt', 'Wđ', 'W'];
    const vals = fr ? [s.Wt, s.Wd, s.W, s.Q] : [s.Wt, s.Wd, s.W], cols = [th.s2, th.car, th.accent, th.bad];
    const yb = h - 40, ytop = 38, base = yb - ytop, dd = E >= 10 ? 1 : 2;
    line(ctx, xb - 4, ytop - 6, xb - 4, h - 8, th.line, 1);
    text(ctx, 'Năng lượng (J)', (xb + w) / 2, 18, { color: th.muted, size: 11, align: 'center' });
    line(ctx, xb + 2, yb, w - 6, yb, th.axis, 1.5);
    const cw = (w - 6 - xb) / names.length, bwd = Math.min(32, cw - 8);
    names.forEach((nm, i) => {
      const cx = xb + cw * (i + 0.5), bh2 = Math.max(0, Math.min(1.05, vals[i] / E)) * base;
      rect(ctx, cx - bwd / 2, yb - bh2, bwd, bh2, cols[i], null, 3);
      text(ctx, nm, cx, yb + 14, { color: th.ink, size: 11, align: 'center', bold: true });
      text(ctx, fmt(vals[i], dd), cx, yb + 28, { color: th.ink, size: 11, align: 'center' });
    });
    line(ctx, xb + 2, yb - base, w - 6, yb - base, th.muted, 1, [4, 3]);
  },
  columns: [
    { k: 't', label: 't', unit: 's', dec: 2 }, { k: 'h', label: 'h', unit: 'm', dec: 2 }, { k: 'v', label: 'v', unit: 'm/s', dec: 2 },
    { k: 'Wd', label: 'Wđ', unit: 'J', dec: 3 }, { k: 'Wt', label: 'Wt', unit: 'J', dec: 3 }, { k: 'W', label: 'W', unit: 'J', dec: 3 },
  ],
  recordLabel: 'Ghi số liệu (t, h, v)',
  note: 'Mỗi lần ghi: thước đo độ cao chia 1 cm, cổng quang đo v với sai số khoảng 0,3%. Các cột Wđ = ½mv², Wt = mgh, W = Wđ + Wt được tính từ h và v trong bảng.',
  record(p, s, t, n) {
    const hh = Math.max(0, n.round(s.h + n.noise(0.005), 0.01)), v = Math.max(0, n.round(s.v + n.noise(0.01 + 0.003 * s.v), 0.01));
    const Wd = n.round(0.5 * p.m * v * v, 0.001), Wt = n.round(p.m * G * hh, 0.001);
    return { t: n.round(t + n.noise(0.01), 0.01), h: hh, v, Wd, Wt, W: n.round(Wd + Wt, 0.001) };
  },
  graphs: [
    { title: 'Đồ thị W – h (cơ năng theo độ cao)', xlabel: 'h (m)', ylabel: 'W (J)', x: 'h', y: 'W',
      curve: (p) => [[0, phys.WOfH(p, 0)], [phys.Hmax(p), phys.WOfH(p, phys.Hmax(p))]], marker: (p, s) => [s.h, s.W], zeroX: true, zeroY: true },
    { title: 'Đồ thị Wđ – h', xlabel: 'h (m)', ylabel: 'Wđ (J)', x: 'h', y: 'Wd', fit: true, dec: 2,
      curve: (p) => [[0, phys.WdOfH(p, 0)], [phys.Hmax(p), 0]], marker: (p, s) => [s.h, s.Wd], zeroX: true, zeroY: true },
  ],
  predict: {
    prompt: '<p>Vật được thả không vận tốc ở độ cao lớn nhất. Hãy dự đoán <b>tốc độ</b> và <b>động năng</b> khi vật tới vị trí thấp nhất (h = 0). Lấy g = 9,8 m/s².</p>',
    fields: [{ k: 'v', label: 'Tốc độ v', unit: 'm/s' }, { k: 'Wd', label: 'Động năng Wđ', unit: 'J' }],
    expected: (p) => ({ v: Math.sqrt((2 * phys.WdOfH(p, 0)) / p.m), Wd: phys.WdOfH(p, 0) }), tol: 0.02, absTol: 0.03,
    explain: (p) => (p.mode === 'fric'
      ? `Có ma sát: Wđ(cuối) = mgH − Q = ${fmt(phys.E0(p), 2)} − ${fmt(phys.E0(p) - phys.WdOfH(p, 0), 2)} = ${fmt(phys.WdOfH(p, 0), 2)} J, nhỏ hơn mgH.`
      : `Bảo toàn cơ năng: ½mv² = mgH = ${fmt(phys.E0(p), 2)} J nên v = √(2gH) = ${fmt(Math.sqrt(2 * G * phys.Hmax(p)), 2)} m/s.`),
  },
  tasks: [
    {
      title: 'Xử lí số liệu: xác định g từ đồ thị Wđ – h',
      prompt: '<p>Ghi ít nhất 5 lần đo ở các độ cao khác nhau. Nếu cơ năng bảo toàn thì Wđ = mg(H − h), đồ thị Wđ – h là đường thẳng có <b>hệ số góc −mg</b>. Đọc hệ số góc ở chú thích dưới đồ thị, lấy độ lớn rồi chia cho m (đã chọn ở thanh trượt) để được gia tốc g′. Khi có ma sát, g′ nhỏ hơn 9,8.</p>',
      fields: [{ k: 'F', label: '|hệ số góc| = mg′', unit: 'N', dec: 2, absTol: 0.1 }, { k: 'g', label: 'g′ = |hệ số góc| / m', unit: 'm/s²', dec: 2, absTol: 0.1 }],
      minRows: 5, tol: 0.03,
      expected: (p, rows) => { const f = linearFit(rows.map((r) => [r.h, r.Wd])); return { F: -f.slope, g: -f.slope / p.m }; },
      explain: (p, rows, e) => (p.mode === 'fric' ? `Có ma sát nên g′ = g(1 − μ·cotα) ≈ ${fmt(e.g, 2)} m/s² < 9,8 m/s²: một phần cơ năng biến thành nhiệt.` : `g′ ≈ ${fmt(e.g, 2)} m/s², gần 9,8 m/s²: cơ năng bảo toàn.`),
      reference: (p) => `Giá trị chuẩn trong mô phỏng: g′ = ${fmt(G * phys.c(p), 2)} m/s².`,
    },
    {
      title: 'Cơ năng có bảo toàn không?',
      prompt: '<p>Chọn lần ghi có t <b>nhỏ nhất</b> và lần ghi có t <b>lớn nhất</b> trong bảng. Đọc cơ năng ban đầu W₁ (lần đầu) và tính độ giảm cơ năng ΔW = W(đầu) − W(cuối) bằng cột W. Nếu ΔW ≈ 0 thì cơ năng bảo toàn.</p>',
      fields: [{ k: 'W1', label: 'W(đầu)', unit: 'J', dec: 3, absTol: 0.03 }, { k: 'dW', label: 'ΔW = W(đầu) − W(cuối)', unit: 'J', dec: 3, absTol: 0.03 }],
      minRows: 2, tol: 0.03,
      need: (rows) => { if (rows.length < 2) return 'Cần ghi ít nhất 2 lần đo.'; const r = sorted(rows); return r[r.length - 1].t - r[0].t < 0.2 * Math.max(r[r.length - 1].t, 0.01) ? 'Hãy ghi hai lần đo cách xa nhau về thời gian.' : null; },
      expected: (p, rows) => { const r = sorted(rows), a = r[0], b = r[r.length - 1]; return { W1: a.W, dW: a.W - b.W }; },
      explain: (p, rows, e) => (p.mode === 'fric' ? `ΔW = ${fmt(e.dW, 3)} J &gt; 0: cơ năng giảm, đó là nhiệt Q do ma sát toả ra.` : `ΔW = ${fmt(e.dW, 3)} J rất nhỏ so với W: trong sai số đo, cơ năng bảo toàn.`),
    },
  ],
  quiz: [
    { q: 'Con lắc đơn dao động (bỏ qua ma sát). Khi con lắc đi từ biên xuống vị trí cân bằng:', o: ['động năng giảm, thế năng tăng', 'động năng tăng, thế năng giảm, cơ năng không đổi', 'cả động năng và thế năng đều tăng'], a: 1, why: 'Thế năng chuyển hoá dần thành động năng, tổng W = Wđ + Wt không đổi.' },
    { q: 'Vật trượt không ma sát, thả không vận tốc ở độ cao 0,8 m. Tốc độ ở chân dốc (g = 9,8 m/s²) là:', o: ['2,8 m/s', '4,0 m/s', '8,0 m/s'], a: 1, why: 'v = √(2gh) = √(2·9,8·0,8) = √15,68 ≈ 4,0 m/s.' },
    { q: 'Vật 2 kg thả từ độ cao 5 m (bỏ qua ma sát). Khi vật ở độ cao 2 m, động năng là:', o: ['39,2 J', '58,8 J', '98 J'], a: 1, why: 'W = 2·9,8·5 = 98 J; Wt = 2·9,8·2 = 39,2 J nên Wđ = 98 − 39,2 = 58,8 J.' },
    { q: 'Khi vật trượt có ma sát thì cơ năng của vật:', o: ['không đổi', 'giảm, phần giảm chuyển thành nhiệt', 'tăng'], a: 1, why: 'Lực ma sát sinh công cản; độ giảm cơ năng bằng độ lớn công đó và chuyển thành nhiệt năng.' },
    { q: 'Vật 1 kg trượt từ độ cao 2 m xuống chân dốc, tốc độ tại chân dốc là 5 m/s. Nhiệt toả ra do ma sát là:', o: ['7,1 J', '12,5 J', '19,6 J'], a: 0, why: 'Q = mgh − ½mv² = 19,6 − 12,5 = 7,1 J.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

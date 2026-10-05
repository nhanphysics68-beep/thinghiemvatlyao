// Vật lí 10 – Bài 25: Động năng, thế năng.
// Hai thí nghiệm: (1) vật rơi tự do – thế năng trọng trường chuyển thành động năng; (2) vật gắn với lò xo nằm ngang – thế năng đàn hồi và động năng.
import { mountLab } from '../../core/lab.js';
import { fmt, linearFit } from '../../core/stats.js';
import { niceTicks } from '../../core/plot.js';
import { arrow, text, rect, circle, line, spring } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
export const G = 9.8;
export const phys = {
  G,
  omega: (p) => Math.sqrt(p.k / p.m),
  tFall: (p) => Math.sqrt((2 * p.H) / G),
  duration: (p) => (p.mode === 'spring' ? (1.5 * 2 * Math.PI) / phys.omega(p) : phys.tFall(p)),   // rơi tới đất / một chu kì rưỡi dao động
  Wd: (m, v) => 0.5 * m * v * v,
  WtG: (m, h) => m * G * h,
  WtK: (k, x) => 0.5 * k * x * x,
  E: (p) => (p.mode === 'spring' ? phys.WtK(p.k, p.x0) : phys.WtG(p.m, p.H)),
  vmax: (p) => (p.mode === 'spring' ? p.x0 * phys.omega(p) : Math.sqrt(2 * G * p.H)),
  // Trạng thái tại thời điểm t
  at(p, t) {
    if (p.mode === 'spring') {
      const w = phys.omega(p), x = -p.x0 * Math.cos(w * t), vs = p.x0 * w * Math.sin(w * t);   // x < 0: lò xo bị nén
      return { q: Math.abs(x), x, vs, v: Math.abs(vs), Wd: phys.Wd(p.m, vs), Wt: phys.WtK(p.k, x) };
    }
    const tt = Math.min(t, phys.tFall(p)), v = G * tt, h = p.H - 0.5 * G * tt * tt;
    return { q: Math.max(0, h), x: 0, vs: v, v, Wd: phys.Wd(p.m, v), Wt: phys.WtG(p.m, Math.max(0, h)) };
  },
};

const sorted = (rows) => [...rows].sort((a, b) => a.t - b.t);

export const spec = {
  seed: 2525,
  intro: 'Em quan sát hai hiện tượng: vật rơi từ độ cao H xuống đất, và vật gắn với lò xo bị nén rồi bật ra. Em ghi vận tốc và vị trí để tính động năng, thế năng ở nhiều thời điểm.',
  goals: [
    'Tính được động năng Wđ = ½mv² và thế năng trọng trường Wt = mgh (chọn gốc thế năng tại mặt đất).',
    'Nhận ra khi vật chuyển động, động năng và thế năng biến đổi, tổng của chúng không đổi (trong thí nghiệm này).',
    'Vận dụng định lí động năng: công của lực bằng độ biến thiên động năng.',
  ],
  theory: 'Động năng: <b>Wđ = ½·m·v²</b> &nbsp;|&nbsp; Thế năng trọng trường: <b>Wt = m·g·h</b> (g = 9,8 m/s²)<br>' +
    'Thế năng đàn hồi của lò xo: <b>Wt = ½·k·x²</b><br>' +
    'Định lí động năng: <b>A = Wđ₂ − Wđ₁</b> (công của lực tác dụng bằng độ biến thiên động năng).',
  setup: 'Chọn “Vật rơi từ độ cao H” hoặc “Lò xo nén rồi bật ra” ở ô “Bố trí thí nghiệm”. Vật rơi không có lực cản; lò xo nằm ngang, bỏ qua ma sát, lúc đầu bị nén đoạn x₀ (x < 0 là nén, x > 0 là giãn). Bấm “Ghi số liệu” ở nhiều thời điểm khác nhau.',
  choices: [{ k: 'mode', label: 'Bố trí thí nghiệm', string: true, options: [['fall', 'Vật rơi từ độ cao H'], ['spring', 'Lò xo nén rồi bật ra']], def: 'fall' }],
  params: [
    { k: 'm', label: 'Khối lượng vật m', unit: 'kg', min: 0.5, max: 2, step: 0.1, def: 1, dec: 1 },
    { k: 'H', label: 'Độ cao ban đầu H', unit: 'm', min: 2, max: 20, step: 1, def: 8, dec: 0, show: (p) => p.mode === 'fall' },
    { k: 'k', label: 'Độ cứng lò xo k', unit: 'N/m', min: 20, max: 80, step: 5, def: 50, dec: 0, show: (p) => p.mode === 'spring' },
    { k: 'x0', label: 'Độ nén ban đầu x₀', unit: 'm', min: 0.05, max: 0.25, step: 0.01, def: 0.15, dec: 2, show: (p) => p.mode === 'spring' },
  ],
  toggles: [{ k: 'vec', label: 'Hiện vector vận tốc', def: true }],
  stageHeight: 260,
  ariaLabel: 'Cảnh vật rơi có thước độ cao hoặc vật gắn lò xo nằm ngang, kèm biểu đồ cột động năng, thế năng và tổng',
  duration: (p) => phys.duration(p),
  state: (p, t) => phys.at(p, t),
  readouts: (p, s) => [[p.mode === 'spring' ? '|x|' : 'h', fmt(s.q, 2) + ' m'], ['v', fmt(s.v, 2) + ' m/s'], ['Wđ', fmt(s.Wd, 2) + ' J'], ['Wt', fmt(s.Wt, 2) + ' J']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const xb = w >= 500 ? w * 0.62 : w * 0.5, S = xb - 10;          // vùng cảnh [0, S], vùng cột năng lượng [xb, w]
    const E = phys.E(p), vm = phys.vmax(p);
    const vlen = (v) => (v / vm) * 52;
    if (p.mode === 'fall') {
      const yg = h - 40, top = 30, r = 10, ppm = (yg - top - 2 * r) / p.H, rx = 36;
      line(ctx, rx, yg, rx, yg - p.H * ppm, th.axis, 1);
      const { ticks } = niceTicks(0, p.H, 5);
      for (const v of ticks) { const y = yg - v * ppm; line(ctx, rx - 4, y, rx + 4, y, th.axis, 1); text(ctx, String(v).replace('.', ','), rx - 7, y + 4, { color: th.muted, size: 11, align: 'right' }); }
      text(ctx, `h = ${fmt(s.q, 2)} m`, 12, 18, { color: th.ink, size: 12 });
      line(ctx, rx + 8, yg, S, yg, th.axis, 2);
      const bx = rx + (S - rx) / 2 + 8, by = yg - s.q * ppm - r;
      line(ctx, rx, by + r, bx - r, by + r, th.muted, 1, [3, 3]);
      circle(ctx, bx, by, r, th.car, null);
      if (tg.vec && s.v > 0.05) { arrow(ctx, bx, by + r + 2, bx, by + r + 2 + vlen(s.v), th.ok, 3); text(ctx, 'v', bx + 8, by + r + 2 + vlen(s.v) * 0.6, { color: th.ok, size: 12, bold: true }); }
    } else {
      const yg = Math.round(h * 0.66), bwd = 32, bhh = 28, xw = 16, Ln = S * 0.4;
      const ppm = (S - xw - Ln - bwd - 8) / 0.25, xn = xw + Ln;
      line(ctx, 8, yg, S, yg, th.axis, 2);
      line(ctx, xw, yg - 62, xw, yg, th.axis, 3);
      for (let y = yg - 60; y < yg; y += 10) line(ctx, xw, y, xw - 7, y + 8, th.axis, 1);
      const bx = xn + s.x * ppm;                                      // mép trái vật
      spring(ctx, xw, yg - bhh / 2, bx, yg - bhh / 2, th.s3, 8, 8);
      rect(ctx, bx, yg - bhh, bwd, bhh, th.car, null, 5);
      line(ctx, xn, yg - 66, xn, yg + 12, th.muted, 1, [4, 3]);
      text(ctx, 'x = 0', xn, yg + 26, { color: th.muted, size: 11, align: 'center' });
      text(ctx, `x = ${fmt(s.x, 2)} m ${s.x < -0.002 ? '(nén)' : s.x > 0.002 ? '(giãn)' : ''}`, 12, 22, { color: th.ink, size: 12 });
      if (tg.vec && s.v > 0.02) { const L = vlen(s.v) * Math.sign(s.vs); arrow(ctx, bx + bwd / 2, yg - bhh - 10, bx + bwd / 2 + L, yg - bhh - 10, th.ok, 3); text(ctx, 'v', bx + bwd / 2 + L + (L > 0 ? 6 : -6), yg - bhh - 14, { color: th.ok, size: 12, bold: true, align: L > 0 ? 'left' : 'right' }); }
    }
    // biểu đồ cột năng lượng
    const yb = h - 40, ytop = 38, base = (yb - ytop), dd = E >= 10 ? 1 : E >= 1 ? 2 : 3;
    line(ctx, xb - 4, ytop - 6, xb - 4, h - 8, th.line, 1);
    text(ctx, 'Năng lượng (J)', (xb + w) / 2, 18, { color: th.muted, size: 11, align: 'center' });
    line(ctx, xb + 2, yb, w - 6, yb, th.axis, 1.5);
    const cw = (w - 6 - xb) / 3, bw = Math.min(34, cw - 10);
    [['Wt', s.Wt, th.s2], ['Wđ', s.Wd, th.car], ['Wđ+Wt', s.Wd + s.Wt, th.accent]].forEach(([nm, val, col], i) => {
      const cx = xb + cw * (i + 0.5), bh2 = Math.max(0, Math.min(1.05, val / E)) * base;
      rect(ctx, cx - bw / 2, yb - bh2, bw, bh2, col, null, 3);
      text(ctx, nm, cx, yb + 14, { color: th.ink, size: 11, align: 'center', bold: true });
      text(ctx, fmt(val, dd), cx, yb + 28, { color: th.ink, size: 11, align: 'center' });
    });
    line(ctx, xb + 2, yb - base, w - 6, yb - base, th.muted, 1, [4, 3]);
  },
  columns: [
    { k: 't', label: 't', unit: 's', dec: 2 }, { k: 'q', label: 'h (hoặc |x|)', unit: 'm', dec: 3 }, { k: 'v', label: 'v', unit: 'm/s', dec: 2 },
    { k: 'Wd', label: 'Wđ', unit: 'J', dec: 3 }, { k: 'Wt', label: 'Wt', unit: 'J', dec: 3 },
  ],
  recordLabel: 'Ghi số liệu (t, h hoặc |x|, v)',
  note: 'Cột Wđ = ½mv² và Wt = mgh (hoặc ½kx²) được tính từ các giá trị v, h (hoặc |x|) đã làm tròn trong bảng. Thước chia 1 cm (vật rơi) hoặc 1 mm (lò xo), cổng quang đo v với sai số khoảng 0,3%.',
  record(p, s, t, n) {
    const sp = p.mode === 'spring', q = Math.max(0, n.round(s.q + n.noise(sp ? 0.001 : 0.005), sp ? 0.001 : 0.01)), v = Math.max(0, n.round(s.v + n.noise(0.01 + 0.003 * s.v), 0.01));
    return {
      t: n.round(t + n.noise(0.01), 0.01), q, v,
      Wd: n.round(phys.Wd(p.m, v), 0.001), Wt: n.round(p.mode === 'spring' ? phys.WtK(p.k, q) : phys.WtG(p.m, q), 0.001),
    };
  },
  graphs: [
    { title: 'Đồ thị Wđ – Wt', xlabel: 'Wt (J)', ylabel: 'Wđ (J)', x: 'Wt', y: 'Wd', fit: true, dec: 3,
      curve: (p) => { const E = phys.E(p); return [[0, E], [E, 0]]; }, marker: (p, s) => [s.Wt, s.Wd], zeroX: true, zeroY: true },
    { title: 'Đồ thị Wđ – t', xlabel: 't (s)', ylabel: 'Wđ (J)', x: 't', y: 'Wd',
      curve: (p) => { const T = phys.duration(p); return Array.from({ length: 61 }, (_, i) => [(T * i) / 60, phys.at(p, (T * i) / 60).Wd]); }, marker: (p, s, t) => [t, s.Wd], zeroX: true, zeroY: true },
  ],
  predict: {
    prompt: '<p>Hãy dự đoán <b>động năng cực đại</b> và <b>tốc độ cực đại</b> của vật: khi chạm đất (vật rơi) hoặc khi lò xo qua vị trí không biến dạng (lò xo). Lấy g = 9,8 m/s².</p>',
    fields: [{ k: 'Wd', label: 'Wđ cực đại', unit: 'J' }, { k: 'v', label: 'v cực đại', unit: 'm/s' }],
    expected: (p) => ({ Wd: phys.E(p), v: phys.vmax(p) }), tol: 0.02, absTol: 0.02,
    explain: (p) => (p.mode === 'spring'
      ? `Thế năng đàn hồi ban đầu ½kx₀² = ${fmt(phys.E(p), 3)} J chuyển hết thành động năng; v = √(2Wđ/m) = ${fmt(phys.vmax(p), 2)} m/s.`
      : `Wđ = mgH = ${fmt(phys.E(p), 2)} J; v = √(2gH) = ${fmt(phys.vmax(p), 2)} m/s.`),
  },
  tasks: [
    {
      title: 'Xử lí số liệu: tổng Wđ + Wt không đổi',
      prompt: '<p>Ghi ít nhất 5 lần đo ở các thời điểm khác nhau. Đồ thị Wđ – Wt gần như là đường thẳng: Wđ = −1·Wt + E. Đọc <b>hệ số góc</b> và <b>tung độ gốc E</b> (tổng Wđ + Wt) ở chú thích dưới đồ thị.</p>',
      fields: [{ k: 'slope', label: 'Hệ số góc', unit: '', dec: 3, absTol: 0.03 }, { k: 'E', label: 'Tổng E = Wđ + Wt', unit: 'J', dec: 3, absTol: 0.02 }],
      minRows: 5, tol: 0.03,
      expected: (p, rows) => { const f = linearFit(rows.map((r) => [r.Wt, r.Wd])); return { slope: f.slope, E: f.intercept }; },
      explain: (p, rows, e) => `Hệ số góc ≈ ${fmt(e.slope, 3)} (gần −1) nghĩa là Wđ tăng bao nhiêu thì Wt giảm bấy nhiêu; E ≈ ${fmt(e.E, 3)} J là năng lượng được bảo toàn.`,
      reference: (p) => `Giá trị chuẩn trong mô phỏng: E = ${fmt(phys.E(p), 3)} J.`,
    },
    {
      title: 'Định lí động năng',
      prompt: '<p>Chọn lần ghi có t <b>nhỏ nhất</b> (lần đầu) và lần ghi có t <b>lớn nhất</b> (lần cuối) trong bảng. Tính độ biến thiên động năng ΔWđ = Wđ(cuối) − Wđ(đầu) và công của lực thế (trọng lực hoặc lực đàn hồi) A = Wt(đầu) − Wt(cuối). Hai kết quả có bằng nhau không?</p>',
      fields: [{ k: 'dWd', label: 'ΔWđ', unit: 'J', dec: 3, absTol: 0.02 }, { k: 'A', label: 'A = Wt(đầu) − Wt(cuối)', unit: 'J', dec: 3, absTol: 0.02 }],
      minRows: 2, tol: 0.03,
      need: (rows) => { if (rows.length < 2) return 'Cần ghi ít nhất 2 lần đo.'; const r = sorted(rows); return r[r.length - 1].t - r[0].t < 0.2 * Math.max(r[r.length - 1].t, 0.01) ? 'Hãy ghi hai lần đo cách xa nhau về thời gian.' : null; },
      expected: (p, rows) => { const r = sorted(rows), a = r[0], b = r[r.length - 1]; return { dWd: b.Wd - a.Wd, A: a.Wt - b.Wt }; },
      explain: (p, rows, e) => `ΔWđ = ${fmt(e.dWd, 3)} J và A = ${fmt(e.A, 3)} J: gần bằng nhau (khác chút do sai số đo), đúng với định lí động năng A = ΔWđ.`,
    },
  ],
  quiz: [
    { q: 'Vật khối lượng 2 kg chuyển động với tốc độ 3 m/s. Động năng của vật là:', o: ['6 J', '9 J', '18 J'], a: 1, why: 'Wđ = ½·2·3² = 9 J.' },
    { q: 'Vật 0,5 kg ở độ cao 10 m so với mặt đất (g = 9,8 m/s²). Thế năng trọng trường (gốc tại mặt đất) là:', o: ['4,9 J', '49 J', '98 J'], a: 1, why: 'Wt = mgh = 0,5·9,8·10 = 49 J.' },
    { q: 'Vật rơi tự do từ độ cao 20 m (g = 9,8 m/s²). Tốc độ khi chạm đất xấp xỉ:', o: ['14 m/s', '19,8 m/s', '39,2 m/s'], a: 1, why: 'v = √(2gh) = √(2·9,8·20) = √392 ≈ 19,8 m/s.' },
    { q: 'Tốc độ của vật tăng gấp đôi thì động năng:', o: ['tăng gấp đôi', 'tăng gấp bốn', 'không đổi'], a: 1, why: 'Wđ tỉ lệ với v²: (2v)² = 4v².' },
    { q: 'Lò xo có k = 200 N/m bị nén 0,1 m. Thế năng đàn hồi là:', o: ['1 J', '10 J', '20 J'], a: 0, why: 'Wt = ½kx² = ½·200·0,1² = 1 J.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

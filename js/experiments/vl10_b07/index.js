// Vật lí 10 – Bài 7: Đồ thị độ dịch chuyển – thời gian.
import { mountLab } from '../../core/lab.js';
import { linearFit, fmt } from '../../core/stats.js';
import { arrow, text, line, circle, rect } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
// Chuyển động thẳng gồm 3 giai đoạn, mỗi giai đoạn kéo dài SEG giây với vận tốc không đổi v1, v2, v3.
const SEG = 4, N = 3, TMAX = SEG * N;
export const phys = {
  SEG, TMAX,
  vel: (p, t) => [p.v1, p.v2, p.v3][Math.min(N - 1, Math.max(0, Math.floor(t / SEG - 1e-12)))],   // vận tốc tại thời điểm t
  d(p, t) {                                    // độ dịch chuyển so với gốc tại t = 0
    const v = [p.v1, p.v2, p.v3]; let x = 0, rest = Math.min(Math.max(t, 0), TMAX);
    for (let i = 0; i < N && rest > 0; i++) { const dt = Math.min(SEG, rest); x += v[i] * dt; rest -= dt; }
    return x;
  },
  // quãng đường đi được (tính cả khi đổi chiều)
  dist(p) { return SEG * (Math.abs(p.v1) + Math.abs(p.v2) + Math.abs(p.v3)); },
  turnPoints: (p) => [0, SEG, 2 * SEG, 3 * SEG].map((t) => phys.d(p, t)),
};
const PRESETS = { a: [2, 0, -1.5], b: [1.5, 1.5, 1.5], c: [3, 1, -2], d: [-1, 2.5, 0.5] };
// phân loại dòng số liệu theo giai đoạn (bỏ qua dòng sát mốc đổi giai đoạn)
const segOf = (t) => { for (let i = 0; i < N; i++) if (t > i * SEG + 0.25 && t < (i + 1) * SEG - 0.25) return i; return -1; };
const groups = (rows) => [0, 1, 2].map((i) => rows.filter((r) => segOf(r.t) === i));
const spread = (g) => (g.length ? Math.max(...g.map((r) => r.t)) - Math.min(...g.map((r) => r.t)) : 0);

export const spec = {
  seed: 7007,
  intro: 'Một xe chuyển động thẳng qua ba giai đoạn, mỗi giai đoạn 4 s. Em ghi vị trí theo thời gian, vẽ đồ thị d – t và đọc vận tốc từ độ dốc.',
  goals: [
    'Vẽ và đọc đồ thị độ dịch chuyển – thời gian (d – t) của chuyển động thẳng.',
    'Nhận ra độ dốc của đồ thị d – t là vận tốc; dốc lên là v > 0, dốc xuống là v < 0, nằm ngang là đứng yên.',
    'Tính vận tốc từng giai đoạn và vận tốc trung bình cả quá trình từ đồ thị.',
  ],
  theory: 'v = Δd / Δt = (d₂ − d₁) / (t₂ − t₁) = độ dốc của đồ thị d – t<br>Đoạn thẳng nằm ngang: v = 0 (đứng yên). Đồ thị đi xuống: v < 0 (chuyển động ngược chiều dương).',
  setup: 'Chọn dạng chuyển động có sẵn hoặc tự chỉnh vận tốc ba giai đoạn (đổi vận tốc sẽ xóa bảng). Kéo thanh thời gian, ghi số liệu ít nhất 3 điểm trong mỗi giai đoạn; đường xanh lục là đồ thị vẽ dần theo chuyển động.',
  choices: [{ k: 'preset', label: 'Dạng chuyển động', options: [['a', 'Đi – đứng yên – quay về'], ['b', 'Chuyển động đều'], ['c', 'Nhanh – chậm – quay đầu'], ['d', 'Lùi – tiến nhanh – tiến chậm'], ['x', 'Tự chọn vận tốc']], def: 'a', string: true }],
  params: [
    { k: 'v1', label: 'Vận tốc giai đoạn 1 (0–4 s)', unit: 'm/s', min: -3, max: 3, step: 0.5, def: 2, dec: 1 },
    { k: 'v2', label: 'Vận tốc giai đoạn 2 (4–8 s)', unit: 'm/s', min: -3, max: 3, step: 0.5, def: 0, dec: 1 },
    { k: 'v3', label: 'Vận tốc giai đoạn 3 (8–12 s)', unit: 'm/s', min: -3, max: 3, step: 0.5, def: -1.5, dec: 1 },
  ],
  clearOnParam: ['v1', 'v2', 'v3'],
  onChoice(p) { const q = PRESETS[p.preset]; if (q) [p.v1, p.v2, p.v3] = q; },
  onParam(p) { p.preset = 'x'; },
  stageHeight: 200,
  ariaLabel: 'Xe chạy trên trục thẳng nằm ngang với các chấm đánh dấu vị trí mỗi giây và thanh ba giai đoạn thời gian',
  duration: () => TMAX,
  state: (p, t) => ({ t, d: phys.d(p, t), v: phys.vel(p, t) }),
  readouts: (p, s) => [['d', fmt(s.d, 2) + ' m'], ['v', fmt(s.v, 1) + ' m/s']],
  draw(ctx, { w, h }, s, p, t, th) {
    const pts = phys.turnPoints(p), lo = Math.min(...pts, 0) - 1, hi = Math.max(...pts, 0) + 1;
    const x0 = 24, ppm = (w - 48) / Math.max(hi - lo, 6), X = (d) => x0 + (d - lo) * ppm, yg = 78;
    line(ctx, x0, yg, w - 24, yg, th.axis, 2);
    const step = hi - lo > 16 ? 2 : 1;
    for (let d = Math.ceil(lo / step) * step; d <= hi + 1e-9; d += step) {
      line(ctx, X(d), yg, X(d), yg + 6, th.axis, 1); text(ctx, String(d).replace('-', '−'), X(d), yg + 19, { color: th.muted, size: 11, align: 'center' });
    }
    text(ctx, 'd (m)', w - 24, yg + 34, { color: th.muted, size: 11, align: 'right' });
    line(ctx, X(0), yg - 30, X(0), yg + 6, th.ink, 1.5, [3, 3]); text(ctx, 'O', X(0), yg - 34, { color: th.ink, size: 12, align: 'center', bold: true });
    // vị trí mỗi giây (đánh dấu theo thời gian)
    for (let k = 0; k <= TMAX && k <= t + 1e-9; k++) circle(ctx, X(phys.d(p, k)), yg + 0, 3, th.s2);
    const cx = X(s.d);
    rect(ctx, cx - 18, yg - 28, 36, 16, th.car, null, 5); circle(ctx, cx - 10, yg - 10, 5, th.ink); circle(ctx, cx + 10, yg - 10, 5, th.ink);
    if (Math.abs(s.v) > 0.01) { arrow(ctx, cx, yg - 42, cx + s.v * 14, yg - 42, th.accent, 3); text(ctx, 'v', cx + s.v * 14 + (s.v > 0 ? 5 : -5), yg - 38, { color: th.accent, size: 12, align: s.v > 0 ? 'left' : 'right' }); }
    // thanh ba giai đoạn thời gian
    const bx = 24, bw = w - 48, by = h - 34, bh = 18;
    for (let i = 0; i < N; i++) {
      const a = bx + (bw * i) / N, act = t >= i * SEG && (t < (i + 1) * SEG || i === N - 1);
      rect(ctx, a + 1, by, bw / N - 2, bh, act ? th.soft : null, th.line, 4);
      text(ctx, `GĐ ${i + 1}: ${fmt([p.v1, p.v2, p.v3][i], 1)} m/s`, a + bw / N / 2, by + 13, { color: act ? th.ink : th.muted, size: w < 420 ? 10 : 12, align: 'center' });
    }
    const fx = bx + (bw * t) / TMAX; line(ctx, fx, by - 5, fx, by + bh + 4, th.bad, 2);
  },
  async demo(api) { for (const t of [0.4, 1.9, 3.5, 4.8, 6, 7.2, 8.8, 10.2, 11.6]) { api.setT(t); api.record(); } },
  columns: [{ k: 't', label: 't', unit: 's', dec: 2 }, { k: 'd', label: 'd', unit: 'm', dec: 2 }],
  recordLabel: 'Ghi số liệu (t, d)',
  note: 'Mỗi lần ghi: đồng hồ sai số khoảng 0,02 s; vị trí đọc trên thước, sai số khoảng 2 cm.',
  record: (p, s, t, n) => ({ t: n.round(t + n.noise(0.02), 0.01), d: n.round(s.d + n.noise(0.02), 0.01) }),
  graphs: [{
    title: 'Đồ thị d – t', xlabel: 't (s)', ylabel: 'd (m)', x: 't', y: 'd', zeroX: true, zeroY: true,
    curve: (p, s) => { const T = Math.max(s.t, 0.001), n = Math.max(2, Math.ceil(T / 0.25)); return Array.from({ length: n + 1 }, (_, i) => [(T * i) / n, phys.d(p, (T * i) / n)]); },
    marker: (p, s) => [s.t, s.d],
    range: (p) => { const q = phys.turnPoints(p), lo = Math.min(...q, 0), hi = Math.max(...q, 0), m = Math.max(1, (hi - lo) * 0.1); return { xmin: -0.3, xmax: TMAX + 0.3, ymin: lo - m, ymax: hi + m }; },
  }],
  predict: {
    prompt: '<p>Với vận tốc ba giai đoạn đang chọn, hãy dự đoán độ dịch chuyển d (so với O) của xe tại <b>t = 6 s</b> và tại <b>t = 12 s</b>. (Vận tốc dương: chuyển động theo chiều dương.)</p>',
    fields: [{ k: 'd6', label: 'd(6 s)', unit: 'm' }, { k: 'd12', label: 'd(12 s)', unit: 'm' }],
    expected: (p) => ({ d6: phys.d(p, 6), d12: phys.d(p, 12) }), tol: 0.02, absTol: 0.05,
    explain: (p) => `d(6) = ${fmt(p.v1 * 4, 1)} + ${fmt(p.v2 * 2, 1)} = ${fmt(phys.d(p, 6), 1)} m; d(12) = ${fmt(p.v1 * 4, 1)} + ${fmt(p.v2 * 4, 1)} + ${fmt(p.v3 * 4, 1)} = ${fmt(phys.d(p, 12), 1)} m.`,
  },
  tasks: [
    {
      title: 'Đọc vận tốc từ độ dốc của đồ thị',
      prompt: '<p>Ghi ít nhất 3 điểm trong mỗi giai đoạn (tránh các điểm sát t = 4 s và t = 8 s). Trong mỗi giai đoạn lấy hai điểm xa nhau và tính <b>v = (d₂ − d₁)/(t₂ − t₁)</b> (độ dốc của đoạn đồ thị).</p>',
      fields: [{ k: 'v1', label: 'v giai đoạn 1', unit: 'm/s' }, { k: 'v2', label: 'v giai đoạn 2', unit: 'm/s' }, { k: 'v3', label: 'v giai đoạn 3', unit: 'm/s' }],
      need: (rows) => { const g = groups(rows); return g.every((x) => x.length >= 3 && spread(x) >= 1.5) ? null : 'Cần ghi ít nhất 3 điểm trong mỗi giai đoạn (cách nhau trên 1,5 s, không sát t = 4 s, 8 s).'; },
      tol: 0.05, absTol: 0.1,
      expected: (p, rows) => { const g = groups(rows).map((x) => linearFit(x.map((r) => [r.t, r.d])).slope); return { v1: g[0], v2: g[1], v3: g[2] }; },
      explain: () => 'Giai đoạn đồ thị nằm ngang thì v = 0; đồ thị đi xuống thì v < 0.',
      reference: (p) => `Giá trị cài đặt: ${fmt(p.v1, 1)}; ${fmt(p.v2, 1)}; ${fmt(p.v3, 1)} m/s.`,
    },
    {
      title: 'Vận tốc trung bình cả chuyển động',
      prompt: '<p>Lấy dòng có t nhỏ nhất và dòng có t lớn nhất trong bảng (phải cách nhau ít nhất 9 s). Tính độ dịch chuyển Δd = d_cuối − d_đầu và vận tốc trung bình v_tb = Δd/Δt.</p>',
      fields: [{ k: 'dd', label: 'Δd', unit: 'm' }, { k: 'vtb', label: 'v_tb', unit: 'm/s' }],
      need: (rows) => (rows.length >= 2 && Math.max(...rows.map((r) => r.t)) - Math.min(...rows.map((r) => r.t)) >= 9 ? null : 'Cần có điểm ghi gần đầu (t nhỏ) và gần cuối (t lớn), cách nhau ít nhất 9 s.'),
      tol: 0.03, absTol: 0.05,
      expected: (p, rows) => {
        const a = rows.reduce((m, r) => (r.t < m.t ? r : m)), b = rows.reduce((m, r) => (r.t > m.t ? r : m));
        return { dd: b.d - a.d, vtb: (b.d - a.d) / (b.t - a.t) };
      },
      explain: () => 'Vận tốc trung bình chỉ phụ thuộc điểm đầu và điểm cuối; có thể bằng 0 dù vật đã đi nhiều quãng đường.',
      reference: (p) => `Giá trị cài đặt: d(12) = ${fmt(phys.d(p, 12), 2)} m, v_tb = ${fmt(phys.d(p, 12) / 12, 2)} m/s; quãng đường s = ${fmt(phys.dist(p), 1)} m.`,
    },
  ],
  quiz: [
    { q: 'Trên đồ thị d – t, đoạn thẳng nằm ngang cho biết vật:', o: ['chuyển động đều', 'đứng yên', 'chuyển động nhanh dần'], a: 1, why: 'd không đổi theo t nên độ dốc bằng 0, tức v = 0.' },
    { q: 'Độ dốc của đồ thị độ dịch chuyển – thời gian bằng:', o: ['gia tốc', 'quãng đường', 'vận tốc'], a: 2, why: 'Độ dốc = Δd/Δt = v.' },
    { q: 'Đồ thị d – t là đoạn thẳng đi xuống (d giảm khi t tăng). Vận tốc của vật:', o: ['dương', 'âm', 'bằng 0'], a: 1, why: 'd giảm nghĩa là vật chuyển động ngược chiều dương nên v < 0.' },
    { q: 'Vật có d = 2 m lúc t = 1 s và d = 8 m lúc t = 4 s (đồ thị là đoạn thẳng). Vận tốc là:', o: ['1,5 m/s', '2 m/s', '6 m/s'], a: 1, why: 'v = (8 − 2)/(4 − 1) = 2 m/s.' },
    { q: 'Hai đoạn thẳng đều đi lên; đoạn thứ nhất dốc hơn. Vậy:', o: ['vật chuyển động nhanh hơn ở đoạn thứ nhất', 'vật chuyển động nhanh hơn ở đoạn thứ hai', 'hai đoạn có cùng tốc độ'], a: 0, why: 'Độ dốc lớn hơn ứng với vận tốc có độ lớn lớn hơn.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

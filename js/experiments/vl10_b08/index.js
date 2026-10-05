// Vật lí 10 – Bài 8: Chuyển động biến đổi. Gia tốc.
import { mountLab } from '../../core/lab.js';
import { linearFit, fmt } from '../../core/stats.js';
import { arrow, text, ruler, ground, rect, circle, line } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
// Chuyển động biến đổi đều: a không đổi.
// Chuyển động có gia tốc thay đổi (mode 'var'): a(t) = a₀(1 − t/3), tức là tăng tốc rồi giảm tốc.
export const TMAX = 6;
export const phys = {
  a: (p, t) => (p.mode === 'var' ? p.a0 * (1 - t / 3) : p.a),
  v: (p, t) => (p.mode === 'var' ? p.v0 + p.a0 * (t - t * t / 6) : p.v0 + p.a * t),
  x: (p, t) => (p.mode === 'var' ? p.v0 * t + p.a0 * (t * t / 2 - t ** 3 / 18) : p.v0 * t + 0.5 * p.a * t * t),
  // gia tốc trung bình a_tb = Δv/Δt
  aavg: (p, t1, t2) => (phys.v(p, t2) - phys.v(p, t1)) / (t2 - t1),
  kind(p, t) {
    const v = phys.v(p, t), a = phys.a(p, t);
    if (Math.abs(v) < 0.03) return Math.abs(a) < 0.02 ? 'đứng yên' : 'vận tốc bằng 0 (đổi chiều chuyển động)';
    if (Math.abs(a) < 0.02) return 'chuyển động thẳng đều (a = 0)';
    return a * v > 0 ? 'nhanh dần (a cùng dấu với v)' : 'chậm dần (a ngược dấu với v)';
  },
};

const PRESET = { custom: null, up: { v0: 1, a: 1.5 }, slow: { v0: 6, a: -1.5 }, var: { v0: 1, a0: 2 } };

// Chọn bước chia thước "đẹp" sao cho hai vạch cách nhau ≥ 34 px.
function niceStep(ppm) {
  for (const s of [0.5, 1, 2, 5, 10, 20, 50, 100]) if (s * ppm >= 34) return s;
  return 100;
}

export const spec = {
  seed: 8008,
  intro: 'Một xe nhỏ chạy trên đường ray thẳng. Em quan sát vận tốc của xe thay đổi thế nào theo thời gian và đo gia tốc của nó.',
  goals: [
    'Hiểu gia tốc a = Δv/Δt cho biết vận tốc thay đổi nhanh hay chậm.',
    'Phân biệt gia tốc trung bình và gia tốc tức thời; nhận biết chuyển động nhanh dần, chậm dần, đổi chiều.',
    'Xác định gia tốc từ độ dốc của đồ thị vận tốc – thời gian (v – t).',
  ],
  theory: 'a = Δv/Δt = (v₂ − v₁)/(t₂ − t₁) &nbsp;&nbsp; Nhanh dần: a cùng dấu v &nbsp;&nbsp; Chậm dần: a ngược dấu v &nbsp;&nbsp; Đơn vị: m/s²',
  setup: 'Chọn kiểu chuyển động, rồi bấm “Chạy”. Chiều dương hướng sang phải. Vạch nhỏ dưới thước đánh dấu vị trí của xe sau mỗi giây.',
  choices: [{
    k: 'mode', label: 'Kiểu chuyển động', def: 'custom',
    options: [['custom', 'Tự chọn v₀ và a (biến đổi đều)'], ['up', 'Xe tăng tốc'], ['slow', 'Xe giảm tốc rồi đổi chiều'], ['var', 'Gia tốc thay đổi (không đều)']],
  }],
  params: [
    { k: 'v0', label: 'Vận tốc ban đầu v₀', unit: 'm/s', min: -6, max: 8, step: 0.5, def: 2, dec: 1 },
    { k: 'a', label: 'Gia tốc a', unit: 'm/s²', min: -3, max: 3, step: 0.1, def: 1, dec: 1, show: (p) => p.mode !== 'var' },
    { k: 'a0', label: 'Gia tốc lúc đầu a₀', unit: 'm/s²', min: -3, max: 3, step: 0.1, def: 2, dec: 1, show: (p) => p.mode === 'var' },
  ],
  onChoice(p) { const q = PRESET[p.mode]; if (q) Object.assign(p, q); },
  toggles: [{ k: 'vec', label: 'Hiện vectơ vận tốc và gia tốc', def: true }],
  stageHeight: 210,
  ariaLabel: 'Xe chạy trên đường ray có thước đo, vectơ vận tốc và vectơ gia tốc',
  duration: () => TMAX,
  state: (p, t) => ({ x: phys.x(p, t), v: phys.v(p, t), a: phys.a(p, t) }),
  readouts: (p, s, t) => {
    const r = [['x', fmt(s.x, 2) + ' m'], ['v', fmt(s.v, 2) + ' m/s'], ['a', fmt(s.a, 2) + ' m/s²']];
    if (t > 0.05) r.push(['a tb (0→t)', fmt(phys.aavg(p, 0, t), 2) + ' m/s²']);
    return r;
  },
  draw(ctx, { w, h }, s, p, t, th, tg) {
    // Tỉ lệ pixel/mét tự tính theo quỹ đạo thực của xe trong cả quá trình.
    let xmin = 0, xmax = 0;
    for (let i = 0; i <= 60; i++) { const x = phys.x(p, (TMAX * i) / 60); xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); }
    const span = Math.max(xmax - xmin, 2), padL = 40, padR = 44;
    const ppm = (w - padL - padR) / span, x0 = padL - xmin * ppm, yg = h - 74;
    const step = niceStep(ppm);
    const vmin = Math.ceil(xmin / step - 1e-9) * step, vmax = Math.floor(xmax / step + 1e-9) * step;
    ground(ctx, 10, w - 10, yg, th);
    ruler(ctx, x0, yg + 14, ppm, vmin, Math.max(vmax, vmin + step), step, th, { unit: 'x (m)', labelEvery: 1 });
    // dấu vị trí sau mỗi giây (chỉ những giây đã qua)
    for (let k = 0; k <= TMAX && k <= t + 1e-9; k++) circle(ctx, x0 + phys.x(p, k) * ppm, yg + 5, 3, th.accent);
    const cx = x0 + s.x * ppm;
    rect(ctx, cx - 22, yg - 26, 44, 18, th.car, null, 5);
    circle(ctx, cx - 12, yg - 8, 6, th.ink); circle(ctx, cx + 12, yg - 8, 6, th.ink);
    text(ctx, 'Chuyển động ' + phys.kind(p, t), 12, 18, { color: th.ink, size: 13, bold: true });
    if (tg.vec) {
      const vl = Math.max(-100, Math.min(100, s.v * 14)), al = Math.max(-100, Math.min(100, s.a * 22));
      const lab = (str, x, y, c) => text(ctx, str, Math.max(6, Math.min(w - 16, x)), y, { color: c, size: 12, bold: true });
      if (Math.abs(vl) > 1) { arrow(ctx, cx, yg - 42, cx + vl, yg - 42, th.accent, 3); lab('v', cx + vl + (vl >= 0 ? 5 : -12), yg - 38, th.accent); }
      if (Math.abs(al) > 1) { arrow(ctx, cx, yg - 66, cx + al, yg - 66, th.s3, 3); lab('a', cx + al + (al >= 0 ? 5 : -12), yg - 62, th.s3); }
      line(ctx, cx, yg - 72, cx, yg - 30, th.line, 1, [3, 3]);
    }
  },
  columns: [
    { k: 't', label: 't', unit: 's', dec: 2 }, { k: 'x', label: 'x', unit: 'm', dec: 3 }, { k: 'v', label: 'v', unit: 'm/s', dec: 2 },
  ],
  recordLabel: 'Ghi số liệu (t, x, v)',
  note: 'Đồng hồ có sai số khoảng 0,01 s, thước chia đến 1 mm, tốc kế (cổng quang) đọc v với sai số khoảng 0,03 m/s. Hãy ghi ở nhiều thời điểm khác nhau, cách xa nhau.',
  record: (p, s, t, n) => ({
    t: n.round(t + n.noise(0.01), 0.01), x: n.round(s.x + n.noise(0.003), 0.001), v: n.round(s.v + n.noise(0.03), 0.01),
  }),
  graphs: [
    { title: 'Đồ thị x – t', xlabel: 't (s)', ylabel: 'x (m)', x: 't', y: 'x', curve: (p) => Array.from({ length: 61 }, (_, i) => [(i * TMAX) / 60, phys.x(p, (i * TMAX) / 60)]), marker: (p, s, t) => [t, s.x], zeroX: true, zeroY: true },
    { title: 'Đồ thị v – t', xlabel: 't (s)', ylabel: 'v (m/s)', x: 't', y: 'v', fit: true, curve: (p) => Array.from({ length: 61 }, (_, i) => [(i * TMAX) / 60, phys.v(p, (i * TMAX) / 60)]), marker: (p, s, t) => [t, s.v], zeroX: true, zeroY: true },
    { title: 'Đồ thị a – t (gia tốc tức thời)', xlabel: 't (s)', ylabel: 'a (m/s²)', x: 't', y: 'a', curve: (p) => [[0, phys.a(p, 0)], [TMAX, phys.a(p, TMAX)]], marker: (p, s, t) => [t, s.a], zeroX: true, zeroY: true, range: (p) => ({ ymin: Math.min(-0.5, -Math.abs(phys.a(p, 0)) - 0.5, -Math.abs(phys.a(p, TMAX)) - 0.5), ymax: Math.max(0.5, Math.abs(phys.a(p, 0)) + 0.5, Math.abs(phys.a(p, TMAX)) + 0.5) }) },
  ],
  predict: {
    prompt: '<p>Với kiểu chuyển động và các giá trị đang chọn, hãy dự đoán <b>vận tốc tại t = 4 s</b> và <b>gia tốc trung bình trong 4 s đầu</b> (từ t = 0 đến t = 4 s).</p>',
    fields: [{ k: 'v', label: 'v(4 s)', unit: 'm/s' }, { k: 'a', label: 'a tb (0 → 4 s)', unit: 'm/s²' }],
    expected: (p) => ({ v: phys.v(p, 4), a: phys.aavg(p, 0, 4) }), tol: 0.02, absTol: 0.03,
    explain: (p) => `v(4) = ${fmt(phys.v(p, 4))} m/s; a tb = Δv/Δt = (${fmt(phys.v(p, 4))} − ${fmt(phys.v(p, 0))})/4 = ${fmt(phys.aavg(p, 0, 4))} m/s².`,
  },
  tasks: [
    {
      title: 'Xử lí số liệu: gia tốc trung bình',
      prompt: '<p>Trong bảng số liệu, lấy <b>lần đo có t nhỏ nhất</b> và <b>lần đo có t lớn nhất</b> (hai lần đo cách nhau ít nhất 1 s). Tính Δv, Δt và gia tốc trung bình a<sub>tb</sub> = Δv/Δt.</p>',
      fields: [{ k: 'dv', label: 'Δv', unit: 'm/s' }, { k: 'dt', label: 'Δt', unit: 's' }, { k: 'a', label: 'a tb', unit: 'm/s²' }],
      tol: 0.03, absTol: 0.03,
      need: (rows) => {
        if (rows.length < 2) return 'Cần ghi ít nhất 2 lần đo ở phần thí nghiệm.';
        const ts = rows.map((r) => r.t);
        return Math.max(...ts) - Math.min(...ts) < 1 ? 'Hãy ghi thêm hai lần đo cách nhau ít nhất 1 s.' : null;
      },
      expected: (p, rows) => {
        const lo = rows.reduce((a, r) => (r.t < a.t ? r : a)), hi = rows.reduce((a, r) => (r.t > a.t ? r : a));
        const dv = hi.v - lo.v, dt = hi.t - lo.t; return { dv, dt, a: dv / dt };
      },
      explain: () => 'a tb = Δv/Δt. Nếu gia tốc không đổi thì a tb bằng gia tốc tức thời tại mọi thời điểm.',
    },
    {
      title: 'Xử lí số liệu: gia tốc từ đồ thị v – t',
      prompt: '<p>Ghi ít nhất 6 lần đo ở các thời điểm khác nhau rồi đọc dưới đồ thị v – t: <b>độ dốc</b> của đường khớp là gia tốc a, <b>tung độ gốc</b> là vận tốc ban đầu v₀. (Dùng cho chuyển động biến đổi đều.)</p>',
      fields: [{ k: 'a', label: 'Gia tốc a', unit: 'm/s²' }, { k: 'v0', label: 'Vận tốc ban đầu v₀', unit: 'm/s' }],
      tol: 0.03, absTol: 0.03,
      need: (rows, p) => (p.mode === 'var' ? 'Mục này chỉ dùng cho chuyển động biến đổi đều: đồ thị v – t phải là đường thẳng. Hãy chọn kiểu chuyển động khác ở phần thí nghiệm.'
        : rows.length < 6 ? 'Cần ghi ít nhất 6 lần đo ở phần thí nghiệm.' : null),
      expected: (p, rows) => { const f = linearFit(rows.map((r) => [r.t, r.v])); return { a: f.slope, v0: f.intercept }; },
      reference: (p) => `Giá trị cài đặt trong mô phỏng: a = ${fmt(p.a, 1)} m/s², v₀ = ${fmt(p.v0, 1)} m/s.`,
    },
  ],
  quiz: [
    { q: 'Gia tốc của chuyển động cho biết điều gì?', o: ['Vật đi được quãng đường dài hay ngắn', 'Vận tốc của vật thay đổi nhanh hay chậm', 'Vật ở xa hay gần gốc toạ độ'], a: 1, why: 'a = Δv/Δt là độ biến thiên vận tốc trong một đơn vị thời gian.' },
    { q: 'Xe tăng tốc từ 2 m/s lên 14 m/s trong 6 s. Gia tốc trung bình là:', o: ['12 m/s²', '2 m/s²', '2,7 m/s²'], a: 1, why: 'a = (14 − 2)/6 = 2 m/s².' },
    { q: 'Vật có vận tốc dương (v > 0) và gia tốc âm (a < 0) thì chuyển động:', o: ['nhanh dần', 'chậm dần', 'thẳng đều'], a: 1, why: 'a ngược dấu với v nên độ lớn vận tốc giảm: chuyển động chậm dần.' },
    { q: 'Ô tô đang chạy 20 m/s thì hãm phanh với a = −4 m/s². Sau bao lâu thì dừng?', o: ['5 s', '80 s', '16 s'], a: 0, why: '0 = 20 + (−4)t nên t = 5 s.' },
    { q: 'Tại thời điểm xe đổi chiều chuyển động, v = 0. Lúc đó gia tốc của xe:', o: ['bằng 0', 'vẫn bằng a, khác 0', 'bằng vận tốc ban đầu'], a: 1, why: 'v = 0 chỉ là một thời điểm; vận tốc vẫn đang biến thiên nên a ≠ 0.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

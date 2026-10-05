// Vật lí 10 – Bài 4: Độ dịch chuyển và quãng đường đi được.
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, line, circle } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
// Đường đi là dãy điểm (x, y) tính bằng mét; vật đi dọc theo các đoạn thẳng liên tiếp với tốc độ không đổi.
export const PATHS = {
  line: { name: 'Đường thẳng, có quay lại', pts: [[0, 0], [8, 0], [3, 0]] },
  L: { name: 'Gấp khúc chữ L', pts: [[0, 0], [4, 0], [4, 3]] },
  zig: { name: 'Gấp khúc ba đoạn', pts: [[0, 0], [6, 0], [6, 4], [2, 4]] },
  loop: { name: 'Đường khép kín (về chỗ cũ)', pts: [[0, 0], [4, 0], [4, 3], [0, 3], [0, 0]] },
};
const segLens = (pts) => pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
export const phys = {
  PATHS,
  segLens,
  total: (key) => segLens(PATHS[key].pts).reduce((a, b) => a + b, 0),          // quãng đường tới điểm cuối
  // Vị trí khi đã đi được quãng đường s dọc theo đường đi.
  pos(key, s) {
    const pts = PATHS[key].pts, L = segLens(pts);
    let rest = Math.max(0, s);
    for (let i = 0; i < L.length; i++) {
      if (rest <= L[i] + 1e-12) { const f = L[i] ? rest / L[i] : 0; return [pts[i][0] + f * (pts[i + 1][0] - pts[i][0]), pts[i][1] + f * (pts[i + 1][1] - pts[i][1])]; }
      rest -= L[i];
    }
    return pts[pts.length - 1].slice();
  },
  s: (p, t) => Math.min(p.v * t, phys.total(p.path)),                            // quãng đường đi được sau t
  disp(key, s) { const q = phys.pos(key, s), o = PATHS[key].pts[0]; return [q[0] - o[0], q[1] - o[1]]; },  // vector độ dịch chuyển
  d(key, s) { const [a, b] = phys.disp(key, s); return Math.hypot(a, b); },       // độ lớn độ dịch chuyển
};

const lastRow = (rows) => rows.reduce((m, r) => (!m || r.t > m.t ? r : m), null);

export const spec = {
  seed: 4004,
  intro: 'Một xe nhỏ chạy với tốc độ không đổi theo các đường đi khác nhau. Em đo toạ độ và quãng đường bằng bộ đếm, rồi so sánh quãng đường s với độ dịch chuyển d.',
  goals: [
    'Phân biệt quãng đường đi được s (vô hướng, không âm) với độ dịch chuyển d (vector, có phương chiều).',
    'Xác định độ dịch chuyển bằng vector nối điểm đầu với điểm cuối; tính độ lớn từ toạ độ.',
    'Nhận ra khi nào d = s và khi nào d < s (đổi chiều, đường gấp khúc, đường khép kín).',
  ],
  theory: 'Quãng đường: s = tổng độ dài các đoạn đã đi &nbsp;&nbsp; Độ dịch chuyển: <b>d</b> = <b>r</b> − <b>r</b>₀ , d = √(Δx² + Δy²)<br>d ≤ s; d = s khi chuyển động thẳng không đổi chiều. Trên đường thẳng: d = x₂ − x₁ (có dấu).',
  setup: 'Có bốn đường đi: thẳng rồi quay lại; chữ L; gấp khúc ba đoạn; hình chữ nhật 4 m × 3 m về điểm xuất phát. Chọn đường đi, bấm ▶ Chạy rồi ghi số liệu nhiều thời điểm. Mũi tên đỏ là vector độ dịch chuyển từ điểm xuất phát A đến vị trí hiện tại; đường nét liền là quãng đường đã đi.',
  choices: [{ k: 'path', label: 'Đường đi', options: Object.entries(PATHS).map(([k, v]) => [k, v.name]), def: 'zig', string: true }],
  params: [{ k: 'v', label: 'Tốc độ của xe', unit: 'm/s', min: 0.5, max: 2, step: 0.1, def: 1, dec: 1 }],
  toggles: [{ k: 'vec', label: 'Hiện vector độ dịch chuyển', def: true }, { k: 'trail', label: 'Hiện quãng đường đã đi', def: true }],
  stageHeight: 250,
  ariaLabel: 'Xe chạy trên mặt phẳng có lưới toạ độ, đường đi nét đứt và vector độ dịch chuyển từ điểm xuất phát',
  duration: (p) => phys.total(p.path) / p.v,
  state(p, t) {
    const s = phys.s(p, t), [x, y] = phys.pos(p.path, s), [dx, dy] = phys.disp(p.path, s);
    return { s, x, y, dx, dy, d: Math.hypot(dx, dy) };
  },
  readouts: (p, s) => [['s', fmt(s.s, 2) + ' m'], ['d', fmt(s.d, 2) + ' m'], ['(Δx; Δy)', `(${fmt(s.dx, 1)}; ${fmt(s.dy, 1)}) m`]],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const y0 = h - 30, ppm = Math.min((w - 52) / 8.6, (y0 - 14) / 4.5), x0 = Math.max(36, (w - 8.6 * ppm) / 2);
    const X = (x) => x0 + x * ppm, Y = (y) => y0 - y * ppm;
    // lưới và trục
    for (let i = 0; i <= 8; i++) { line(ctx, X(i), Y(0), X(i), Y(4.3), th.grid, 1); text(ctx, String(i), X(i), y0 + 14, { color: th.muted, size: 11, align: 'center' }); }
    for (let j = 0; j <= 4; j++) { line(ctx, X(0), Y(j), X(8.4), Y(j), th.grid, 1); text(ctx, String(j), x0 - 8, Y(j) + 4, { color: th.muted, size: 11, align: 'right' }); }
    line(ctx, X(0), Y(0), X(8.5), Y(0), th.axis, 1.5); line(ctx, X(0), Y(0), X(0), Y(4.4), th.axis, 1.5);
    text(ctx, 'x (m)', X(8.5), y0 - 6, { color: th.muted, size: 11, align: 'right' }); text(ctx, 'y (m)', x0 + 6, 12, { color: th.muted, size: 11 });
    // đường đi đầy đủ (nét đứt)
    const pts = PATHS[p.path].pts;
    ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = th.axis; ctx.lineWidth = 1.5; ctx.beginPath();
    pts.forEach((q, i) => (i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])))); ctx.stroke(); ctx.restore();
    // phần đã đi (nét liền)
    if (tg.trail && s.s > 0) {
      ctx.save(); ctx.strokeStyle = th.accent; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
      let rest = s.s; const L = segLens(pts);
      for (let i = 0; i < L.length && rest > 0; i++) { const f = Math.min(1, rest / L[i]); ctx.lineTo(X(pts[i][0] + f * (pts[i + 1][0] - pts[i][0])), Y(pts[i][1] + f * (pts[i + 1][1] - pts[i][1]))); rest -= L[i]; }
      ctx.stroke(); ctx.restore();
    }
    // các điểm mốc A, B, C...
    const used = [];
    pts.forEach((q, i) => {
      if (used.some((u) => Math.hypot(u[0] - q[0], u[1] - q[1]) < 1e-9)) return; used.push(q);
      circle(ctx, X(q[0]), Y(q[1]), 4, th.card, th.ink);
      text(ctx, 'ABCDE'[used.length - 1], X(q[0]) + (q[0] === 0 && q[1] === 0 ? -12 : 7), Y(q[1]) - (q[1] === 0 ? 7 : 6), { color: th.ink, size: 13, bold: true });
    });
    // vector độ dịch chuyển
    if (tg.vec && s.d > 0.05) {
      arrow(ctx, X(pts[0][0]), Y(pts[0][1]), X(s.x), Y(s.y), th.bad, 3);
      if (s.d > 1) text(ctx, 'd', (X(pts[0][0]) + X(s.x)) / 2 - 10, (Y(pts[0][1]) + Y(s.y)) / 2 - 8, { color: th.bad, size: 13, bold: true });
    }
    circle(ctx, X(s.x), Y(s.y), 7, th.car, th.ink);
  },
  columns: [
    { k: 't', label: 't', unit: 's', dec: 2 }, { k: 'x', label: 'x', unit: 'm', dec: 2 },
    { k: 'y', label: 'y', unit: 'm', dec: 2 }, { k: 's', label: 's', unit: 'm', dec: 2 },
  ],
  recordLabel: 'Ghi số liệu (t, x, y, s)',
  note: 'Gốc toạ độ là điểm xuất phát A. Đồng hồ sai số khoảng 0,02 s; toạ độ đọc đến 1 cm (sai số khoảng 1 cm); bộ đếm quãng đường sai số khoảng 2 cm.',
  record(p, s, t, n) {
    const x = n.round(s.x + n.noise(0.01), 0.01), y = n.round(s.y + n.noise(0.01), 0.01);
    return { t: n.round(t + n.noise(0.02), 0.01), x, y, s: n.round(s.s + n.noise(0.02), 0.01), d: Math.hypot(x, y) };
  },
  graphs: [
    { title: 'Quãng đường s theo thời gian', xlabel: 't (s)', ylabel: 's (m)', x: 't', y: 's', zeroX: true, zeroY: true,
      curve: (p) => { const T = phys.total(p.path) / p.v; return [[0, 0], [T, phys.total(p.path)]]; }, marker: (p, s, t) => [t, s.s] },
    { title: 'Độ lớn độ dịch chuyển d theo thời gian', xlabel: 't (s)', ylabel: 'd (m)', x: 't', y: 'd', zeroX: true, zeroY: true,
      curve: (p) => { const T = phys.total(p.path) / p.v; return Array.from({ length: 61 }, (_, i) => [(T * i) / 60, phys.d(p.path, p.v * (T * i) / 60)]); }, marker: (p, s, t) => [t, s.d] },
  ],
  predict: {
    prompt: '<p>Nhìn đường đi trên lưới toạ độ (mỗi ô 1 m). Hãy dự đoán khi xe tới <b>điểm cuối</b> của đường đi đã chọn: quãng đường s và độ lớn độ dịch chuyển d bằng bao nhiêu?</p>',
    fields: [{ k: 's', label: 'Quãng đường s', unit: 'm' }, { k: 'd', label: 'Độ dịch chuyển d', unit: 'm' }],
    expected: (p) => ({ s: phys.total(p.path), d: phys.d(p.path, phys.total(p.path)) }), tol: 0.02, absTol: 0.05,
    explain: (p) => `s là tổng độ dài các đoạn = ${fmt(phys.total(p.path), 1)} m; d là độ dài đoạn thẳng nối điểm đầu với điểm cuối = ${fmt(phys.d(p.path, phys.total(p.path)), 2)} m.`,
  },
  tasks: [
    {
      title: 'Xử lí số liệu: so sánh s và d',
      prompt: '<p>Ghi ít nhất 3 lần đo. Lấy <b>dòng có t lớn nhất</b> trong bảng. Tính d = √(x² + y²) từ toạ độ (x; y) của dòng đó, đọc s từ bảng, rồi tính hiệu s − d.</p>',
      fields: [{ k: 'd', label: 'd = √(x² + y²)', unit: 'm' }, { k: 's', label: 's', unit: 'm' }, { k: 'diff', label: 's − d', unit: 'm' }],
      minRows: 3, tol: 0.02, absTol: 0.03,
      expected: (p, rows) => { const r = lastRow(rows), d = Math.hypot(r.x, r.y); return { d, s: r.s, diff: r.s - d }; },
      explain: (p, rows) => { const r = lastRow(rows); return `Dòng t = ${fmt(r.t, 2)} s: x = ${fmt(r.x, 2)} m, y = ${fmt(r.y, 2)} m, s = ${fmt(r.s, 2)} m. Ta luôn có d ≤ s.`; },
      reference: (p) => `Giá trị chuẩn tại điểm cuối: s = ${fmt(phys.total(p.path), 2)} m, d = ${fmt(phys.d(p.path, phys.total(p.path)), 2)} m.`,
    },
    {
      title: 'Tốc độ trung bình và độ lớn vận tốc trung bình',
      prompt: '<p>Với cùng dòng có t lớn nhất, tính tốc độ trung bình = s/t và độ lớn vận tốc trung bình = d/t (d lấy từ toạ độ như trên).</p>',
      fields: [{ k: 'sp', label: 's/t', unit: 'm/s' }, { k: 'vv', label: 'd/t', unit: 'm/s' }],
      minRows: 3, tol: 0.03, absTol: 0.02,
      expected: (p, rows) => { const r = lastRow(rows); return { sp: r.s / r.t, vv: Math.hypot(r.x, r.y) / r.t }; },
      explain: () => 'Tốc độ trung bình dùng quãng đường s, còn vận tốc trung bình dùng độ dịch chuyển d nên d/t ≤ s/t.',
      reference: (p) => `Tốc độ cài đặt của xe: ${fmt(p.v, 1)} m/s.`,
    },
  ],
  quiz: [
    { q: 'Một người đi 3 m về phía Đông rồi 4 m về phía Bắc. Độ lớn độ dịch chuyển của người đó là:', o: ['7 m', '5 m', '1 m'], a: 1, why: 'd = √(3² + 4²) = 5 m, còn quãng đường s = 3 + 4 = 7 m.' },
    { q: 'Quãng đường đi được là đại lượng:', o: ['vô hướng, không âm', 'vector, có phương và chiều', 'có thể âm nếu vật đi ngược chiều dương'], a: 0, why: 'Quãng đường là tổng độ dài đã đi nên không âm và không có hướng.' },
    { q: 'Vận động viên chạy đúng một vòng sân dài 400 m, trở về điểm xuất phát. Khi đó:', o: ['d = 400 m, s = 0', 's = 400 m, d = 0', 's = d = 400 m'], a: 1, why: 'Điểm đầu trùng điểm cuối nên độ dịch chuyển bằng 0, quãng đường vẫn là 400 m.' },
    { q: 'Độ lớn độ dịch chuyển bằng quãng đường đi được khi:', o: ['vật chuyển động thẳng và không đổi chiều', 'vật chuyển động theo đường cong', 'vật đi hết một vòng tròn'], a: 0, why: 'Chỉ khi đi thẳng theo một chiều thì đoạn nối điểm đầu – điểm cuối trùng với đường đi.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

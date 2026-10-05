// Vật lí 10 – Bài 9: Chuyển động thẳng biến đổi đều (mẫu cho khung lab.js).
import { mountLab } from '../../core/lab.js';
import { linearFit } from '../../core/stats.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, ruler, ground, rect, circle } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
export const phys = {
  x: (p, t) => p.v0 * t + 0.5 * p.a * t * t,          // toạ độ (m), gốc tại vị trí xuất phát
  v: (p, t) => p.v0 + p.a * t,                         // vận tốc (m/s)
  s: (p, t) => p.v0 * t + 0.5 * p.a * t * t,
  v2: (p, x) => p.v0 * p.v0 + 2 * p.a * x,             // v² = v0² + 2ax
};
const TMAX = 4;

export const spec = {
  seed: 9009,
  intro: 'Xe chạy trên máng nghiêng với gia tốc không đổi. Em sẽ đọc đồng hồ, thước, cổng quang để tìm quy luật của v theo t và x theo t.',
  goals: [
    'Nhận biết chuyển động thẳng biến đổi đều: gia tốc a không đổi.',
    'Xác định gia tốc từ độ dốc của đồ thị v – t.',
    'Vận dụng v = v₀ + at; x = v₀t + ½at²; v² − v₀² = 2ax.',
  ],
  theory: 'v = v₀ + a·t &nbsp;&nbsp; x = v₀·t + ½·a·t² &nbsp;&nbsp; v² − v₀² = 2·a·x',
  params: [
    { k: 'v0', label: 'Vận tốc ban đầu v₀', unit: 'm/s', min: 0, max: 3, step: 0.1, def: 0.5, dec: 1 },
    { k: 'a', label: 'Gia tốc a', unit: 'm/s²', min: -1, max: 3, step: 0.1, def: 1.2, dec: 1 },
  ],
  toggles: [{ k: 'vec', label: 'Hiện vector vận tốc, gia tốc', def: true }],
  stageHeight: 190,
  ariaLabel: 'Xe chạy trên đường thẳng có thước đo, vector vận tốc và gia tốc',
  duration: () => TMAX,
  state: (p, t) => ({ x: phys.x(p, t), v: phys.v(p, t) }),
  readouts: (p, s) => [['x', fmt(s.x, 2) + ' m'], ['v', fmt(s.v, 2) + ' m/s']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const x0 = 30, ppm = (w - 60) / 12, yg = h - 60;     // 12 m trên màn hình
    const xs = Math.max(0, ...[0, 1, 2, 3, 4].map((u) => phys.x(p, u)));
    ground(ctx, 10, w - 10, yg, th);
    ruler(ctx, x0, yg + 14, ppm, 0, 12, 0.5, th, { unit: 'm', labelEvery: 2 });
    const cx = x0 + Math.max(-0.5, Math.min(12.5, s.x)) * ppm;
    rect(ctx, cx - 22, yg - 26, 44, 18, th.car, null, 5);
    circle(ctx, cx - 12, yg - 8, 7, th.ink); circle(ctx, cx + 12, yg - 8, 7, th.ink);
    if (tg.vec) {
      arrow(ctx, cx, yg - 40, cx + s.v * 22, yg - 40, th.accent, 3);
      text(ctx, 'v', cx + s.v * 22 + 4, yg - 44, { color: th.accent, size: 12 });
      if (Math.abs(p.a) > 0.01) { arrow(ctx, cx, yg - 62, cx + p.a * 30, yg - 62, th.s3, 3); text(ctx, 'a', cx + p.a * 30 + 4, yg - 66, { color: th.s3, size: 12 }); }
    }
  },
  columns: [
    { k: 't', label: 't', unit: 's', dec: 2 }, { k: 'x', label: 'x', unit: 'm', dec: 3 }, { k: 'v', label: 'v', unit: 'm/s', dec: 2 },
  ],
  recordLabel: 'Ghi số liệu (t, x, v)',
  note: 'Mỗi lần ghi: đồng hồ có sai số khoảng 0,02 s, thước chia đến 1 mm, cổng quang đọc v với sai số nhỏ.',
  record: (p, s, t, n) => ({ t: n.round(t + n.noise(0.02), 0.01), x: n.round(s.x + n.noise(0.003), 0.001), v: n.round(s.v + n.noise(0.03), 0.01) }),
  graphs: [
    { title: 'Đồ thị x – t', xlabel: 't (s)', ylabel: 'x (m)', x: 't', y: 'x', curve: (p) => Array.from({ length: 41 }, (_, i) => [i * 0.1, phys.x(p, i * 0.1)]), marker: (p, s, t) => [t, s.x], zeroX: true, zeroY: true },
    { title: 'Đồ thị v – t', xlabel: 't (s)', ylabel: 'v (m/s)', x: 't', y: 'v', fit: true, curve: (p) => [[0, p.v0], [TMAX, phys.v(p, TMAX)]], marker: (p, s, t) => [t, s.v], zeroX: true, zeroY: true },
  ],
  predict: {
    prompt: '<p>Với v₀ và a đang chọn, hãy dự đoán vận tốc và toạ độ của xe tại <b>t = 3 s</b>.</p>',
    fields: [{ k: 'v', label: 'v(3 s)', unit: 'm/s' }, { k: 'x', label: 'x(3 s)', unit: 'm' }],
    expected: (p) => ({ v: phys.v(p, 3), x: phys.x(p, 3) }), tol: 0.02, absTol: 0.03,
    explain: (p) => `v = v₀ + at = ${fmt(phys.v(p, 3))} m/s; x = v₀t + ½at² = ${fmt(phys.x(p, 3))} m.`,
  },
  tasks: [{
    title: 'Xử lí số liệu: tìm gia tốc',
    prompt: '<p>Ghi ít nhất 5 lần đo ở các thời điểm khác nhau. Đồ thị v – t là đường thẳng; <b>gia tốc là độ dốc</b> của đường đó. Đọc độ dốc và tung độ gốc ở chú thích dưới đồ thị.</p>',
    fields: [{ k: 'a', label: 'Gia tốc a', unit: 'm/s²' }, { k: 'v0', label: 'Vận tốc ban đầu v₀', unit: 'm/s' }],
    minRows: 5, tol: 0.03, absTol: 0.02,
    expected: (p, rows) => { const f = linearFit(rows.map((r) => [r.t, r.v])); return { a: f.slope, v0: f.intercept }; },
    reference: (p) => `Giá trị cài đặt trong mô phỏng: a = ${fmt(p.a, 1)} m/s², v₀ = ${fmt(p.v0, 1)} m/s.`,
  }],
  quiz: [
    { q: 'Trong chuyển động thẳng biến đổi đều, đại lượng nào không đổi?', o: ['vận tốc', 'gia tốc', 'quãng đường đi trong mỗi giây'], a: 1, why: 'Gia tốc không đổi nên vận tốc biến thiên đều theo thời gian.' },
    { q: 'Đồ thị v – t của chuyển động thẳng biến đổi đều là:', o: ['đường thẳng', 'parabol', 'đường thẳng song song trục t'], a: 0, why: 'v = v₀ + at là hàm bậc nhất của t.' },
    { q: 'Xe bắt đầu từ nghỉ với a = 2 m/s². Quãng đường đi trong 3 s là:', o: ['6 m', '9 m', '18 m'], a: 1, why: 's = ½·2·3² = 9 m.' },
    { q: 'Xe có v₀ = 4 m/s, a = 3 m/s², đi được 6 m thì v² bằng:', o: ['52 m²/s²', '34 m²/s²', '16 m²/s²'], a: 0, why: 'v² = v₀² + 2ax = 16 + 36 = 52 m²/s².' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

// Vật lí 10 – Bài 12: Chuyển động ném (ném ngang, ném xiên; bỏ qua sức cản không khí).
import { mountLab } from '../../core/lab.js';
import { linearFit, fmt } from '../../core/stats.js';
import { arrow, text, ruler, ground, rect, circle, line } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
// Gốc toạ độ ở chân vách, mặt đất y = 0. Ox nằm ngang, Oy hướng lên. Ném từ (0, h₀) với v₀, góc θ so với phương ngang.
export const G = 9.8;
const rad = (d) => (d * Math.PI) / 180;
export const phys = {
  ang: (p) => (p.mode === 'ngang' ? 0 : p.th),
  vx: (p) => p.v0 * Math.cos(rad(phys.ang(p))),
  vy0: (p) => p.v0 * Math.sin(rad(phys.ang(p))),
  x: (p, t) => phys.vx(p) * t,
  y: (p, t) => p.h0 + phys.vy0(p) * t - 0.5 * G * t * t,
  vy: (p, t) => phys.vy0(p) - G * t,
  speed: (p, t) => Math.hypot(phys.vx(p), phys.vy(p, t)),
  T: (p) => (phys.vy0(p) + Math.sqrt(phys.vy0(p) ** 2 + 2 * G * p.h0)) / G,   // thời gian bay đến khi chạm đất
  L: (p) => phys.vx(p) * phys.T(p),                                           // tầm xa
  tPeak: (p) => Math.max(0, phys.vy0(p) / G),
  H: (p) => p.h0 + (phys.vy0(p) > 0 ? phys.vy0(p) ** 2 / (2 * G) : 0),       // độ cao cực đại so với mặt đất
  // phương trình quỹ đạo y(x)
  yOfX: (p, x) => p.h0 + Math.tan(rad(phys.ang(p))) * x - (G * x * x) / (2 * phys.vx(p) ** 2),
};

export const spec = {
  seed: 1212,
  intro: 'Em ném một quả bóng nhỏ từ trên cao, theo phương ngang hoặc xiên lên. Bỏ qua sức cản không khí, quả bóng chỉ chịu tác dụng của trọng lực. Em quan sát quỹ đạo và đo các thành phần vận tốc.',
  goals: [
    'Phân tích chuyển động ném thành hai chuyển động thành phần: đều theo Ox, biến đổi đều theo Oy.',
    'Xác định thời gian bay, tầm xa và độ cao cực đại; hiểu quỹ đạo là một nhánh parabol.',
    'Từ số liệu đo, tìm vx, vy₀, g rồi suy ra v₀ và góc ném θ.',
  ],
  theory: 'vₓ = v₀cosθ (không đổi) &nbsp; v<sub>y</sub> = v₀sinθ − gt &nbsp; x = v₀cosθ·t &nbsp; y = h₀ + v₀sinθ·t − ½gt²<br>Thời gian bay: y = 0 &nbsp; Tầm xa: L = vₓ·T &nbsp; Độ cao cực đại (ném xiên): H = h₀ + v₀²sin²θ/(2g) &nbsp; (g = 9,8 m/s²)',
  setup: 'Chọn kiểu ném. Ném ngang: θ = 0, bóng được ném từ mép vách cao h₀. Ném xiên: ném lên với góc θ. Chấm tròn trên quỹ đạo là vị trí bóng sau mỗi 0,5 s.',
  choices: [{ k: 'mode', label: 'Kiểu ném', def: 'ngang', options: [['ngang', 'Ném ngang'], ['xien', 'Ném xiên']] }],
  params: [
    { k: 'v0', label: 'Tốc độ ném v₀', unit: 'm/s', min: 5, max: 30, step: 1, def: 10, dec: 0 },
    { k: 'th', label: 'Góc ném θ', unit: '°', min: 10, max: 80, step: 1, def: 45, dec: 0, show: (p) => p.mode === 'xien' },
    { k: 'h0', label: 'Độ cao ném h₀', unit: 'm', min: 0, max: 50, step: 1, def: 20, dec: 0 },
  ],
  onChoice(p) { if (p.mode === 'ngang') { p.v0 = 10; p.h0 = 20; } else { p.v0 = 20; p.th = 45; p.h0 = 0; } },
  onParam(p, k) { if (k === 'h0' && p.mode === 'ngang' && p.h0 < 1) p.h0 = 1; },
  toggles: [
    { k: 'vec', label: 'Hiện các vectơ vận tốc', def: true },
    { k: 'dots', label: 'Hiện vị trí sau mỗi 0,5 s', def: true },
    { k: 'ans', label: 'Hiện đường dóng và kết quả T, L, H (sau khi đã dự đoán)', def: false },
  ],
  stageHeight: 300,
  ariaLabel: 'Quả bóng được ném từ vách cao, quỹ đạo parabol, các vectơ vận tốc và thành phần',
  duration: (p) => phys.T(p),
  state(p, t) {
    return { x: phys.x(p, t), y: Math.max(0, phys.y(p, t)), vx: phys.vx(p), vy: phys.vy(p, t), v: phys.speed(p, t) };
  },
  readouts: (p, s) => [['x', fmt(s.x, 2) + ' m'], ['y', fmt(s.y, 2) + ' m'], ['vₓ', fmt(s.vx, 2) + ' m/s'], ['v_y', fmt(s.vy, 2) + ' m/s'], ['v', fmt(s.v, 2) + ' m/s']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const L = phys.L(p), H = phys.H(p), T = phys.T(p);
    const xo = 46, yg = h - 50;
    const ppm = Math.min((w - xo - 24) / Math.max(L, 1), (yg - 30) / Math.max(H, 1), 30);
    const X = (x) => xo + x * ppm, Y = (y) => yg - y * ppm;
    // vách đá và mặt đất
    if (p.h0 > 0) { rect(ctx, 8, Y(p.h0), xo - 8, p.h0 * ppm, th.line, th.axis, 0); }
    ground(ctx, 8, w - 8, yg, th);
    // thước ngang dưới đất
    const sx = [1, 2, 5, 10, 20, 50].find((m) => m * ppm >= 36) || 50;
    ruler(ctx, xo, yg + 14, ppm, 0, Math.floor((w - xo - 40) / ppm / sx) * sx, sx, th, { unit: 'x (m)', labelEvery: 1 });
    // thước đứng
    const sy = [1, 2, 5, 10, 20, 50].find((m) => m * ppm >= 22) || 50;
    ctx.save(); ctx.strokeStyle = th.axis; ctx.fillStyle = th.muted; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let m = sy; m <= H + 1e-9; m += sy) { ctx.beginPath(); ctx.moveTo(xo - 4, Y(m)); ctx.lineTo(xo + 2, Y(m)); ctx.stroke(); ctx.fillText(String(m), xo - 7, Y(m)); }
    ctx.textAlign = 'left'; ctx.fillText('y (m)', 6, 12); ctx.restore();
    // quỹ đạo lí thuyết (nét đứt) và vết đã đi
    ctx.save(); ctx.lineWidth = 1.5; ctx.strokeStyle = th.s2; ctx.setLineDash([4, 4]); ctx.beginPath();
    for (let i = 0; i <= 80; i++) { const tt = (T * i) / 80, px = X(phys.x(p, tt)), py = Y(Math.max(0, phys.y(p, tt))); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 2.5; ctx.strokeStyle = th.accent; ctx.beginPath();
    for (let i = 0; i <= 80; i++) { const tt = (Math.min(t, T) * i) / 80, px = X(phys.x(p, tt)), py = Y(Math.max(0, phys.y(p, tt))); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke(); ctx.restore();
    if (tg.dots) for (let u = 0.5; u <= Math.min(t, T) + 1e-9; u += 0.5) circle(ctx, X(phys.x(p, u)), Y(Math.max(0, phys.y(p, u))), 3, th.card, th.accent);
    if (tg.ans) {
      const tp = phys.tPeak(p);
      line(ctx, xo, Y(H), X(phys.x(p, tp)), Y(H), th.muted, 1, [3, 3]);
      line(ctx, X(L), Y(0), X(L), Y(0) - 18, th.muted, 1, [3, 3]);
      text(ctx, `T = ${fmt(T, 2)} s · L = ${fmt(L, 1)} m · H = ${fmt(H, 1)} m`, w - 10, 16, { color: th.ink, size: 12, align: 'right', bold: true });
    }
    // bóng và vectơ vận tốc (3 px cho 1 m/s, giới hạn độ dài)
    const bx = X(s.x), by = Y(s.y);
    if (tg.vec) {
      const k = Math.min(3, 90 / Math.max(p.v0, 1, Math.abs(s.vy)));
      const lab = (str, x, y, c) => text(ctx, str, Math.max(6, Math.min(w - 14, x)), y, { color: c, size: 12, bold: true });
      arrow(ctx, bx, by, bx + s.vx * k, by, th.s2, 2.5); lab('vₓ', bx + s.vx * k + 3, by - 6, th.s2);
      if (Math.abs(s.vy) > 0.3) { arrow(ctx, bx, by, bx, by - s.vy * k, th.s3, 2.5); lab('v_y', bx + 5, by - s.vy * k + (s.vy > 0 ? 8 : 4), th.s3); }
      arrow(ctx, bx, by, bx + s.vx * k, by - s.vy * k, th.bad, 3); lab('v', bx + s.vx * k + 4, by - s.vy * k - (s.vy > 0 ? 4 : -12), th.bad);
    }
    circle(ctx, bx, by, 6, th.car, th.ink);
  },
  columns: [
    { k: 't', label: 't', unit: 's', dec: 2 }, { k: 'x', label: 'x', unit: 'm', dec: 2 }, { k: 'y', label: 'y', unit: 'm', dec: 2 }, { k: 'vy', label: 'v_y', unit: 'm/s', dec: 2 },
  ],
  recordLabel: 'Ghi số liệu (t, x, y, v_y)',
  note: 'Số liệu lấy từ phân tích video: đồng hồ sai số 0,01 s, vị trí x, y sai số khoảng 0,02 m, vận tốc v_y sai số khoảng 0,15 m/s. Ghi ít nhất 6 lần ở các thời điểm khác nhau trong lúc bay.',
  record: (p, s, t, n) => ({
    t: n.round(t + n.noise(0.01), 0.01), x: n.round(s.x + n.noise(0.02), 0.01), y: n.round(s.y + n.noise(0.02), 0.01), vy: n.round(s.vy + n.noise(0.15), 0.01),
  }),
  graphs: [
    { title: 'Đồ thị x – t', xlabel: 't (s)', ylabel: 'x (m)', x: 't', y: 'x', fit: true, dec: 3, zeroX: true, zeroY: true, curve: (p) => [[0, 0], [phys.T(p), phys.L(p)]], marker: (p, s, t) => [t, s.x] },
    { title: 'Đồ thị v_y – t', xlabel: 't (s)', ylabel: 'v_y (m/s)', x: 't', y: 'vy', fit: true, dec: 3, zeroX: true, zeroY: true, curve: (p) => [[0, phys.vy0(p)], [phys.T(p), phys.vy(p, phys.T(p))]], marker: (p, s, t) => [t, s.vy] },
    { title: 'Đồ thị y – t', xlabel: 't (s)', ylabel: 'y (m)', x: 't', y: 'y', zeroX: true, zeroY: true, curve: (p) => Array.from({ length: 41 }, (_, i) => { const tt = (phys.T(p) * i) / 40; return [tt, Math.max(0, phys.y(p, tt))]; }), marker: (p, s, t) => [t, s.y] },
  ],
  predict: {
    prompt: '<p>Với kiểu ném và các giá trị đang chọn, hãy dự đoán <b>thời gian bay T</b> (đến khi chạm đất), <b>tầm xa L</b> và <b>độ cao cực đại H</b> của bóng so với mặt đất. Có thể dùng mô phỏng để nghiệm lại sau khi nộp.</p>',
    fields: [{ k: 'T', label: 'Thời gian bay T', unit: 's' }, { k: 'L', label: 'Tầm xa L', unit: 'm', dec: 1 }, { k: 'H', label: 'Độ cao cực đại H', unit: 'm', dec: 1 }],
    expected: (p) => ({ T: phys.T(p), L: phys.L(p), H: phys.H(p) }), tol: 0.03, absTol: 0.05,
    explain: (p) => `T: giải y = 0 → T = ${fmt(phys.T(p), 2)} s; L = vₓ·T = ${fmt(phys.vx(p), 2)}·${fmt(phys.T(p), 2)} = ${fmt(phys.L(p), 1)} m; H = h₀ + v<sub>y0</sub>²/(2g) = ${fmt(phys.H(p), 1)} m.`,
  },
  tasks: [
    {
      title: 'Xử lí số liệu: các thành phần vận tốc và g',
      prompt: '<p>Ghi ít nhất 6 lần đo. Đọc ở chú thích dưới đồ thị: <b>độ dốc của x – t</b> là vₓ; với đồ thị v<sub>y</sub> – t, <b>tung độ gốc</b> là v<sub>y0</sub> và <b>độ dốc</b> bằng −g (nhập g là số dương).</p>',
      fields: [{ k: 'vx', label: 'vₓ', unit: 'm/s' }, { k: 'vy0', label: 'v_y0', unit: 'm/s' }, { k: 'g', label: 'g', unit: 'm/s²' }],
      minRows: 6, tol: 0.03, absTol: 0.1,
      expected: (p, rows) => {
        const fx = linearFit(rows.map((r) => [r.t, r.x])), fy = linearFit(rows.map((r) => [r.t, r.vy]));
        return { vx: fx.slope, vy0: fy.intercept, g: -fy.slope };
      },
      reference: (p) => `Giá trị cài đặt: vₓ = ${fmt(phys.vx(p), 2)} m/s, v<sub>y0</sub> = ${fmt(phys.vy0(p), 2)} m/s, g = 9,8 m/s².`,
    },
    {
      title: 'Xử lí số liệu: tốc độ ném v₀ và góc ném θ',
      prompt: '<p>Từ vₓ và v<sub>y0</sub> vừa tìm được (đọc lại ở chú thích hai đồ thị), tính <b>v₀ = √(vₓ² + v<sub>y0</sub>²)</b> và <b>góc ném θ</b> với tanθ = v<sub>y0</sub>/vₓ (đơn vị độ).</p>',
      fields: [{ k: 'v0', label: 'v₀', unit: 'm/s' }, { k: 'th', label: 'θ', unit: '°', dec: 1, absTol: 1 }],
      minRows: 6, tol: 0.03, absTol: 0.2,
      expected: (p, rows) => {
        const fx = linearFit(rows.map((r) => [r.t, r.x])), fy = linearFit(rows.map((r) => [r.t, r.vy]));
        return { v0: Math.hypot(fx.slope, fy.intercept), th: (Math.atan2(fy.intercept, fx.slope) * 180) / Math.PI };
      },
      reference: (p) => `Giá trị cài đặt: v₀ = ${fmt(p.v0, 0)} m/s, θ = ${fmt(phys.ang(p), 0)}°.`,
    },
  ],
  quiz: [
    { q: 'Bỏ qua sức cản không khí, trong chuyển động ném thành phần vận tốc theo phương ngang:', o: ['tăng dần', 'không đổi', 'giảm dần'], a: 1, why: 'Theo phương ngang không có lực tác dụng (a = 0) nên vₓ không đổi.' },
    { q: 'Ném ngang một vật từ độ cao 45 m. Thời gian bay là (g = 9,8 m/s²):', o: ['3,03 s', '4,5 s', '9,2 s'], a: 0, why: 'T = √(2h₀/g) = √(90/9,8) ≈ 3,03 s.' },
    { q: 'Hai vật cùng được thả/ném ngang từ cùng độ cao, vật 1 thả không vận tốc đầu, vật 2 ném ngang với 10 m/s. Vật nào chạm đất trước?', o: ['Vật 1', 'Vật 2', 'Cùng lúc'], a: 2, why: 'Theo phương thẳng đứng hai vật chuyển động giống nhau (rơi tự do) nên chạm đất cùng lúc.' },
    { q: 'Ném xiên lên với v₀ = 20 m/s, θ = 30° từ mặt đất. Độ cao cực đại là:', o: ['5,1 m', '10,2 m', '20,4 m'], a: 0, why: 'v_y0 = 20·sin30° = 10 m/s; H = 10²/(2·9,8) ≈ 5,1 m.' },
    { q: 'Với cùng tốc độ ném và ném từ mặt đất, tầm xa lớn nhất khi góc ném bằng:', o: ['30°', '45°', '60°'], a: 1, why: 'L = v₀²sin2θ/g lớn nhất khi sin2θ = 1, tức θ = 45°.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

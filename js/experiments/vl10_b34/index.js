// Vật lí 10 – Bài 34: Khối lượng riêng. Áp suất chất lỏng.
// Ba hoạt động trong cùng một bảng số liệu: (1) áp suất theo độ sâu, (2) khối lượng riêng ρ = m/V, (3) bình thông nhau.
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, line, rect, circle } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
const G = 9.8, P0 = 101300;                       // g (m/s²), áp suất khí quyển p₀ (Pa)
const RHO_W = 1000;                               // khối lượng riêng của nước (kg/m³)
const LIQ = [                                      // chất lỏng cho hoạt động 1 và 2
  { name: 'Nước', rho: 1000, col: 'rgba(40,130,240,0.38)' },
  { name: 'Nước biển', rho: 1030, col: 'rgba(20,100,200,0.45)' },
  { name: 'Dầu ăn', rho: 920, col: 'rgba(235,190,30,0.45)' },
  { name: 'Rượu etylic', rho: 790, col: 'rgba(160,200,230,0.40)' },
  { name: 'Glixerin', rho: 1260, col: 'rgba(120,200,160,0.42)' },
  { name: 'Thủy ngân', rho: 13600, col: 'rgba(140,150,165,0.70)' },
];
const LIQ2 = [                                     // chất lỏng không tan trong nước, dùng cho bình thông nhau
  { name: 'Dầu ăn', rho: 920, col: 'rgba(235,190,30,0.50)' },
  { name: 'Dầu hỏa', rho: 800, col: 'rgba(230,140,60,0.42)' },
];
const WATER_COL = 'rgba(40,130,240,0.38)';

export const phys = {
  G, P0, RHO_W, LIQ, LIQ2,
  rho: (p) => (p.mode === 2 ? LIQ2[p.liq2] : LIQ[p.liq]).rho,
  gauge: (rho, h) => rho * G * h,                                // áp suất do cột chất lỏng ρgh (Pa)
  pressure: (rho, h) => P0 + rho * G * h,                        // áp suất tại độ sâu h: p = p₀ + ρgh (Pa)
  mass: (rho, V) => (rho * V) / 1000,                            // m (g) của V (cm³) chất lỏng khối lượng riêng ρ (kg/m³): ρ = m/V
  hWater: (rhoX, hx) => (rhoX * hx) / RHO_W,                     // bình thông nhau: ρ_nước·h₁ = ρ_X·h₂
  // Một lần đo trong hoạt động đang chọn; n = {noise(sigma), round(v, step)}.
  sample(p, n) {
    const rho = phys.rho(p);
    if (p.mode === 0) {
      return { h: n.round(p.h + n.noise(0.0005), 0.001), p: n.round((phys.pressure(rho, p.h) + n.noise(100)) / 1000, 0.1) };
    }
    if (p.mode === 1) {
      return { V: n.round(p.V + n.noise(0.25), 0.5), m: n.round(phys.mass(rho, p.V) + n.noise(0.15), 0.1) };
    }
    return { h2: n.round(p.hx + n.noise(0.0005), 0.001), h1: n.round(phys.hWater(rho, p.hx) + n.noise(0.0005), 0.001) };
  },
};

const fin = (...ks) => (r) => ks.every((k) => Number.isFinite(r[k]));
const originSlope = (pts) => { let sxy = 0, sxx = 0; for (const [x, y] of pts) { sxy += x * y; sxx += x * x; } return sxx ? sxy / sxx : NaN; };
const lineFit = (pts) => {
  const n = pts.length, mx = pts.reduce((s, q) => s + q[0], 0) / n, my = pts.reduce((s, q) => s + q[1], 0) / n;
  let sxx = 0, sxy = 0; for (const [x, y] of pts) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); }
  const slope = sxy / sxx; return { slope, intercept: my - slope * mx };
};
const spread = (rows, k) => { const v = rows.map((r) => r[k]); return Math.max(...v) - Math.min(...v); };

export const spec = {
  seed: 3434,
  intro: 'Ba hoạt động trên cùng một bảng số liệu: đo áp suất ở các độ sâu khác nhau trong bể chất lỏng, đo khối lượng và thể tích để tìm khối lượng riêng, và quan sát bình thông nhau chứa nước và một chất lỏng khác.',
  goals: [
    'Tính khối lượng riêng ρ = m/V và nhận biết chất lỏng qua ρ.',
    'Khảo sát áp suất chất lỏng theo độ sâu: p = p₀ + ρgh; xác định ρ và p₀ từ đồ thị p – h.',
    'Vận dụng nguyên lí bình thông nhau: các điểm cùng độ cao trong chất lỏng đứng yên có cùng áp suất.',
  ],
  theory: 'ρ = m/V (kg/m³; 1 g/cm³ = 1000 kg/m³) &nbsp;&nbsp; p = p₀ + ρgh &nbsp;&nbsp; p₀ ≈ 101,3 kPa &nbsp;&nbsp; g = 9,8 m/s²<br>Bình thông nhau: ρ₁h₁ = ρ₂h₂ (h đo từ mặt phẳng ngang đi qua mặt phân cách).',
  setup: 'Chọn hoạt động ở ô “Hoạt động”; số liệu của ba hoạt động cùng nằm trong một bảng. Đổi chất lỏng sẽ xóa bảng. Cân đã trừ bì (khối lượng ống đong).',
  choices: [
    { k: 'mode', label: 'Hoạt động', options: [[0, '1. Áp suất theo độ sâu'], [1, '2. Khối lượng riêng ρ = m/V'], [2, '3. Bình thông nhau (nước và chất lỏng X)']], def: 0, keepRows: true },
    { k: 'liq', label: 'Chất lỏng', options: LIQ.map((l, i) => [i, l.name]), def: 0, show: (p) => p.mode !== 2 },
    { k: 'liq2', label: 'Chất lỏng X (không tan trong nước)', options: LIQ2.map((l, i) => [i, l.name]), def: 0, show: (p) => p.mode === 2 },
  ],
  params: [
    { k: 'h', label: 'Độ sâu h của đầu đo áp suất', unit: 'm', min: 0, max: 0.8, step: 0.05, def: 0.3, dec: 2, show: (p) => p.mode === 0 },
    { k: 'V', label: 'Thể tích chất lỏng V', unit: 'cm³', min: 10, max: 100, step: 5, def: 50, dec: 0, show: (p) => p.mode === 1 },
    { k: 'hx', label: 'Chiều cao cột chất lỏng X (h₂)', unit: 'm', min: 0.04, max: 0.3, step: 0.02, def: 0.2, dec: 2, show: (p) => p.mode === 2 },
  ],
  toggles: [{ k: 'vec', label: 'Hiện hướng của áp suất (hoạt động 1)', def: true }],
  stageHeight: 340,
  ariaLabel: 'Bể chất lỏng có đầu đo áp suất, ống đong đặt trên cân, hoặc ống chữ U chứa nước và chất lỏng X, tùy hoạt động được chọn',
  init: (p) => { p.mode = 0; },
  state(p) {
    const rho = phys.rho(p);
    return { rho, pAbs: phys.pressure(rho, p.h), pg: phys.gauge(rho, p.h), m: phys.mass(rho, p.V), hw: phys.hWater(rho, p.hx) };
  },
  readouts: (p, s) => (p.mode === 0 ? [['h', fmt(p.h, 2) + ' m'], ['p', fmt(s.pAbs / 1000, 1) + ' kPa']]
    : p.mode === 1 ? [['V', fmt(p.V, 0) + ' cm³'], ['m', fmt(s.m, 1) + ' g']]
      : [['h₂', fmt(p.hx, 3) + ' m'], ['h₁', fmt(s.hw, 3) + ' m']]),
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const liq = p.mode === 2 ? LIQ2[p.liq2] : LIQ[p.liq];
    if (p.mode === 0) drawTank(ctx, w, h, s, p, th, tg, liq);
    else if (p.mode === 1) drawCylinder(ctx, w, h, s, p, th, liq);
    else drawU(ctx, w, h, s, p, th, liq);
  },
  columns: [
    { k: 'h', label: 'h', unit: 'm', dec: 3 }, { k: 'p', label: 'p', unit: 'kPa', dec: 1 },
    { k: 'V', label: 'V', unit: 'cm³', dec: 1 }, { k: 'm', label: 'm', unit: 'g', dec: 1 },
    { k: 'h1', label: 'h₁ (nước)', unit: 'm', dec: 3 }, { k: 'h2', label: 'h₂ (chất lỏng X)', unit: 'm', dec: 3 },
  ],
  recordLabel: 'Ghi số liệu',
  note: 'Cảm biến áp suất chia đến 0,1 kPa; thước chia đến 1 mm; ống đong đọc đến 0,5 cm³; cân chia đến 0,1 g. Mỗi hoạt động chỉ điền các cột của nó, các cột còn lại hiện “—”.',
  record: (p, s, t, n) => phys.sample(p, n),
  graphs: [
    { title: 'Hoạt động 1: đồ thị p – h', xlabel: 'h (m)', ylabel: 'p (kPa)', x: 'h', y: 'p', fit: true, dec: 3, marker: (p, s) => (p.mode === 0 ? [p.h, s.pAbs / 1000] : null), zeroX: true },
    { title: 'Hoạt động 2: đồ thị m – V', xlabel: 'V (cm³)', ylabel: 'm (g)', x: 'V', y: 'm', fit: 'origin', dec: 3, marker: (p, s) => (p.mode === 1 ? [p.V, s.m] : null), zeroX: true, zeroY: true },
    { title: 'Hoạt động 3: đồ thị h₁ – h₂', xlabel: 'h₂ (m)', ylabel: 'h₁ (m)', x: 'h2', y: 'h1', fit: 'origin', dec: 3, marker: (p, s) => (p.mode === 2 ? [p.hx, s.hw] : null), zeroX: true, zeroY: true },
  ],
  predict: {
    prompt: '<p>Một bể chứa nước (ρ = 1000 kg/m³) ở nơi có áp suất khí quyển p₀ = 101,3 kPa. Tính áp suất do cột nước và áp suất tuyệt đối tại điểm ở độ sâu <b>0,60 m</b> (g = 9,8 m/s²).</p>',
    fields: [{ k: 'pg', label: 'Áp suất do cột nước ρgh', unit: 'kPa', dec: 2 }, { k: 'p', label: 'Áp suất tuyệt đối p', unit: 'kPa', dec: 1 }],
    expected: () => ({ pg: (RHO_W * G * 0.6) / 1000, p: P0 / 1000 + (RHO_W * G * 0.6) / 1000 }), tol: 0.01, absTol: 0.05,
    explain: () => 'ρgh = 1000 × 9,8 × 0,60 = 5880 Pa ≈ 5,88 kPa; p = p₀ + ρgh = 101,3 + 5,88 ≈ 107,2 kPa.',
  },
  tasks: [{
    title: 'Xử lí số liệu 1: áp suất theo độ sâu (hoạt động 1)',
    prompt: '<p>Ở hoạt động 1, ghi ít nhất 5 lần đo với độ sâu khác nhau (độ sâu lớn nhất hơn nhỏ nhất ít nhất 0,3 m). Đồ thị p – h là đường thẳng: <b>hệ số góc = ρg</b> (kPa/m), <b>tung độ gốc = p₀</b>. Đọc ở chú thích dưới đồ thị rồi tính ρ = hệ số góc × 1000 / g (g = 9,8 m/s²).</p>',
    fields: [{ k: 'rho', label: 'Khối lượng riêng ρ', unit: 'kg/m³', dec: 0, absTol: 5 }, { k: 'p0', label: 'Áp suất p₀', unit: 'kPa', dec: 1, absTol: 0.2 }],
    tol: 0.03,
    need: (rows) => { const r = rows.filter(fin('h', 'p')); return r.length < 5 ? 'Cần ít nhất 5 lần đo ở hoạt động 1.' : spread(r, 'h') < 0.3 ? 'Hãy ghi ở các độ sâu cách nhau hơn (chênh lệch ≥ 0,3 m).' : null; },
    expected: (p, rows) => { const f = lineFit(rows.filter(fin('h', 'p')).map((r) => [r.h, r.p])); return { rho: (f.slope * 1000) / G, p0: f.intercept }; },
    explain: (p, rows, exp) => `p = p₀ + ρg·h nên hệ số góc = ρg: ρ = ${fmt(exp.rho * G / 1000, 3)} × 1000 / 9,8 = ${fmt(exp.rho, 0)} kg/m³; tung độ gốc p₀ = ${fmt(exp.p0, 1)} kPa.`,
    reference: (p) => `Giá trị cài đặt: ρ = ${fmt(phys.rho({ ...p, mode: 0 }), 0)} kg/m³ (${LIQ[p.liq].name}), p₀ = 101,3 kPa.`,
  }, {
    title: 'Xử lí số liệu 2: khối lượng riêng (hoạt động 2)',
    prompt: '<p>Ở hoạt động 2, ghi ít nhất 4 lần đo với các thể tích khác nhau. Đồ thị m – V là đường thẳng qua gốc, <b>hệ số góc = ρ</b> tính bằng g/cm³. Đổi sang kg/m³ (1 g/cm³ = 1000 kg/m³).</p>',
    fields: [{ k: 'g', label: 'ρ', unit: 'g/cm³', dec: 3, absTol: 0.005 }, { k: 'rho', label: 'ρ', unit: 'kg/m³', dec: 0, absTol: 5 }],
    tol: 0.03,
    need: (rows) => { const r = rows.filter(fin('V', 'm')); return r.length < 4 ? 'Cần ít nhất 4 lần đo ở hoạt động 2.' : spread(r, 'V') < 30 ? 'Hãy đổi thể tích V nhiều hơn (chênh lệch ≥ 30 cm³).' : null; },
    expected: (p, rows) => { const k = originSlope(rows.filter(fin('V', 'm')).map((r) => [r.V, r.m])); return { g: k, rho: k * 1000 }; },
    explain: (p, rows, exp) => `ρ = m/V = hệ số góc = ${fmt(exp.g, 3)} g/cm³ = ${fmt(exp.rho, 0)} kg/m³.`,
    reference: (p) => `Giá trị cài đặt: ρ = ${fmt(LIQ[p.liq].rho, 0)} kg/m³ (${LIQ[p.liq].name}). Chất lỏng em đo có thể là chất nào trong danh sách?`,
  }, {
    title: 'Xử lí số liệu 3: bình thông nhau (hoạt động 3)',
    prompt: '<p>Ở hoạt động 3, ghi ít nhất 4 lần đo với chiều cao cột X khác nhau. Áp suất tại mặt phẳng ngang qua mặt phân cách hai bên bằng nhau: ρ<sub>nước</sub>·h₁ = ρ<sub>X</sub>·h₂, nên <b>hệ số góc của đồ thị h₁ – h₂ bằng ρ<sub>X</sub>/ρ<sub>nước</sub></b>. Tính ρ<sub>X</sub> (ρ<sub>nước</sub> = 1000 kg/m³).</p>',
    fields: [{ k: 'ratio', label: 'ρ_X / ρ_nước', unit: '', dec: 3, absTol: 0.005 }, { k: 'rho', label: 'ρ_X', unit: 'kg/m³', dec: 0, absTol: 5 }],
    tol: 0.03,
    need: (rows) => { const r = rows.filter(fin('h1', 'h2')); return r.length < 4 ? 'Cần ít nhất 4 lần đo ở hoạt động 3.' : spread(r, 'h2') < 0.1 ? 'Hãy đổi chiều cao cột X nhiều hơn (chênh lệch ≥ 0,1 m).' : null; },
    expected: (p, rows) => { const k = originSlope(rows.filter(fin('h1', 'h2')).map((r) => [r.h2, r.h1])); return { ratio: k, rho: k * RHO_W }; },
    explain: (p, rows, exp) => `Từ ρ_nước·h₁ = ρ_X·h₂: h₁ = (ρ_X/ρ_nước)·h₂, hệ số góc = ${fmt(exp.ratio, 3)} nên ρ_X = ${fmt(exp.ratio, 3)} × 1000 = ${fmt(exp.rho, 0)} kg/m³.`,
    reference: (p) => `Giá trị cài đặt: ${LIQ2[p.liq2].name}, ρ = ${fmt(LIQ2[p.liq2].rho, 0)} kg/m³.`,
  }],
  demo: async (api) => {
    api.p.mode = 0; for (let i = 0; i < 8; i++) { api.setParam('h', 0.1 * i + 0.05); api.record(); }
    api.p.mode = 1; for (let i = 0; i < 7; i++) { api.setParam('V', 10 + 15 * i); api.record(); }
    api.p.mode = 2; for (let i = 0; i < 7; i++) { api.setParam('hx', 0.04 + 0.04 * i); api.record(); }
  },
  quiz: [
    { q: '200 g chất lỏng chiếm thể tích 250 cm³. Khối lượng riêng của chất lỏng là:', o: ['1250 kg/m³', '800 kg/m³', '0,8 kg/m³'], a: 1, why: 'ρ = m/V = 200/250 = 0,8 g/cm³ = 800 kg/m³.' },
    { q: 'Áp suất do cột nước cao 2 m gây ra (ρ = 1000 kg/m³, g = 9,8 m/s²) là:', o: ['9800 Pa', '19 600 Pa', '196 000 Pa'], a: 1, why: 'p = ρgh = 1000 × 9,8 × 2 = 19 600 Pa.' },
    { q: 'Hai điểm cùng độ sâu trong một chất lỏng đồng chất, đứng yên có áp suất:', o: ['bằng nhau', 'điểm ở gần thành bình lớn hơn', 'khác nhau tùy vị trí ngang'], a: 0, why: 'p = p₀ + ρgh chỉ phụ thuộc độ sâu h (và ρ), không phụ thuộc vị trí theo phương ngang.' },
    { q: 'Ống chữ U chứa nước và dầu ăn (nhẹ hơn nước) ở hai nhánh, tính từ mặt phân cách thì:', o: ['hai cột cao bằng nhau', 'cột nước cao hơn cột dầu', 'cột dầu cao hơn cột nước'], a: 2, why: 'ρ_nước·h₁ = ρ_dầu·h₂ và ρ_dầu < ρ_nước nên h₂ > h₁.' },
    { q: 'Lặn sâu thêm 10 m trong nước (ρ = 1000 kg/m³) thì áp suất tăng thêm khoảng:', o: ['9,8 kPa', '98 kPa', '980 kPa'], a: 1, why: 'Δp = ρgΔh = 1000 × 9,8 × 10 = 98 000 Pa = 98 kPa (xấp xỉ một atm).' },
  ],
};

// ---- Cảnh vẽ ----
const hatch = (ctx, x0, x1, y, th) => { for (let x = x0; x < x1; x += 9) line(ctx, x, y, x - 6, y + 7, th.axis, 1); };

function drawTank(ctx, w, h, s, p, th, tg, liq) {
  const x0 = 56, x1 = w - 16, ys = 52, yb = h - 20, ppm = (yb - ys) / 0.9, px = (x0 + x1) / 2, py = ys + p.h * ppm;
  ctx.fillStyle = liq.col; ctx.fillRect(x0, ys, x1 - x0, yb - ys);
  ctx.save(); ctx.strokeStyle = th.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x0, ys - 14); ctx.lineTo(x0, yb); ctx.lineTo(x1, yb); ctx.lineTo(x1, ys - 14); ctx.stroke(); ctx.restore();
  line(ctx, x0, ys, x1, ys, th.accent, 1.5);
  text(ctx, liq.name, x1 - 8, yb - 8, { color: th.ink, size: 12, align: 'right', bold: true });
  // thước độ sâu bên trái bể, gốc ở mặt thoáng
  line(ctx, 48, ys, 48, yb, th.axis, 1);
  for (let d = 0; d <= 0.9001; d += 0.1) { const y = ys + d * ppm; line(ctx, 42, y, 48, y, th.axis, 1); text(ctx, fmt(d, 1), 38, y + 4, { color: th.muted, size: 10, align: 'right' }); }
  text(ctx, 'h (m)', 48, ys - 8, { color: th.muted, size: 10, align: 'center' });
  // khí quyển tác dụng lên mặt thoáng
  for (let i = 0; i < 3; i++) arrow(ctx, x1 - 30 - i * 26, 12, x1 - 30 - i * 26, ys - 4, th.muted, 2, 6);
  text(ctx, 'p₀', x1 - 30 - 3 * 26 + 10, 30, { color: th.muted, size: 12, bold: true, align: 'right' });
  // đầu đo
  line(ctx, px, 12, px, py, th.ink, 4);
  circle(ctx, px, py, 9, th.car, th.ink);
  if (tg.vec) {
    const L = 8 + 14 * (p.h / 0.8);
    arrow(ctx, px - 11 - L, py, px - 11, py, th.s3, 2, 6); arrow(ctx, px + 11 + L, py, px + 11, py, th.s3, 2, 6);
    arrow(ctx, px, py + 11 + L, px, py + 11, th.s3, 2, 6);
    if (py - 11 - L > ys + 2) arrow(ctx, px, py - 11 - L, px, py - 11, th.s3, 2, 6);
  }
  line(ctx, x0, py, px - 11, py, th.accent, 1, [3, 3]);
  if (p.h > 0.02) {
    const xa = x0 + 22; arrow(ctx, xa, ys, xa, py, th.accent, 2, 6);
    text(ctx, 'h', xa + 6, (ys + py) / 2 + 4, { color: th.accent, size: 13, bold: true });
  }
  text(ctx, 'p = ' + fmt(s.pAbs / 1000, 1) + ' kPa', x0, 20, { color: th.s3, size: 13, bold: true });
}

function drawCylinder(ctx, w, h, s, p, th, liq) {
  const cx = Math.max(96, w * 0.3), top = 22, yc = h - 66, cw = 56, ppV = (yc - top - 6) / 100;
  const yl = yc - p.V * ppV;
  // cân
  rect(ctx, cx - 76, yc, 152, 20, th.line, th.axis, 5);
  rect(ctx, cx - 56, yc + 24, 112, 26, th.card, th.ink, 5);
  text(ctx, fmt(s.m, 1) + ' g', cx, yc + 42, { color: th.ok, size: 15, bold: true, align: 'center' });
  // ống đong
  ctx.fillStyle = liq.col; ctx.fillRect(cx - cw / 2, yl, cw, yc - yl);
  ctx.save(); ctx.strokeStyle = th.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - cw / 2, top); ctx.lineTo(cx - cw / 2, yc); ctx.lineTo(cx + cw / 2, yc); ctx.lineTo(cx + cw / 2, top); ctx.stroke(); ctx.restore();
  line(ctx, cx - cw / 2, yl, cx + cw / 2, yl, th.ink, 1.5);
  for (let v = 0; v <= 100; v += 5) {
    const y = yc - v * ppV, big = v % 10 === 0;
    line(ctx, cx + cw / 2 - (big ? 12 : 7), y, cx + cw / 2, y, th.axis, 1);
    if (v % 20 === 0 && v > 0) text(ctx, String(v), cx + cw / 2 + 5, y + 4, { color: th.muted, size: 10 });
  }
  text(ctx, 'cm³', cx + cw / 2 + 5, top - 4, { color: th.muted, size: 10 });
  // thông tin
  const x = cx + cw / 2 + 40;
  text(ctx, 'Chất lỏng:', x, 56, { color: th.muted, size: 12 });
  text(ctx, liq.name, x, 76, { color: th.ink, size: 15, bold: true });
  text(ctx, 'V = ' + fmt(p.V, 0) + ' cm³', x, 112, { color: th.accent, size: 14, bold: true });
  text(ctx, 'm = ' + fmt(s.m, 1) + ' g', x, 136, { color: th.ok, size: 14, bold: true });
  text(ctx, 'ρ = m / V', x, 172, { color: th.muted, size: 13 });
}

function drawU(ctx, w, h, s, p, th, liq) {
  const xL = Math.max(100, w * 0.28), xR = xL + 118, aw = 18, top = 22, plane = h - 96, ppm = (plane - top - 22) / 0.31;
  const yw = plane - s.hw * ppm, yx = plane - p.hx * ppm, bot = plane + 62;
  // nước: nhánh trái, đáy chữ U, phần dưới mặt phân cách của nhánh phải
  ctx.fillStyle = WATER_COL;
  ctx.fillRect(xL - aw, yw, 2 * aw, plane + 32 - yw);                 // nhánh trái
  ctx.fillRect(xL - aw, plane + 32, xR - xL + 2 * aw, bot - plane - 32);  // đáy chữ U
  ctx.fillRect(xR - aw, plane, 2 * aw, 32);                             // nhánh phải, dưới mặt phân cách
  ctx.fillStyle = liq.col; ctx.fillRect(xR - aw, yx, 2 * aw, plane - yx);
  ctx.save(); ctx.strokeStyle = th.ink; ctx.lineWidth = 2.5; ctx.beginPath();
  ctx.moveTo(xL - aw, top); ctx.lineTo(xL - aw, bot); ctx.lineTo(xR + aw, bot); ctx.lineTo(xR + aw, top);
  ctx.moveTo(xL + aw, top); ctx.lineTo(xL + aw, plane + 32); ctx.lineTo(xR - aw, plane + 32); ctx.lineTo(xR - aw, top); ctx.stroke(); ctx.restore();
  // mặt phẳng ngang qua mặt phân cách và thước (gốc 0 ở mặt phẳng đó)
  const xr = w - 46;
  line(ctx, xL - aw - 14, plane, xr, plane, th.bad, 1.5, [5, 4]);
  line(ctx, xr, plane, xr, top, th.axis, 1);
  for (let v = 0; v <= 0.3001; v += 0.01) {
    const y = plane - v * ppm, big = Math.abs(v / 0.05 - Math.round(v / 0.05)) < 1e-6;
    line(ctx, xr, y, xr + (big ? 8 : 4), y, th.axis, 1);
    if (big) text(ctx, fmt(v, 2), xr + 11, y + 4, { color: th.muted, size: 10 });
  }
  text(ctx, 'm', xr + 11, top - 6, { color: th.muted, size: 10 });
  text(ctx, 'cùng áp suất', xL + (xR - xL) / 2, plane - 6, { color: th.bad, size: 11, align: 'center' });
  // chiều cao các cột
  const xa = xL - aw - 14, xb = xR + aw + 14;
  arrow(ctx, xa, plane, xa, yw, th.accent, 2, 6); text(ctx, 'h₁', xa - 5, (plane + yw) / 2 + 4, { color: th.accent, size: 13, bold: true, align: 'right' });
  arrow(ctx, xb, plane, xb, yx, th.car, 2, 6); text(ctx, 'h₂', xb + 5, (plane + yx) / 2 + 4, { color: th.car, size: 13, bold: true });
  text(ctx, 'Nước', xL, yw - 7, { color: th.ink, size: 12, align: 'center', bold: true });
  text(ctx, liq.name, xR, yx - 7, { color: th.ink, size: 12, align: 'center', bold: true });
}

export const mount = (root, entry) => mountLab(root, entry, spec);

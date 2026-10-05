// Vật lí 10 – Bài 27: Hiệu suất.
// Ba máy: palăng (ròng rọc), mặt phẳng nghiêng, động cơ điện nâng vật. Đo Wci, Wtp; H = Wci/Wtp; sơ đồ Sankey.
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, rect, line, circle } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
export const G = 9.8;
const TMAX = 5;
const rad = (a) => (a * Math.PI) / 180;
export const phys = {
  G, TMAX,
  // Hiệu suất của từng máy
  eff(p) {
    if (p.mode === 'pulley') return (p.m * (1 - p.f / 100)) / (p.m + p.mr);          // Wtp = (m + m_r)·g·h / (1 − f)
    if (p.mode === 'incline') return 1 / (1 + p.mu / Math.tan(rad(p.ang)));         // F = mg(sinθ + μcosθ), Wtp = F·ℓ
    return p.eta / 100;                                                             // động cơ: P_ci = η·P_điện
  },
  height: (p, t) => (p.mode === 'motor' ? (phys.eff(p) * p.Pin * t) / (p.m * G) : (p.hh * t) / TMAX),
  at(p, t) {
    const h = phys.height(p, t), Wci = p.m * G * h, H = phys.eff(p);
    return { h, Wci, Wtp: Wci / H, Whp: Wci / H - Wci, H };
  },
  hFinal: (p) => phys.height(p, TMAX),
};
const slopeOrigin = (pts) => { let sxy = 0, sxx = 0; for (const [x, y] of pts) { sxy += x * y; sxx += x * x; } return sxx ? sxy / sxx : 0; };
const MODE_NAME = { pulley: 'palăng (ròng rọc)', incline: 'mặt phẳng nghiêng', motor: 'động cơ điện' };

export const spec = {
  seed: 2727,
  intro: 'Mỗi máy khi hoạt động đều nhận năng lượng toàn phần Wtp nhưng chỉ một phần trở thành năng lượng có ích Wci (nâng vật), phần còn lại hao phí. Em đo Wci và Wtp để tìm hiệu suất của từng máy.',
  goals: [
    'Phân biệt năng lượng có ích, năng lượng hao phí và năng lượng toàn phần.',
    'Tính hiệu suất H = Wci/Wtp từ số liệu đo và từ đồ thị Wci – Wtp.',
    'Giải thích vì sao hiệu suất của máy thực luôn nhỏ hơn 100% (định luật bảo toàn năng lượng: Wtp = Wci + Whp).',
  ],
  theory: 'Hiệu suất: <b>H = Wci / Wtp</b> (hoặc H = Pci / Ptp), thường viết bằng phần trăm, luôn H &lt; 100%.<br>' +
    'Năng lượng hao phí: <b>Whp = Wtp − Wci</b> (chủ yếu thành nhiệt do ma sát).<br>' +
    'Nâng vật: Wci = m·g·h (g = 9,8 m/s²).',
  setup: 'Chọn loại máy. Máy nâng vật khối lượng m đều lên cao trong 5 s. “Cảm biến” ghi năng lượng có ích Wci (chính là thế năng thu được của vật) và năng lượng toàn phần Wtp mà máy nhận. Bấm “Ghi số liệu” ở nhiều thời điểm.',
  choices: [{ k: 'mode', label: 'Loại máy', string: true, options: [['pulley', 'Palăng (ròng rọc)'], ['incline', 'Mặt phẳng nghiêng'], ['motor', 'Động cơ điện']], def: 'pulley' }],
  params: [
    { k: 'm', label: 'Khối lượng vật m', unit: 'kg', min: 5, max: 50, step: 5, def: 20, dec: 0 },
    { k: 'hh', label: 'Độ cao nâng vật', unit: 'm', min: 1, max: 4, step: 0.5, def: 2, dec: 1, show: (p) => p.mode !== 'motor' },
    { k: 'n', label: 'Số đoạn dây treo vật', unit: '', min: 2, max: 4, step: 1, def: 2, dec: 0, show: (p) => p.mode === 'pulley' },
    { k: 'mr', label: 'Khối lượng ròng rọc động + móc', unit: 'kg', min: 0.5, max: 4, step: 0.5, def: 1, dec: 1, show: (p) => p.mode === 'pulley' },
    { k: 'f', label: 'Hao phí do ma sát ở trục', unit: '%', min: 0, max: 20, step: 2, def: 8, dec: 0, show: (p) => p.mode === 'pulley' },
    { k: 'ang', label: 'Góc nghiêng của dốc', unit: '°', min: 15, max: 45, step: 5, def: 25, dec: 0, show: (p) => p.mode === 'incline' },
    { k: 'mu', label: 'Hệ số ma sát μ', unit: '', min: 0.05, max: 0.4, step: 0.05, def: 0.2, dec: 2, show: (p) => p.mode === 'incline' },
    { k: 'Pin', label: 'Công suất điện cấp vào', unit: 'W', min: 200, max: 1000, step: 100, def: 500, dec: 0, show: (p) => p.mode === 'motor' },
    { k: 'eta', label: 'Chất lượng động cơ (hiệu suất cài sẵn)', unit: '%', min: 50, max: 95, step: 5, def: 70, dec: 0, show: (p) => p.mode === 'motor' },
  ],
  clearOnParam: ['m', 'hh', 'n', 'mr', 'f', 'ang', 'mu', 'Pin', 'eta'],
  toggles: [],
  stageHeight: 340,
  ariaLabel: 'Máy nâng vật (palăng, mặt phẳng nghiêng hoặc động cơ) và sơ đồ Sankey chia năng lượng toàn phần thành phần có ích và hao phí',
  duration: () => TMAX,
  state: (p, t) => phys.at(p, t),
  readouts: (p, s) => [['Wtp', fmt(s.Wtp, 0) + ' J'], ['Wci', fmt(s.Wci, 0) + ' J'], ['Whp', fmt(s.Whp, 0) + ' J']],
  draw(ctx, { w, h }, s, p, t, th) {
    const wide = w >= 620;
    const A = wide ? { x: 0, y: 0, w: w * 0.5, h } : { x: 0, y: 0, w, h: 196 };               // vùng máy
    const B = wide ? { x: w * 0.5, y: 0, w: w * 0.5, h } : { x: 0, y: 200, w, h: h - 200 };    // vùng Sankey
    // ---- máy
    const hf = Math.max(phys.hFinal(p), 0.5), yg = A.y + A.h - 16, ytop = A.y + 38;
    text(ctx, `${MODE_NAME[p.mode][0].toUpperCase() + MODE_NAME[p.mode].slice(1)} · h = ${fmt(s.h, 2)} m`, A.x + 12, A.y + 18, { color: th.ink, size: 12, bold: true });
    if (p.mode === 'incline') {
      const ang = rad(p.ang), x0 = A.x + 14, sc = Math.min((A.w - 40) / (hf / Math.tan(ang)), (yg - ytop - 14) / hf);
      const tx = x0 + (hf / Math.tan(ang)) * sc;
      ctx.save(); ctx.beginPath(); ctx.moveTo(x0, yg); ctx.lineTo(tx, yg - hf * sc); ctx.lineTo(tx, yg); ctx.closePath();
      ctx.fillStyle = th.road; ctx.fill(); ctx.strokeStyle = th.axis; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      const d = (s.h / hf) * (hf / Math.sin(ang)) * sc, px = x0 + d * Math.cos(ang), py = yg - d * Math.sin(ang);
      ctx.save(); ctx.translate(px + Math.sin(ang) * 8, py - Math.cos(ang) * 8); ctx.rotate(-ang); rect(ctx, -13, -8, 26, 16, th.car, null, 3); ctx.restore();
      arrow(ctx, px + Math.sin(ang) * 8, py - Math.cos(ang) * 8, px + Math.sin(ang) * 8 + Math.cos(ang) * 34, py - Math.cos(ang) * 8 - Math.sin(ang) * 34, th.accent, 3);
      text(ctx, 'F kéo', px + Math.cos(ang) * 36 + 4, py - Math.sin(ang) * 36 - 6, { color: th.accent, size: 11, bold: true });
    } else {
      const cx = A.x + A.w / 2, ppm = (yg - ytop - 26) / hf, ly = yg - s.h * ppm - 24;
      line(ctx, A.x + 24, ytop, A.x + A.w - 24, ytop, th.axis, 4);
      line(ctx, A.x + 24, yg, A.x + A.w - 24, yg, th.axis, 2);
      if (p.mode === 'motor') {
        rect(ctx, cx - 22, ytop, 44, 20, th.accent, null, 5); text(ctx, 'M', cx, ytop + 15, { color: '#fff', size: 13, align: 'center', bold: true });
        line(ctx, cx, ytop + 20, cx, ly, th.ink, 1.6);
      } else {
        const n = Math.round(p.n), wd = 30;
        for (let i = 0; i < n; i++) { const x = cx - wd / 2 + (wd * i) / (n - 1); line(ctx, x, ytop, x, ly, th.ink, 1.4); }
        circle(ctx, cx, ly - 2, 5, th.card, th.axis);
        text(ctx, n + ' đoạn dây', cx + 24, ytop + 16, { color: th.muted, size: 11 });
      }
      rect(ctx, cx - 20, ly, 40, 24, th.car, null, 4);
      text(ctx, fmt(p.m, 0) + ' kg', cx, ly + 16, { color: '#fff', size: 11, align: 'center', bold: true });
    }
    // ---- sơ đồ Sankey
    const WT = phys.at(p, TMAX).Wtp, ratio = Math.max(s.Wtp / WT, 0.05), H = s.H;
    const sx = B.x + 14, base = Math.min(B.h - 78, 120), Hh = base * ratio;
    const cy = B.y + 34 + base / 2, x1 = sx + 16, x2 = B.x + B.w * 0.52, gap = 14;
    text(ctx, 'Sơ đồ Sankey (năng lượng đến thời điểm t)', B.x + 12, B.y + 16, { color: th.muted, size: 11 });
    const hu = Hh * H, hw = Hh * (1 - H);
    const yU = cy - Hh / 2 - gap / 2 - 0, yW = cy + Hh / 2 - hw + gap / 2;       // vị trí mép trên các khối bên phải
    const band = (ya, ha, yb, hb, col) => {
      if (ha < 0.5) return;
      ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.moveTo(x1, ya);
      ctx.bezierCurveTo((x1 + x2) / 2, ya, (x1 + x2) / 2, yb, x2, yb); ctx.lineTo(x2, yb + hb);
      ctx.bezierCurveTo((x1 + x2) / 2, yb + hb, (x1 + x2) / 2, ya + ha, x1, ya + ha); ctx.closePath(); ctx.fill(); ctx.restore();
    };
    band(cy - Hh / 2, hu, yU, hu, th.ok);
    band(cy - Hh / 2 + hu, hw, yW, hw, th.bad);
    rect(ctx, sx, cy - Hh / 2, 16, Hh, th.accent, null, 2);
    if (hu > 0.5) rect(ctx, x2, yU, 16, hu, th.ok, null, 2);
    if (hw > 0.5) rect(ctx, x2, yW, 16, hw, th.bad, null, 2);
    text(ctx, 'Wtp', sx + 8, cy - Hh / 2 - 6, { color: th.accent, size: 12, align: 'center', bold: true });
    text(ctx, fmt(s.Wtp, 0) + ' J', sx + 8, cy + Hh / 2 + 15, { color: th.ink, size: 11, align: 'center' });
    const lx = x2 + 24;
    text(ctx, `Wci = ${fmt(s.Wci, 0)} J`, lx, yU + hu / 2 - 2, { color: th.ok, size: 12, bold: true });
    text(ctx, `có ích · ${fmt(H * 100, 0)} %`, lx, yU + hu / 2 + 13, { color: th.muted, size: 11 });
    text(ctx, `Whp = ${fmt(s.Whp, 0)} J`, lx, yW + hw / 2 + 2, { color: th.bad, size: 12, bold: true });
    text(ctx, `hao phí · ${fmt((1 - H) * 100, 0)} %`, lx, yW + hw / 2 + 17, { color: th.muted, size: 11 });
  },
  columns: [
    { k: 't', label: 't', unit: 's', dec: 2 }, { k: 'Wci', label: 'Wci', unit: 'J', dec: 1 }, { k: 'Wtp', label: 'Wtp', unit: 'J', dec: 1 },
  ],
  recordLabel: 'Ghi số liệu (t, Wci, Wtp)',
  note: 'Mỗi lần ghi: đồng hồ sai số khoảng 0,02 s; cảm biến năng lượng sai số khoảng 1% (cộng thêm vài J).',
  record: (p, s, t, n) => ({
    t: n.round(t + n.noise(0.02), 0.01),
    Wci: n.round(s.Wci + n.noise(0.01 * s.Wci + 1), 0.1),
    Wtp: n.round(s.Wtp + n.noise(0.01 * s.Wtp + 1), 0.1),
  }),
  graphs: [
    { title: 'Đồ thị Wci – Wtp', xlabel: 'Wtp (J)', ylabel: 'Wci (J)', x: 'Wtp', y: 'Wci', fit: 'origin', dec: 3,
      curve: (p) => { const e = phys.at(p, TMAX); return [[0, 0], [e.Wtp, e.Wci]]; }, marker: (p, s) => [s.Wtp, s.Wci], zeroX: true, zeroY: true },
    { title: 'Đồ thị Wtp – t', xlabel: 't (s)', ylabel: 'Wtp (J)', x: 't', y: 'Wtp',
      curve: (p) => [[0, 0], [TMAX, phys.at(p, TMAX).Wtp]], marker: (p, s, t) => [t, s.Wtp], zeroX: true, zeroY: true },
  ],
  predict: {
    prompt: '<p>Máy chạy hết 5 s (vật lên đến độ cao cuối). Hãy dự đoán năng lượng có ích Wci và năng lượng toàn phần Wtp lúc đó. Gợi ý: Wci = m·g·h; hiệu suất của máy xem như đã biết (mặt phẳng nghiêng: H = 1/(1 + μ·cotα); palăng: H = m(1 − f)/(m + mr)).</p>',
    fields: [{ k: 'Wci', label: 'Wci', unit: 'J', dec: 0 }, { k: 'Wtp', label: 'Wtp', unit: 'J', dec: 0 }],
    expected: (p) => { const e = phys.at(p, TMAX); return { Wci: e.Wci, Wtp: e.Wtp }; }, tol: 0.02, absTol: 2,
    explain: (p) => { const e = phys.at(p, TMAX); return `Wci = mgh = ${fmt(e.Wci, 0)} J; H = ${fmt(e.H * 100, 1)} % nên Wtp = Wci/H = ${fmt(e.Wtp, 0)} J (động cơ: H lấy theo chất lượng cài sẵn).`; },
  },
  tasks: [
    {
      title: 'Xử lí số liệu: hiệu suất từ đồ thị',
      prompt: '<p>Ghi ít nhất 5 lần đo. Đồ thị Wci – Wtp là đường thẳng qua gốc toạ độ, <b>hệ số góc chính là hiệu suất H</b>. Đọc hệ số góc dưới đồ thị rồi đổi ra phần trăm.</p>',
      fields: [{ k: 'H', label: 'Hiệu suất H', unit: '%', dec: 1, absTol: 0.8 }],
      minRows: 5, tol: 0.02,
      expected: (p, rows) => ({ H: 100 * slopeOrigin(rows.map((r) => [r.Wtp, r.Wci])) }),
      explain: (p, rows, e) => `H ≈ ${fmt(e.H, 1)} %: cứ 100 J cấp vào máy thì chỉ ${fmt(e.H, 0)} J là có ích, còn lại hao phí.`,
      reference: (p) => `Giá trị cài đặt trong mô phỏng: H = ${fmt(phys.eff(p) * 100, 1)} %.`,
    },
    {
      title: 'Tính hao phí ở lần ghi cuối',
      prompt: '<p>Lấy <b>lần ghi cuối cùng</b> trong bảng. Tính năng lượng hao phí Whp = Wtp − Wci và hiệu suất H = Wci/Wtp (đổi ra %).</p>',
      fields: [{ k: 'Whp', label: 'Whp', unit: 'J', dec: 1, absTol: 0.6 }, { k: 'H', label: 'H', unit: '%', dec: 1, absTol: 0.3 }],
      minRows: 1, tol: 0.02,
      expected: (p, rows) => { const r = rows[rows.length - 1]; return { Whp: r.Wtp - r.Wci, H: (100 * r.Wci) / r.Wtp }; },
      explain: (p, rows, e) => `Whp = Wtp − Wci = ${fmt(e.Whp, 1)} J; H = ${fmt(e.H, 1)} %. (Hiệu suất đo từ một lần có sai số lớn hơn khi dùng đồ thị nhiều điểm.)`,
    },
  ],
  quiz: [
    { q: 'Vì sao hiệu suất của máy thực luôn nhỏ hơn 100%?', o: ['vì máy luôn tạo ra thêm năng lượng', 'vì một phần năng lượng bị hao phí (chủ yếu thành nhiệt do ma sát)', 'vì khối lượng vật quá lớn'], a: 1, why: 'Wtp = Wci + Whp với Whp > 0 nên Wci < Wtp.' },
    { q: 'Động cơ nhận 500 J, sinh công có ích 350 J. Hiệu suất là:', o: ['30 %', '70 %', '143 %'], a: 1, why: 'H = 350/500 = 0,70 = 70 %.' },
    { q: 'Nâng vật 40 kg lên cao 3 m (g = 9,8 m/s²), máy tiêu thụ năng lượng toàn phần 1500 J. Hiệu suất xấp xỉ:', o: ['78,4 %', '127,6 %', '19,6 %'], a: 0, why: 'Wci = 40·9,8·3 = 1176 J; H = 1176/1500 = 0,784 = 78,4 %.' },
    { q: 'Máy có hiệu suất 80% cần cung cấp bao nhiêu năng lượng toàn phần để có 400 J có ích?', o: ['320 J', '500 J', '480 J'], a: 1, why: 'Wtp = Wci/H = 400/0,8 = 500 J.' },
    { q: 'Muốn tăng hiệu suất của mặt phẳng nghiêng, ta nên:', o: ['làm nhẵn mặt dốc để giảm ma sát', 'làm mặt dốc gồ ghề hơn', 'tăng khối lượng vật'], a: 0, why: 'Giảm μ thì giảm hao phí do ma sát: H = 1/(1 + μ·cotα) tăng.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

// Vật lí 10 – Bài 22: Thực hành tổng hợp lực (hai lực đồng quy, quy tắc hình bình hành).
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, circle, line, rect } from '../../core/draw.js';

const DEG = Math.PI / 180;

// ---- Vật lí (hàm thuần) ----
export const phys = {
  // Độ lớn hợp lực theo quy tắc hình bình hành: R² = F1² + F2² + 2F1F2cosγ
  R: (F1, F2, g) => Math.sqrt(Math.max(0, F1 * F1 + F2 * F2 + 2 * F1 * F2 * Math.cos(g * DEG))),
  // Góc (độ) giữa hợp lực và F1
  delta: (F1, F2, g) => Math.atan2(F2 * Math.sin(g * DEG), F1 + F2 * Math.cos(g * DEG)) / DEG,
  // Hợp lực bằng cộng vector theo hai thành phần
  vec(F1, F2, g) { return [F1 + F2 * Math.cos(g * DEG), F2 * Math.sin(g * DEG)]; },
};

export const spec = {
  seed: 2222,
  intro: 'Hai lực kế kéo một vòng nhẫn nhỏ, lực kế thứ ba kéo ngược lại sao cho vòng nhẫn đứng yên. Số chỉ của lực kế thứ ba chính là độ lớn hợp lực của hai lực kia. Em so sánh số chỉ này với giá trị tính theo quy tắc hình bình hành.',
  goals: [
    'Biết cách bố trí thí nghiệm tổng hợp hai lực đồng quy bằng lực kế.',
    'So sánh hợp lực đo được F₃ (thực nghiệm) với hợp lực tính theo quy tắc hình bình hành (lí thuyết).',
    'Nhận xét ảnh hưởng của góc γ giữa hai lực tới độ lớn của hợp lực.',
  ],
  theory: 'Hợp lực: <b>F</b> = <b>F</b><sub>1</sub> + <b>F</b><sub>2</sub>; &nbsp; F² = F<sub>1</sub>² + F<sub>2</sub>² + 2F<sub>1</sub>F<sub>2</sub>cosγ<br>|F<sub>1</sub> − F<sub>2</sub>| ≤ F ≤ F<sub>1</sub> + F<sub>2</sub>. Khi vòng nhẫn cân bằng, lực kế thứ ba chỉ F<sub>3</sub> = F và ngược hướng với hợp lực của <b>F</b><sub>1</sub>, <b>F</b><sub>2</sub>.',
  setup: 'Đặt số chỉ F₁, F₂ của hai lực kế và góc γ giữa hai dây. Vòng nhẫn nằm cân bằng, lực kế thứ ba (phía dưới) cho số chỉ F₃. Thay đổi γ và ghi nhiều lần đo.',
  params: [
    { k: 'gamma', label: 'Góc giữa hai lực γ', unit: '°', min: 0, max: 180, step: 5, def: 90, dec: 0 },
    { k: 'F1', label: 'Số chỉ lực kế 1: F₁', unit: 'N', min: 1, max: 5, step: 0.5, def: 3, dec: 1 },
    { k: 'F2', label: 'Số chỉ lực kế 2: F₂', unit: 'N', min: 1, max: 5, step: 0.5, def: 4, dec: 1 },
  ],
  toggles: [{ k: 'par', label: 'Hiện hình bình hành và hợp lực lí thuyết', def: false }],
  stageHeight: 300,
  ariaLabel: 'Vòng nhẫn bị ba lực kế kéo cân bằng, hình bình hành lực',
  state(p) { const R = phys.R(p.F1, p.F2, p.gamma); return { R, delta: phys.delta(p.F1, p.F2, p.gamma) }; },
  readouts: (p, s) => [['F₃ (lực kế 3)', fmt(s.R, 2) + ' N'], ['γ', p.gamma + '°']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const cx = w / 2, cy = h * 0.52, Lmax = Math.max(p.F1, p.F2, s.R, 1), sc = Math.min((h * 0.34) / Lmax, (w * 0.3) / Lmax);
    const th1 = (90 + s.delta) * DEG, th2 = th1 - p.gamma * DEG;
    const P = (F, a) => [cx + Math.cos(a) * F * sc, cy - Math.sin(a) * F * sc];
    const [x1, y1] = P(p.F1, th1), [x2, y2] = P(p.F2, th2), [x3, y3] = P(s.R, -Math.PI / 2), [xr, yr] = P(s.R, Math.PI / 2);
    if (tg.par) {
      line(ctx, x1, y1, xr, yr, th.muted, 1.5, [5, 4]); line(ctx, x2, y2, xr, yr, th.muted, 1.5, [5, 4]);
      arrow(ctx, cx, cy, xr, yr, th.ok, 3); text(ctx, 'F lí thuyết', xr + 8, yr + 4, { color: th.ok, size: 12, bold: true });
    }
    // dây + lực kế
    const scale = (x, y, label, col, a) => {
      arrow(ctx, cx, cy, x, y, col, 3);
      const ox = Math.cos(a), oy = -Math.sin(a), bx = x + ox * 14, by = y + oy * 14;
      rect(ctx, bx - 30, by - 11, 60, 22, th.card, col, 5);
      text(ctx, label, bx, by + 4, { color: th.ink, size: 12, bold: true, align: 'center' });
    };
    scale(x1, y1, 'F₁ ' + fmt(p.F1, 2), th.accent, th1);
    scale(x2, y2, 'F₂ ' + fmt(p.F2, 2), th.s3, th2);
    scale(x3, y3, 'F₃ ' + fmt(s.R, 2), th.bad, -Math.PI / 2);
    circle(ctx, cx, cy, 6, th.card, th.ink);
    // cung góc γ
    ctx.save(); ctx.strokeStyle = th.muted; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 26, -th1, -th2); ctx.stroke(); ctx.restore();
    const mid = (th1 + th2) / 2; text(ctx, 'γ', cx + Math.cos(mid) * 40 - 4, cy - Math.sin(mid) * 40 + 4, { color: th.muted, size: 13, bold: true });
    text(ctx, 'Đơn vị: N', 8, h - 8, { color: th.muted, size: 11 });
  },
  columns: [
    { k: 'F1', label: 'F₁', unit: 'N', dec: 2 }, { k: 'F2', label: 'F₂', unit: 'N', dec: 2 }, { k: 'g', label: 'γ', unit: '°', dec: 0 },
    { k: 'Ftn', label: 'F₃ (thực nghiệm)', unit: 'N', dec: 2 }, { k: 'Flt', label: 'F lí thuyết', unit: 'N', dec: 2 },
  ],
  recordLabel: 'Ghi số liệu',
  note: 'Lực kế chia 0,05 N (sai số khoảng 0,02–0,04 N); thước đo góc chia 1° (sai số khoảng 1°). F lí thuyết được tính từ F₁, F₂, γ đã đo.',
  record(p, s, t, n) {
    const F1 = n.round(p.F1 + n.noise(0.02), 0.05), F2 = n.round(p.F2 + n.noise(0.02), 0.05), g = n.round(p.gamma + n.noise(1), 1);
    return { F1, F2, g, Ftn: n.round(s.R + n.noise(0.04), 0.05), Flt: Math.round(phys.R(F1, F2, g) * 100) / 100 };
  },
  async demo(api) { for (let i = 0; i < 8; i++) { api.setParam('gamma', 20 + 20 * i); api.record(); } },
  graphs: [
    { title: 'F thực nghiệm theo F lí thuyết', xlabel: 'F lí thuyết (N)', ylabel: 'F₃ thực nghiệm (N)', x: 'Flt', y: 'Ftn', fit: 'origin', dec: 3, zeroX: true, zeroY: true, curve: () => [[0, 0], [10, 10]] },
    { title: 'F theo góc γ', xlabel: 'γ (độ)', ylabel: 'F (N)', x: 'g', y: 'Ftn', zeroY: true, curve: (p) => Array.from({ length: 37 }, (_, i) => [i * 5, phys.R(p.F1, p.F2, i * 5)]), marker: (p, s) => [p.gamma, s.R] },
  ],
  predict: {
    prompt: '<p>Với F₁, F₂ và góc γ đang đặt ở các thanh trượt, hãy tính độ lớn hợp lực F bằng quy tắc hình bình hành và góc δ giữa hợp lực với lực <b>F</b><sub>1</sub>. Bật “Hiện hình bình hành” để kiểm tra.</p>',
    fields: [{ k: 'R', label: 'Độ lớn hợp lực F', unit: 'N' }, { k: 'delta', label: 'Góc δ giữa F và F₁', unit: '°', dec: 1, absTol: 0.5 }],
    expected: (p) => ({ R: phys.R(p.F1, p.F2, p.gamma), delta: phys.delta(p.F1, p.F2, p.gamma) }), tol: 0.02, absTol: 0.03,
    explain: (p) => `F² = F₁² + F₂² + 2F₁F₂cosγ ⇒ F = ${fmt(phys.R(p.F1, p.F2, p.gamma))} N. Thành phần: F<sub>x</sub> = F₁ + F₂cosγ = ${fmt(phys.vec(p.F1, p.F2, p.gamma)[0])} N, F<sub>y</sub> = F₂sinγ = ${fmt(phys.vec(p.F1, p.F2, p.gamma)[1])} N, tanδ = F<sub>y</sub>/F<sub>x</sub> nên δ = ${fmt(phys.delta(p.F1, p.F2, p.gamma), 1)}°.`,
  },
  tasks: [{
    title: 'Xử lí số liệu: so sánh thực nghiệm và lí thuyết',
    prompt: '<p>Ghi ít nhất 6 lần đo với các góc γ khác nhau. (1) Độ dốc đường khớp qua gốc của đồ thị F₃ – F lí thuyết (đọc ở chú thích, cần gần 1). (2) Sai lệch tương đối trung bình δ = trung bình của |F₃ − F<sub>lt</sub>|/F<sub>lt</sub>·100% trên các lần đo (bỏ qua lần có F lí thuyết nhỏ hơn 0,5 N).</p>',
    fields: [{ k: 'slope', label: 'Độ dốc F₃ – F lí thuyết', dec: 3, absTol: 0.01 }, { k: 'dev', label: 'Sai lệch tương đối trung bình', unit: '%', dec: 1, absTol: 0.8 }],
    minRows: 6, tol: 0.03,
    need: (rows) => (rows.filter((r) => r.Flt >= 0.5).length < 6 ? 'Cần ít nhất 6 lần ghi có F lí thuyết ≥ 0,5 N.' : null),
    expected(p, rows) {
      const r = rows.filter((q) => q.Flt >= 0.5); let a = 0, b = 0, d = 0;
      for (const q of r) { a += q.Flt * q.Ftn; b += q.Flt * q.Flt; d += Math.abs(q.Ftn - q.Flt) / q.Flt; }
      return { slope: a / b, dev: (d / r.length) * 100 };
    },
    explain: () => 'Độ dốc gần 1 và sai lệch chỉ vài % cho thấy quy tắc hình bình hành đúng trong phạm vi sai số của lực kế và thước đo góc.',
  }],
  quiz: [
    { q: 'Hai lực 3 N và 4 N vuông góc nhau. Độ lớn hợp lực là:', o: ['1 N', '5 N', '7 N'], a: 1, why: 'F = √(3² + 4²) = 5 N.' },
    { q: 'Hai lực cùng phương, cùng chiều (γ = 0°) có hợp lực:', o: ['bằng hiệu hai lực', 'bằng tổng hai lực', 'bằng 0'], a: 1, why: 'cos0° = 1 nên F = F₁ + F₂.' },
    { q: 'Hai lực bằng nhau 5 N, hợp với nhau góc 120°. Độ lớn hợp lực là:', o: ['5 N', '8,7 N', '10 N'], a: 0, why: 'F² = 25 + 25 + 2·25·cos120° = 25 nên F = 5 N.' },
    { q: 'Khi vòng nhẫn nằm cân bằng dưới tác dụng của ba lực kế, lực kế thứ ba chỉ giá trị bằng:', o: ['tổng F₁ + F₂', 'độ lớn hợp lực của F₁ và F₂', 'hiệu F₁ − F₂'], a: 1, why: 'Cân bằng nên lực thứ ba cân bằng với hợp lực của hai lực còn lại.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

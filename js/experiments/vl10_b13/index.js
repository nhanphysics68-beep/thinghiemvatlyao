// Vật lí 10 – Bài 13: Tổng hợp và phân tích lực. Cân bằng lực.
import { mountLab } from '../../core/lab.js';
import { mean, fmt } from '../../core/stats.js';
import { arrow, text, line, circle, rect } from '../../core/draw.js';

const G = 9.8, RAD = Math.PI / 180;

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
export const phys = {
  G,
  // Hợp của F1 (dọc trục Ox) và F2 (hợp với F1 góc alpha, độ). Trả về thành phần, độ lớn, góc của hợp lực so với F1.
  resultant(F1, F2, alpha) {
    const a = alpha * RAD, Rx = F1 + F2 * Math.cos(a), Ry = F2 * Math.sin(a);
    return { Rx, Ry, R: Math.hypot(Rx, Ry), phi: Math.atan2(Ry, Rx) / RAD };
  },
  // Vật khối lượng m treo bằng hai dây; th1, th2 là góc của mỗi dây so với phương ngang (độ).
  hang(m, th1, th2) {
    const P = m * G, a = th1 * RAD, b = th2 * RAD, s = Math.sin(a + b);
    return { P, T1: (P * Math.cos(b)) / s, T2: (P * Math.cos(a)) / s, alpha: 180 - th1 - th2 };
  },
  // Phân tích lực F hợp với phương ngang góc ang (độ) thành hai thành phần vuông góc.
  resolve: (F, ang) => ({ Fx: F * Math.cos(ang * RAD), Fy: F * Math.sin(ang * RAD) }),
  // Trạng thái chung: hai lực F1, F2 tác dụng lên một điểm, góc giữa chúng alpha, và lực F3 cân bằng với chúng.
  forces(p) {
    if (p.mode === 'hang') {
      const h = phys.hang(p.m, p.th1, p.th2), r = phys.resultant(h.T1, h.T2, h.alpha);
      return { F1: h.T1, F2: h.T2, alpha: h.alpha, F3: h.P, ...r };
    }
    const r = phys.resultant(p.F1, p.F2, p.alpha);
    return { F1: p.F1, F2: p.F2, alpha: p.alpha, F3: r.R, ...r };
  },
};

const Rcalc = (r) => phys.resultant(r.F1, r.F2, r.alpha);
const lastRow = (rows) => rows[rows.length - 1];

export const spec = {
  seed: 1313,
  intro: 'Một điểm chịu tác dụng của nhiều lực. Em dùng lực kế để đo, vẽ hình bình hành lực và kiểm tra khi nào điểm đó đứng yên (cân bằng).',
  goals: [
    'Tổng hợp hai lực đồng quy bằng quy tắc hình bình hành.',
    'Phân tích một lực thành hai thành phần theo hai phương vuông góc.',
    'Nêu điều kiện cân bằng của chất điểm: hợp lực tác dụng lên nó bằng 0.',
  ],
  theory: 'F = F₁ + F₂ (vectơ) &nbsp;&nbsp; F² = F₁² + F₂² + 2F₁F₂cosα &nbsp;&nbsp; Fₓ = F·cosθ, F_y = F·sinθ &nbsp;&nbsp; Cân bằng: F₁ + F₂ + F₃ = 0 (vectơ) &nbsp;&nbsp; (g = 9,8 m/s²)',
  setup: 'Chọn <b>Hợp hai lực</b>: hai lực kế kéo một vòng nhẫn, lực kế thứ ba kéo ngược lại cho vòng đứng yên. Chọn <b>Treo vật bằng hai dây</b>: lực căng hai dây và trọng lực của vật cân bằng nhau.',
  choices: [{ k: 'mode', label: 'Cách bố trí', options: [['compose', 'Hợp hai lực (hình bình hành)'], ['hang', 'Treo vật bằng hai dây']], def: 'compose', string: true }],
  params: [
    { k: 'F1', label: 'Lực F₁', unit: 'N', min: 1, max: 5, step: 0.5, def: 3, dec: 1, show: (p) => p.mode === 'compose' },
    { k: 'F2', label: 'Lực F₂', unit: 'N', min: 1, max: 5, step: 0.5, def: 4, dec: 1, show: (p) => p.mode === 'compose' },
    { k: 'alpha', label: 'Góc giữa F₁ và F₂ (α)', unit: '°', min: 0, max: 180, step: 5, def: 60, dec: 0, show: (p) => p.mode === 'compose' },
    { k: 'm', label: 'Khối lượng vật m', unit: 'kg', min: 0.1, max: 0.6, step: 0.05, def: 0.4, dec: 2, show: (p) => p.mode === 'hang' },
    { k: 'th1', label: 'Góc dây trái so với phương ngang', unit: '°', min: 20, max: 70, step: 5, def: 40, dec: 0, show: (p) => p.mode === 'hang' },
    { k: 'th2', label: 'Góc dây phải so với phương ngang', unit: '°', min: 20, max: 70, step: 5, def: 50, dec: 0, show: (p) => p.mode === 'hang' },
  ],
  toggles: [
    { k: 'par', label: 'Hình bình hành và hợp lực', def: true },
    { k: 'f3', label: 'Lực cân bằng F₃', def: true },
    { k: 'comp', label: 'Phân tích hợp lực theo Ox, Oy', def: false },
  ],
  stageHeight: 340,
  ariaLabel: 'Sơ đồ các lực tác dụng lên một điểm: hai lực, hợp lực theo hình bình hành và lực cân bằng',
  state: (p) => phys.forces(p),
  readouts: (p, s) => (p.mode === 'hang'
    ? [['T₁', fmt(s.F1, 2) + ' N'], ['T₂', fmt(s.F2, 2) + ' N'], ['P', fmt(s.F3, 2) + ' N']]
    : [['F_R', fmt(s.R, 2) + ' N'], ['góc (F_R, F₁)', fmt(s.phi, 0) + '°']]),
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const dirv = (a) => [Math.cos(a), -Math.sin(a)];
    const lab = (str, x, y, a, color, off = 12) => { const [ux, uy] = dirv(a); text(ctx, str, x + ux * off, y + uy * off + 4, { color, size: 13, align: 'center', bold: true }); };
    if (p.mode === 'hang') {
      const cx = w / 2, cy = h * 0.42, ppn = Math.min(14, (h - cy - 70) / 6.2);
      const a1 = (180 - p.th1) * RAD, a2 = p.th2 * RAD;
      const Ls = Math.min((w / 2 - 22) / Math.max(Math.cos(p.th1 * RAD), Math.cos(p.th2 * RAD)), (cy - 24) / Math.max(Math.sin(p.th1 * RAD), Math.sin(p.th2 * RAD)));
      const A1 = [cx + Ls * Math.cos(a1), cy - Ls * Math.sin(a1)], A2 = [cx + Ls * Math.cos(a2), cy - Ls * Math.sin(a2)];
      for (const A of [A1, A2]) { rect(ctx, A[0] - 7, A[1] - 7, 14, 14, th.road, th.axis, 3); line(ctx, A[0], A[1], cx, cy, th.muted, 1.5); }
      const bw = 30 + p.m * 40, bh = 26 + p.m * 30;
      line(ctx, cx, cy, cx, cy + 16, th.muted, 1.5);
      rect(ctx, cx - bw / 2, cy + 16, bw, bh, th.soft, th.accent, 4);
      text(ctx, 'm', cx, cy + 16 + bh / 2 + 4, { color: th.ink, size: 13, align: 'center' });
      arrow(ctx, cx, cy, cx + s.F1 * ppn * Math.cos(a1), cy - s.F1 * ppn * Math.sin(a1), th.accent, 3);
      arrow(ctx, cx, cy, cx + s.F2 * ppn * Math.cos(a2), cy - s.F2 * ppn * Math.sin(a2), th.s3, 3);
      arrow(ctx, cx + bw / 2 + 8, cy + 16 + bh / 2, cx + bw / 2 + 8, cy + 16 + bh / 2 + s.F3 * ppn, th.bad, 3);
      circle(ctx, cx, cy, 5, th.card, th.ink);
      lab('T₁', cx + s.F1 * ppn * Math.cos(a1), cy - s.F1 * ppn * Math.sin(a1), a1, th.accent);
      lab('T₂', cx + s.F2 * ppn * Math.cos(a2), cy - s.F2 * ppn * Math.sin(a2), a2, th.s3);
      text(ctx, 'P = mg', cx + bw / 2 + 14, cy + 16 + bh / 2 + s.F3 * ppn + 4, { color: th.bad, size: 13, bold: true });
      text(ctx, `α = ${fmt(s.alpha, 0)}°`, 12, h - 12, { color: th.muted, size: 12 });
      return;
    }
    const cx = w / 2, cy = h * 0.5, ppn = Math.min((h / 2 - 26) / 10.4, (w / 2 - 26) / 6.6);
    const a1 = (90 - s.phi) * RAD, a2 = a1 + p.alpha * RAD;
    const tip = (a, L) => [cx + L * ppn * Math.cos(a), cy - L * ppn * Math.sin(a)];
    const t1 = tip(a1, s.F1), t2 = tip(a2, s.F2), tR = [cx, cy - s.R * ppn];
    if (tg.comp) {
      const ex = dirv(a1), ey = dirv(a1 + Math.PI / 2), ext = 11 * ppn;
      line(ctx, cx - ex[0] * 12, cy - ex[1] * 12, cx + ex[0] * ext, cy + ex[1] * ext, th.axis, 1.2, [2, 3]);
      line(ctx, cx - ey[0] * 12, cy - ey[1] * 12, cx + ey[0] * ext, cy + ey[1] * ext, th.axis, 1.2, [2, 3]);
      const px = [cx + ex[0] * s.Rx * ppn, cy + ex[1] * s.Rx * ppn], py = [cx + ey[0] * s.Ry * ppn, cy + ey[1] * s.Ry * ppn];
      line(ctx, tR[0], tR[1], px[0], px[1], th.muted, 1.2, [3, 3]); line(ctx, tR[0], tR[1], py[0], py[1], th.muted, 1.2, [3, 3]);
      circle(ctx, px[0], px[1], 3, th.muted); circle(ctx, py[0], py[1], 3, th.muted);
      text(ctx, 'Ox', cx + ex[0] * ext + 6, cy + ex[1] * ext + 4, { color: th.muted, size: 12 });
      text(ctx, 'Oy', cx + ey[0] * ext + 6, cy + ey[1] * ext - 4, { color: th.muted, size: 12 });
      text(ctx, `Rₓ = ${fmt(s.Rx, 2)} N`, 10, h - 28, { color: th.ink, size: 12 });
      text(ctx, `R_y = ${fmt(s.Ry, 2)} N`, 10, h - 12, { color: th.ink, size: 12 });
    }
    if (tg.par && s.R > 0.01) { line(ctx, t1[0], t1[1], tR[0], tR[1], th.muted, 1.3, [5, 4]); line(ctx, t2[0], t2[1], tR[0], tR[1], th.muted, 1.3, [5, 4]); }
    if (tg.f3) arrow(ctx, cx, cy, cx, cy + s.F3 * ppn, th.bad, 3);
    if (tg.par) arrow(ctx, cx, cy, tR[0], tR[1], th.ok, 3.5);
    arrow(ctx, cx, cy, t1[0], t1[1], th.accent, 3); arrow(ctx, cx, cy, t2[0], t2[1], th.s3, 3);
    circle(ctx, cx, cy, 5, th.card, th.ink);
    lab('F₁', t1[0], t1[1], a1, th.accent); lab('F₂', t2[0], t2[1], a2, th.s3);
    if (tg.par && s.R > 0.3) lab('F_R', tR[0], tR[1], Math.PI / 2, th.ok, 12);
    if (tg.f3) text(ctx, 'F₃', cx + 14, cy + s.F3 * ppn + 4, { color: th.bad, size: 13, bold: true });
    if (tg.f3) text(ctx, tg.par ? 'F₁ + F₂ + F₃ = 0 (vectơ)' : '', w - 10, h - 12, { color: th.muted, size: 12, align: 'right' });
  },
  columns: [
    { k: 'F1', label: 'F₁', unit: 'N', dec: 2 }, { k: 'F2', label: 'F₂', unit: 'N', dec: 2 },
    { k: 'alpha', label: 'α', unit: '°', dec: 0 }, { k: 'F3', label: 'F₃', unit: 'N', dec: 2 },
  ],
  recordLabel: 'Ghi số liệu (F₁, F₂, α, F₃)',
  note: 'Mỗi lần ghi: lực kế chia đến 0,05 N (sai số khoảng 0,04 N), thước đo góc chia đến 1°. F₃ là số chỉ của lực kế thứ ba khi vòng nhẫn đứng yên (ở cách bố trí treo vật, F₃ = P). Số liệu giữ nguyên khi đổi thanh trượt, nhưng bị xóa khi đổi cách bố trí.',
  record: (p, s, t, n) => ({
    F1: n.round(s.F1 + n.noise(0.04), 0.05), F2: n.round(s.F2 + n.noise(0.04), 0.05),
    alpha: n.round(s.alpha + n.noise(0.7), 1), F3: n.round(s.F3 + n.noise(0.05), 0.05),
  }),
  graphs: [{
    title: 'Đồ thị F₃ theo F_R tính được', xlabel: 'F_R tính theo hình bình hành (N)', ylabel: 'F₃ (N)', x: 'FRc', y: 'F3', fit: 'origin', dec: 3,
    curve: () => [[0, 0], [12, 12]], zeroX: true, zeroY: true,
  }],
  predict: {
    prompt: '<p>Với cách bố trí và các giá trị đang chọn, hãy dự đoán số chỉ của <b>lực kế thứ ba</b> (lực F₃ cân bằng với hai lực còn lại).</p>',
    fields: [{ k: 'F3', label: 'F₃', unit: 'N' }],
    expected: (p) => ({ F3: phys.forces(p).F3 }), tol: 0.03, absTol: 0.05,
    explain: (p) => (p.mode === 'hang'
      ? `Vật đứng yên nên hợp của hai lực căng cân bằng với trọng lực: F₃ = P = mg = ${fmt(p.m * G, 2)} N.`
      : `F₃ có cùng độ lớn, ngược chiều với hợp lực: F₃ = √(F₁² + F₂² + 2F₁F₂cosα) = ${fmt(phys.forces(p).F3, 2)} N.`),
  },
  tasks: [
    {
      title: 'Xử lí số liệu: hợp lực và điều kiện cân bằng',
      prompt: '<p>Ghi ít nhất 3 lần đo. Với mỗi lần, tính hợp lực F_R = √(F₁² + F₂² + 2F₁F₂cosα). Điền F_R của <b>lần đo cuối</b> và <b>giá trị trung bình của tỉ số F₃/F_R</b> (bỏ qua lần đo có F_R &lt; 0,3 N). Nếu vòng nhẫn cân bằng, tỉ số này gần bằng 1.</p>',
      fields: [{ k: 'FR', label: 'F_R (lần cuối)', unit: 'N', absTol: 0.05 }, { k: 'ratio', label: 'F₃/F_R trung bình', dec: 3, absTol: 0.02 }],
      minRows: 3, tol: 0.02,
      expected: (p, rows) => {
        const ok = rows.filter((r) => Rcalc(r).R > 0.3);
        return { FR: Rcalc(lastRow(rows)).R, ratio: mean(ok.map((r) => r.F3 / Rcalc(r).R)) };
      },
      explain: () => 'Tỉ số gần 1 nghĩa là F₃ có độ lớn bằng hợp lực của F₁ và F₂: hợp lực của ba lực bằng 0.',
      reference: (p) => { const s = phys.forces(p); return `Giá trị chuẩn của cách bố trí hiện tại: F_R = ${fmt(s.R, 2)} N, F₃ = ${fmt(s.F3, 2)} N.`; },
    },
    {
      title: 'Phân tích lực',
      prompt: '<p>Chọn trục Ox dọc theo F₁, trục Oy vuông góc với Ox (bật “Phân tích hợp lực theo Ox, Oy”). Với <b>lần đo cuối</b>, tính các thành phần của hợp lực: F_Rx = F₁ + F₂cosα, F_Ry = F₂sinα.</p>',
      fields: [{ k: 'Rx', label: 'F_Rx', unit: 'N', absTol: 0.05 }, { k: 'Ry', label: 'F_Ry', unit: 'N', absTol: 0.05 }],
      minRows: 1, tol: 0.02,
      expected: (p, rows) => { const r = Rcalc(lastRow(rows)); return { Rx: r.Rx, Ry: r.Ry }; },
      explain: (p, rows, e) => `F_R = √(F_Rx² + F_Ry²) = ${fmt(Math.hypot(e.Rx, e.Ry), 2)} N. Hai thành phần vuông góc cho lại độ lớn hợp lực.`,
    },
  ],
  quiz: [
    { q: 'Hai lực vuông góc có độ lớn 3 N và 4 N. Hợp lực có độ lớn:', o: ['7 N', '5 N', '1 N'], a: 1, why: 'F = √(3² + 4²) = 5 N.' },
    { q: 'Hai lực cùng phương, ngược chiều, độ lớn 7 N và 4 N. Hợp lực có độ lớn và chiều:', o: ['11 N, cùng chiều lực 7 N', '3 N, cùng chiều lực 7 N', '3 N, cùng chiều lực 4 N'], a: 1, why: 'Hợp lực bằng hiệu hai độ lớn, cùng chiều với lực lớn hơn.' },
    { q: 'Hai lực 6 N và 6 N hợp với nhau góc 120°. Hợp lực có độ lớn:', o: ['12 N', '6 N', '0 N'], a: 1, why: 'F² = 36 + 36 + 2·36·cos120° = 36 → F = 6 N.' },
    { q: 'Vật nặng 2 kg (g = 9,8 m/s²) treo bằng hai dây đối xứng, mỗi dây hợp với phương ngang góc 30°. Lực căng mỗi dây là:', o: ['9,8 N', '19,6 N', '39,2 N'], a: 1, why: '2T·sin30° = P = 19,6 N → T = 19,6 N.' },
    { q: 'Lực 10 N hợp với phương ngang góc 30°. Thành phần theo phương ngang có độ lớn:', o: ['5 N', '8,7 N', '10 N'], a: 1, why: 'Fₓ = 10·cos30° ≈ 8,7 N (thành phần thẳng đứng là 10·sin30° = 5 N).' },
  ],
  // Thêm khóa ẩn FRc (hợp lực tính được) cho đồ thị: lab.js đọc mọi khóa của dòng số liệu.
};
const rec0 = spec.record;
spec.record = (p, s, t, n, rows) => { const r = rec0(p, s, t, n, rows); r.FRc = Rcalc(r).R; return r; };

export const mount = (root, entry) => mountLab(root, entry, spec);

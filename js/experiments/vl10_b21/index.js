// Vật lí 10 – Bài 21: Moment lực. Cân bằng của vật rắn (đòn bẩy).
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, rect, circle, line, spring } from '../../core/draw.js';

const G = 9.8, LROD = 1.0, FTOL = 0.03;   // thanh dài 1,0 m, bỏ qua khối lượng thanh; sai lệch F cho phép khi coi là cân bằng (N)

// ---- Vật lí (hàm thuần) ----
export const phys = {
  G, LROD, FTOL,
  weight: (p) => p.m * G,
  feq: (p) => (p.m * G * p.d1) / p.d2,                 // lực kéo cân bằng: P·d1 = F·d2
  m1: (p) => p.m * G * (p.d1 / 100),
  m2: (p) => p.F * (p.d2 / 100),
  balanced: (p) => Math.abs(p.F - phys.feq(p)) <= FTOL,
  // Góc nghiêng của thanh (độ, dương: đầu trái hạ xuống) — chỉ để minh họa chiều quay
  tilt(p) {
    if (phys.balanced(p)) return 0;
    const dM = phys.m1(p) - phys.m2(p);
    return Math.sign(dM) * Math.min(15, 3 + 40 * Math.abs(dM));
  },
  q: (p) => p.m * G + p.F,                              // lực của trục: Q = P + F (thanh nhẹ, cân bằng)
};

export const spec = {
  seed: 2121,
  intro: 'Thanh đòn bẩy dài 1,0 m quay quanh trục ở chính giữa. Em treo một quả nặng ở bên trái, rồi dùng lực kế kéo xuống ở bên phải sao cho thanh nằm ngang. Từ các lần đo, em kiểm nghiệm quy tắc moment.',
  goals: [
    'Hiểu moment lực M = F·d và cánh tay đòn d là khoảng cách từ trục quay tới giá của lực.',
    'Tìm điều kiện để thanh cân bằng: tổng moment theo chiều kim đồng hồ bằng tổng moment ngược chiều kim đồng hồ.',
    'Nhận ra điều kiện còn lại: tổng các lực tác dụng lên thanh bằng 0 (có cả lực của trục quay).',
  ],
  theory: 'M = F·d &nbsp;&nbsp; Điều kiện cân bằng của vật rắn có trục quay cố định: M<sub>1</sub> = M<sub>2</sub> (F<sub>1</sub>d<sub>1</sub> = F<sub>2</sub>d<sub>2</sub>)<br>Tổng các lực: Q = P + F (thanh nhẹ). Lấy g = 9,8 m/s².',
  setup: 'Chọn khối lượng m và vị trí treo d₁ (cách trục), chọn vị trí d₂ của lực kế, rồi kéo thanh trượt <b>lực kéo F</b> cho tới khi thanh nằm ngang (cân bằng). Chỉ khi thanh cân bằng em mới ghi được số liệu.',
  params: [
    { k: 'm', label: 'Khối lượng vật treo m', unit: 'kg', min: 0.1, max: 0.5, step: 0.05, def: 0.3, dec: 2 },
    { k: 'd1', label: 'Vị trí vật treo d₁ (cách trục, bên trái)', unit: 'cm', min: 10, max: 40, step: 5, def: 20, dec: 0 },
    { k: 'd2', label: 'Vị trí lực kế d₂ (cách trục, bên phải)', unit: 'cm', min: 20, max: 50, step: 5, def: 40, dec: 0 },
    { k: 'F', label: 'Lực kéo của lực kế F', unit: 'N', min: 0, max: 10, step: 0.05, def: 0, dec: 2 },
  ],
  toggles: [{ k: 'vec', label: 'Hiện các lực', def: true }],
  stageHeight: 290,
  ariaLabel: 'Thanh đòn bẩy quay quanh trục giữa, vật treo bên trái và lực kế kéo xuống bên phải',
  state: (p) => ({ tilt: phys.tilt(p), bal: phys.balanced(p), M1: phys.m1(p), M2: phys.m2(p), Q: phys.q(p) }),
  readouts: (p, s) => [['M₁ = P·d₁', fmt(s.M1, 3) + ' N·m'], ['M₂ = F·d₂', fmt(s.M2, 3) + ' N·m'], ['Thanh', s.bal ? 'cân bằng' : (s.tilt > 0 ? 'quay ngược chiều kim đồng hồ' : 'quay cùng chiều kim đồng hồ')]],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const ppm = Math.min(700, w - 70), cx = w / 2, cy = 112, ang = (s.tilt * Math.PI) / 180;
    const pos = (m) => [cx + m * ppm * Math.cos(ang), cy - m * ppm * Math.sin(ang)];       // m: toạ độ dọc thanh (m), dương sang phải
    // giá đỡ
    ctx.save(); ctx.fillStyle = th.axis; ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx - 14, cy + 36); ctx.lineTo(cx + 14, cy + 36); ctx.closePath(); ctx.fill(); ctx.restore();
    line(ctx, cx - 40, cy + 36, cx + 40, cy + 36, th.axis, 3);
    // thanh
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-ang);
    rect(ctx, -LROD * ppm / 2, -5, LROD * ppm, 10, th.road, th.axis, 3);
    for (let c = -50; c <= 50; c += 10) {
      const X = (c / 100) * ppm; line(ctx, X, -5, X, c % 50 === 0 || c === 0 ? -11 : -8, th.axis, 1);
      if (c % 20 === 0 || Math.abs(c) === 50 || c === 0) text(ctx, String(Math.abs(c)), X, -14, { color: th.muted, size: 10, align: 'center' });
    }
    ctx.restore();
    circle(ctx, cx, cy, 4, th.ink);
    // vật treo bên trái
    const [x1, y1] = pos(-p.d1 / 100), P = phys.weight(p), k = 40 / Math.max(P, 3);
    line(ctx, x1, y1, x1, y1 + 40, th.ink, 1.5);
    const bw = 22 + 40 * p.m; rect(ctx, x1 - bw / 2, y1 + 40, bw, 26, th.s3, null, 4);
    text(ctx, fmt(p.m, 2) + ' kg', x1, y1 + 57, { color: '#fff', size: 10, bold: true, align: 'center' });
    // lực kế bên phải
    const [x2, y2] = pos(p.d2 / 100);
    spring(ctx, x2, y2 + 4, x2, y2 + 48, th.axis, 5, 5);
    rect(ctx, x2 - 30, y2 + 48, 60, 24, th.card, th.axis, 5);
    text(ctx, fmt(p.F, 2) + ' N', x2, y2 + 65, { align: 'center', bold: true, size: 12, color: th.ink });
    // kích thước d1, d2
    const dim = (xa, xb, y, lbl, al) => { line(ctx, xa, y, xb, y, th.accent, 1.5); line(ctx, xa, y - 4, xa, y + 4, th.accent, 1.5); line(ctx, xb, y - 4, xb, y + 4, th.accent, 1.5); text(ctx, lbl, cx + (al === 'right' ? -4 : 4), y - 6, { color: th.accent, size: 11, align: al, bold: true }); };
    dim(x1, cx, cy - 40, 'd₁ = ' + p.d1 + ' cm', 'right'); dim(cx, x2, cy - 40, 'd₂ = ' + p.d2 + ' cm', 'left');
    if (tg.vec) {
      arrow(ctx, x1, y1 + 68, x1, y1 + 68 + P * k, th.ink, 3); text(ctx, 'P', x1 + 6, y1 + 68 + P * k + 8, { color: th.ink, size: 12, bold: true });
      if (p.F > 0.02) { arrow(ctx, x2, y2 + 72, x2, y2 + 72 + p.F * k, th.accent, 3); text(ctx, 'F', x2 + 6, y2 + 72 + p.F * k + 8, { color: th.accent, size: 12, bold: true }); }
      arrow(ctx, cx, cy + 36, cx, cy + 36 - Math.min(52, s.Q * k), th.ok, 3); text(ctx, 'Q', cx + 8, cy + 36 - Math.min(52, s.Q * k) + 10, { color: th.ok, size: 12, bold: true });
    }
    text(ctx, s.bal ? 'Cân bằng' : 'Chưa cân bằng', w - 10, h - 10, { color: s.bal ? th.ok : th.bad, align: 'right', bold: true, size: 13 });
  },
  columns: [
    { k: 'd1', label: 'd₁', unit: 'cm', dec: 1 }, { k: 'F1', label: 'F₁ = P', unit: 'N', dec: 2 }, { k: 'd2', label: 'd₂', unit: 'cm', dec: 1 }, { k: 'F2', label: 'F₂', unit: 'N', dec: 2 },
    { k: 'M1', label: 'M₁ = F₁d₁', unit: 'N·m', dec: 3 }, { k: 'M2', label: 'M₂ = F₂d₂', unit: 'N·m', dec: 3 },
  ],
  recordLabel: 'Ghi số liệu khi thanh cân bằng',
  note: 'Thước chia 1 mm (sai số khoảng 0,1 cm), lực kế chia 0,01 N (sai số khoảng 0,02 N). M₁ và M₂ được tính tự động từ số đo.',
  record(p, s, t, n) {
    if (!s.bal) return { error: 'Thanh chưa cân bằng. Hãy chỉnh lực kéo F cho thanh nằm ngang rồi ghi.' };
    const d1 = n.round(p.d1 + n.noise(0.1), 0.1), d2 = n.round(p.d2 + n.noise(0.1), 0.1), F1 = n.round(phys.weight(p) + n.noise(0.02), 0.01), F2 = n.round(p.F + n.noise(0.02), 0.01);
    return { d1, F1, d2, F2, M1: Math.round((F1 * d1) / 100 * 1000) / 1000, M2: Math.round((F2 * d2) / 100 * 1000) / 1000 };
  },
  async demo(api) {
    const ms = [0.2, 0.3, 0.4, 0.5, 0.25, 0.35, 0.45, 0.15], a1 = [10, 15, 20, 25, 30, 35, 40, 20], a2 = [20, 30, 25, 40, 50, 35, 45, 30];
    for (let i = 0; i < 8; i++) {
      api.setParam('m', ms[i]); api.setParam('d1', a1[i]); api.setParam('d2', a2[i]);
      api.setParam('F', Math.round(phys.feq(api.p) / 0.05) * 0.05); api.record();
    }
  },
  graphs: [
    { title: 'Lực kéo F₂ theo d₂ (cân bằng)', xlabel: 'd₂ (cm)', ylabel: 'F₂ (N)', x: 'd2', y: 'F2', zeroY: true, curve: (p) => Array.from({ length: 31 }, (_, i) => { const d = 20 + i; return [d, (p.m * G * p.d1) / d]; }), marker: (p) => [p.d2, p.F] },
    { title: 'Đồ thị M₂ – M₁', xlabel: 'M₁ (N·m)', ylabel: 'M₂ (N·m)', x: 'M1', y: 'M2', fit: 'origin', dec: 3, zeroX: true, zeroY: true, curve: () => [[0, 0], [0.2, 0.2]] },
  ],
  predict: {
    prompt: '<p>Với khối lượng m, vị trí d₁ và d₂ đang đặt ở các thanh trượt, hãy tính <b>số chỉ lực kế F</b> để thanh cân bằng nằm ngang, rồi đặt F bằng giá trị đó để kiểm tra.</p>',
    fields: [{ k: 'F', label: 'Lực kéo F cần thiết', unit: 'N', dec: 2 }],
    expected: (p) => ({ F: phys.feq(p) }), tol: 0.02, absTol: 0.03,
    explain: (p) => `P = mg = ${fmt(phys.weight(p))} N. Quy tắc moment: P·d₁ = F·d₂ ⇒ F = P·d₁/d₂ = ${fmt(phys.weight(p))}·${p.d1}/${p.d2} = ${fmt(phys.feq(p))} N.`,
  },
  tasks: [
    {
      title: 'Kiểm nghiệm quy tắc moment',
      prompt: '<p>Ghi ít nhất 5 lần đo với các m, d₁, d₂ khác nhau (thanh cân bằng). Vẽ M₂ theo M₁: nếu quy tắc moment đúng thì các điểm nằm trên đường thẳng qua gốc có <b>độ dốc bằng 1</b>. Đọc độ dốc ở chú thích dưới đồ thị M₂ – M₁.</p>',
      fields: [{ k: 'ratio', label: 'Độ dốc M₂/M₁', dec: 2, absTol: 0.02 }],
      minRows: 5, tol: 0.03,
      expected(p, rows) { let a = 0, b = 0; for (const r of rows) { a += r.M1 * r.M2; b += r.M1 * r.M1; } return { ratio: a / b }; },
      explain: () => 'Độ dốc xấp xỉ 1 nghĩa là M₂ ≈ M₁ khi thanh cân bằng; sai lệch nhỏ là do sai số của thước và lực kế.',
      reference: () => 'Quy tắc moment cho M₂/M₁ = 1.',
    },
    {
      title: 'Điều kiện cân bằng về lực',
      prompt: '<p>Lấy lần ghi cuối cùng trong bảng. Thanh nhẹ nằm cân bằng chịu ba lực: trọng lực của vật (F₁), lực kéo của lực kế (F₂), lực Q của trục quay. Tính độ lớn Q.</p>',
      fields: [{ k: 'Q', label: 'Lực Q của trục quay', unit: 'N', dec: 2, absTol: 0.03 }],
      minRows: 1, tol: 0.03,
      expected: (p, rows) => { const r = rows[rows.length - 1]; return { Q: r.F1 + r.F2 }; },
      explain: () => 'Tổng lực bằng 0: Q = F₁ + F₂ (cả hai lực đều hướng xuống, Q hướng lên).',
    },
  ],
  quiz: [
    { q: 'Lực 5 N có cánh tay đòn 0,4 m. Moment của lực là:', o: ['0,8 N·m', '2,0 N·m', '12,5 N·m'], a: 1, why: 'M = F·d = 5·0,4 = 2,0 N·m.' },
    { q: 'Thanh quay quanh trục cố định ở trạng thái cân bằng khi:', o: ['tổng moment theo chiều kim đồng hồ bằng tổng moment ngược chiều kim đồng hồ', 'chỉ có một lực tác dụng lên thanh', 'các lực đều có độ lớn bằng nhau'], a: 0, why: 'Đó là quy tắc moment.' },
    { q: 'Vật 0,4 kg treo cách trục 25 cm. Lực kế kéo xuống cách trục 50 cm. Số chỉ lực kế để thanh cân bằng là:', o: ['1,96 N', '3,92 N', '7,84 N'], a: 0, why: 'P = 3,92 N; F = P·d₁/d₂ = 3,92·25/50 = 1,96 N.' },
    { q: 'Với số liệu ở câu trên (thanh nhẹ), lực của trục tác dụng lên thanh là:', o: ['3,92 N', '5,88 N', '1,96 N'], a: 1, why: 'Q = P + F = 3,92 + 1,96 = 5,88 N.' },
    { q: 'Muốn dùng lực nhỏ hơn để giữ thanh cân bằng, ta nên đặt lực kế:', o: ['gần trục hơn', 'xa trục hơn', 'vị trí nào cũng như nhau'], a: 1, why: 'F = P·d₁/d₂: d₂ càng lớn thì F càng nhỏ.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

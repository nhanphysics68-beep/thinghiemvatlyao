// Vật lí 10 – Bài 16: Định luật 3 Newton (hai xe tương tác qua lò xo, hai cảm biến lực).
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, ruler, ground, rect, line, spring } from '../../core/draw.js';

const TAU = 0.3, TMAX = 1.2, PI = Math.PI, HALF = 1.8;

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
// Hai xe đứng yên, lò xo nén đặt giữa chúng được thả: trong thời gian TAU lực tương tác có dạng xung
// F(t) = Fmax·sin(πt/TAU). Xe 1 chịu F12 = −F (hướng sang trái), xe 2 chịu F21 = +F (hướng sang phải).
// Vị trí tính là độ dịch chuyển của mỗi xe so với lúc đầu (chiều dương sang phải).
export const phys = {
  TAU, TMAX,
  F: (p, t) => (t > 0 && t < TAU ? p.Fmax * Math.sin((PI * t) / TAU) : 0),
  impulse: (p) => (2 * p.Fmax * TAU) / PI,                       // ∫F dt trong cả xung
  // vận tốc xe i (dấu theo chiều: xe 1 âm, xe 2 dương)
  v1: (p, t) => -((p.Fmax / p.m1) * (TAU / PI)) * (1 - Math.cos((PI * Math.min(t, TAU)) / TAU)),
  v2: (p, t) => ((p.Fmax / p.m2) * (TAU / PI)) * (1 - Math.cos((PI * Math.min(t, TAU)) / TAU)),
  disp(p, t, m, sgn) {                                           // độ dịch chuyển xe có khối lượng m
    const k = (p.Fmax / m) * (TAU / PI), tt = Math.min(t, TAU);
    const xT = k * (TAU - (TAU / PI) * Math.sin(PI)), vT = 2 * k;  // tại t = TAU
    return sgn * (t <= TAU ? k * (tt - (TAU / PI) * Math.sin((PI * tt) / TAU)) : xT + vT * (t - TAU));
  },
  x1: (p, t) => phys.disp(p, t, p.m1, -1),
  x2: (p, t) => phys.disp(p, t, p.m2, +1),
};
const interacting = (rows) => rows.filter((r) => Math.abs(r.F12) > 0.2 && Math.abs(r.F21) > 0.2);
const after = (rows) => rows.filter((r) => r.t > TAU + 0.05);

export const spec = {
  seed: 1616,
  intro: 'Hai xe có khối lượng khác nhau đặt sát nhau, giữa chúng là lò xo nén. Khi thả, hai xe đẩy nhau. Hai cảm biến lực gắn ở hai xe cho em đọc lực F₁₂ và F₂₁ trong lúc tương tác.',
  goals: [
    'Nhận biết lực tác dụng giữa hai vật bao giờ cũng xuất hiện theo cặp (tác dụng và phản tác dụng).',
    'Rút ra: hai lực có cùng độ lớn, cùng phương, ngược chiều, đặt vào hai vật khác nhau.',
    'Phân biệt cặp lực này với cặp lực cân bằng; giải thích vì sao xe nhẹ hơn lại chạy nhanh hơn.',
  ],
  theory: 'F₁₂ = −F₂₁ (cùng độ lớn, ngược chiều, đặt vào hai vật khác nhau; xuất hiện và mất đi đồng thời). &nbsp; Vì F có cùng độ lớn và thời gian tác dụng nên a₁/a₂ = m₂/m₁ và |v₁|/|v₂| = m₂/m₁.',
  setup: 'F₁₂ là lực do xe 2 tác dụng lên xe 1 (đo ở xe 1), F₂₁ là lực do xe 1 tác dụng lên xe 2 (đo ở xe 2). Chiều dương hướng sang phải. Lực chỉ có trong khoảng 0,3 s đầu; kéo thanh t chậm hoặc chọn tốc độ 0,25× để đọc số liệu, ghi nhiều lần trong lúc tương tác (t từ 0,03 đến 0,27 s), thêm 1–2 lần sau khi hai xe rời nhau (t > 0,4 s).',
  params: [
    { k: 'm1', label: 'Khối lượng xe 1 (m₁)', unit: 'kg', min: 0.4, max: 1.0, step: 0.1, def: 0.5, dec: 1 },
    { k: 'm2', label: 'Khối lượng xe 2 (m₂)', unit: 'kg', min: 0.4, max: 1.0, step: 0.1, def: 0.8, dec: 1 },
    { k: 'Fmax', label: 'Lực tương tác lớn nhất (độ nén lò xo)', unit: 'N', min: 1, max: 3, step: 0.5, def: 2, dec: 1 },
  ],
  toggles: [{ k: 'vec', label: 'Hiện vectơ lực và vận tốc', def: true }],
  stageHeight: 250,
  ariaLabel: 'Hai xe có lò xo ở giữa đẩy nhau ra, hai vectơ lực F12 và F21 bằng nhau và ngược chiều',
  duration: () => TMAX,
  state: (p, t) => ({ F: phys.F(p, t), x1: phys.x1(p, t), x2: phys.x2(p, t), v1: phys.v1(p, t), v2: phys.v2(p, t) }),
  readouts: (p, s) => [['F₁₂', fmt(-s.F, 2) + ' N'], ['F₂₁', fmt(s.F, 2) + ' N'], ['v₁', fmt(s.v1, 2) + ' m/s'], ['v₂', fmt(s.v2, 2) + ' m/s']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const cx = w / 2, ppm = (w - 40) / (2 * HALF), yg = h - 52, lift = 4;
    const cw1 = 36 + p.m1 * 22, cw2 = 36 + p.m2 * 22, ch1 = 24 + p.m1 * 16, ch2 = 24 + p.m2 * 16, gap = 12;
    const c1 = cx - gap - cw1 / 2 + s.x1 * ppm, c2 = cx + gap + cw2 / 2 + s.x2 * ppm;
    ground(ctx, 10, w - 10, yg + 4, th);
    rect(ctx, 10, yg - 2, w - 20, 6, th.road, th.axis, 2);
    ruler(ctx, cx, yg + 14, ppm, -1.5, 1.5, 0.25, th, { unit: 'm', labelEvery: 4 });
    const e1 = c1 + cw1 / 2, e2 = c2 - cw2 / 2;
    if (t < TAU) spring(ctx, e1, yg - lift - 10, e2, yg - lift - 10, th.muted, 4, 7);
    rect(ctx, c1 - cw1 / 2, yg - lift - ch1, cw1, ch1, th.car, null, 5);
    rect(ctx, c2 - cw2 / 2, yg - lift - ch2, cw2, ch2, th.s2, null, 5);
    for (const [c, ch, name, m] of [[c1, ch1, 'Xe 1', p.m1], [c2, ch2, 'Xe 2', p.m2]]) {
      text(ctx, name, c, yg - lift - ch / 2 - 1, { color: '#fff', size: 12, align: 'center', bold: true });
      text(ctx, `${fmt(m, 1)} kg`, c, yg - lift - ch / 2 + 12, { color: '#fff', size: 11, align: 'center' });
    }
    if (!tg.vec) return;
    const ya = yg - lift - Math.max(ch1, ch2) - 12, yt = ya - 14;
    if (s.F > 0.01) {
      const L = s.F * 26, yb = ya;
      arrow(ctx, e1, ya, e1 - L, ya, th.accent, 3.5);
      arrow(ctx, e2, yb, e2 + L, yb, th.s3, 3.5);
      text(ctx, `F₁₂ = ${fmt(-s.F, 2)} N`, e1 + 6, yt, { color: th.accent, size: 13, align: 'right', bold: true });
      text(ctx, `F₂₁ = ${fmt(s.F, 2)} N`, e2 - 6, yt, { color: th.s3, size: 13, align: 'left', bold: true });
      text(ctx, 'đặt vào xe 1', e1 + 6, yt - 16, { color: th.muted, size: 11, align: 'right' });
      text(ctx, 'đặt vào xe 2', e2 - 6, yt - 16, { color: th.muted, size: 11, align: 'left' });
    } else if (t > 0) {
      text(ctx, 'F = 0: hai xe đã rời nhau', cx, yt, { color: th.muted, size: 13, align: 'center' });
    }
    const yv = yt - 48;
    if (Math.abs(s.v1) > 0.02) { arrow(ctx, c1, yv, c1 + s.v1 * 36, yv, th.accent, 3); text(ctx, 'v₁', c1 + s.v1 * 36 - 6, yv - 6, { color: th.accent, size: 12, bold: true, align: 'right' }); }
    if (Math.abs(s.v2) > 0.02) { arrow(ctx, c2, yv, c2 + s.v2 * 36, yv, th.s3, 3); text(ctx, 'v₂', c2 + s.v2 * 36 + 6, yv - 6, { color: th.s3, size: 12, bold: true }); }
  },
  columns: [
    { k: 't', label: 't', unit: 's', dec: 2 }, { k: 'F12', label: 'F₁₂', unit: 'N', dec: 2 }, { k: 'F21', label: 'F₂₁', unit: 'N', dec: 2 },
    { k: 'v1', label: 'v₁', unit: 'm/s', dec: 2 }, { k: 'v2', label: 'v₂', unit: 'm/s', dec: 2 },
  ],
  recordLabel: 'Ghi số liệu (t, F₁₂, F₂₁, v₁, v₂)',
  note: 'Mỗi lần ghi: hai cảm biến lực đọc độc lập, sai số khoảng 0,03 N, chia 0,01 N; đồng hồ sai số 0,01 s; cổng quang đọc v với sai số khoảng 0,005 m/s.',
  record: (p, s, t, n) => ({
    t: n.round(t + n.noise(0.01), 0.01),
    F12: n.round(-s.F + n.noise(0.03), 0.01), F21: n.round(s.F + n.noise(0.03), 0.01),
    v1: n.round(s.v1 + n.noise(0.005), 0.01), v2: n.round(s.v2 + n.noise(0.005), 0.01), m1: p.m1, m2: p.m2,
  }),
  demo: async (api) => { for (const t of [0.05, 0.1, 0.15, 0.2, 0.25, 0.6, 0.9]) { api.setT(t); api.record(); } },
  graphs: [
    { title: 'Đồ thị F₂₁ theo F₁₂', xlabel: 'F₁₂ (N)', ylabel: 'F₂₁ (N)', x: 'F12', y: 'F21', fit: 'origin', dec: 3, curve: (p) => [[-p.Fmax, p.Fmax], [0, 0]], marker: (p, s) => [-s.F, s.F] },
    { title: 'Đồ thị lực theo thời gian', xlabel: 't (s)', ylabel: 'F₂₁ (N)', x: 't', y: 'F21', curve: (p) => Array.from({ length: 49 }, (_, i) => [i * 0.025, phys.F(p, i * 0.025)]), marker: (p, s, t) => [t, s.F], zeroX: true, zeroY: true },
  ],
  predict: {
    prompt: '<p>Với m₁ và m₂ đang chọn, hãy dự đoán tỉ số độ lớn vận tốc <b>|v₁|/|v₂|</b> của hai xe sau khi chúng rời nhau.</p>',
    fields: [{ k: 'r', label: '|v₁|/|v₂|', dec: 3 }],
    expected: (p) => ({ r: Math.abs(phys.v1(p, TMAX) / phys.v2(p, TMAX)) }), tol: 0.03, absTol: 0.02,
    explain: (p) => `Cùng độ lớn lực, cùng thời gian tác dụng nên Δv tỉ lệ nghịch với khối lượng: |v₁|/|v₂| = m₂/m₁ = ${fmt(p.m2 / p.m1, 3)}.`,
  },
  tasks: [
    {
      title: 'Xử lí số liệu: so sánh F₁₂ và F₂₁',
      prompt: '<p>Ghi ít nhất 4 lần đo trong lúc hai xe tương tác (|F| &gt; 0,2 N). Tính <b>tỉ số ΣF₂₁/ΣF₁₂</b> của các lần đó (cộng riêng từng cột rồi chia) và <b>độ lệch lớn nhất |F₁₂ + F₂₁|</b> trong các lần đo. Hai lực trực đối thì tỉ số ≈ −1 và độ lệch chỉ do sai số đo.</p>',
      fields: [{ k: 'ratio', label: 'ΣF₂₁/ΣF₁₂', dec: 3, absTol: 0.03 }, { k: 'diff', label: 'max |F₁₂ + F₂₁|', unit: 'N', dec: 2, absTol: 0.03 }],
      need: (rows) => (interacting(rows).length < 4 ? 'Cần ít nhất 4 lần ghi trong lúc hai xe đang tương tác (t từ 0,03 đến 0,27 s).' : null), tol: 0.03,
      expected: (p, rows) => {
        const r = interacting(rows), s12 = r.reduce((a, x) => a + x.F12, 0), s21 = r.reduce((a, x) => a + x.F21, 0);
        return { ratio: s21 / s12, diff: Math.max(...r.map((x) => Math.abs(x.F12 + x.F21))) };
      },
      explain: () => 'Tỉ số ≈ −1: F₁₂ và F₂₁ cùng độ lớn, ngược chiều. Độ lệch nhỏ chỉ do sai số của cảm biến, không phải do hai lực khác nhau.',
    },
    {
      title: 'Xử lí số liệu: vận tốc hai xe sau tương tác',
      prompt: '<p>Ghi ít nhất 1 lần đo sau khi hai xe rời nhau (t &gt; 0,4 s). Với <b>lần đo sau cùng</b>, tính tỉ số |v₁|/|v₂|, rồi tìm <b>khối lượng xe 2</b> theo m₂ = m₁·|v₁|/|v₂| (m₁ là khối lượng xe 1 đã chọn).</p>',
      fields: [{ k: 'r', label: '|v₁|/|v₂|', dec: 3, absTol: 0.03 }, { k: 'm2', label: 'm₂ = m₁·|v₁|/|v₂|', unit: 'kg', dec: 3, absTol: 0.03 }],
      need: (rows) => (after(rows).length < 1 ? 'Cần ít nhất 1 lần ghi sau khi hai xe rời nhau (t > 0,4 s).' : null), tol: 0.04,
      expected: (p, rows) => { const q = after(rows), r = q[q.length - 1], k = Math.abs(r.v1 / r.v2); return { r: k, m2: r.m1 * k }; },
      explain: () => 'Hai xe chịu lực cùng độ lớn trong cùng thời gian, xe nhẹ hơn thu được vận tốc lớn hơn: m₁|v₁| = m₂|v₂|.',
      reference: (p) => `Khối lượng xe 2 đặt trong mô phỏng: m₂ = ${fmt(p.m2, 1)} kg.`,
    },
  ],
  quiz: [
    { q: 'Xe 1 đẩy xe 2 bằng lực 3 N. Xe 2 tác dụng lên xe 1 một lực:', o: ['3 N, ngược chiều', '3 N, cùng chiều', 'nhỏ hơn 3 N vì xe 2 nặng hơn'], a: 0, why: 'Hai lực trực đối: cùng độ lớn, cùng phương, ngược chiều, bất kể khối lượng.' },
    { q: 'Lực và phản lực (định luật 3 Newton) KHÔNG cân bằng nhau vì:', o: ['chúng có độ lớn khác nhau', 'chúng đặt vào hai vật khác nhau', 'chúng cùng chiều'], a: 1, why: 'Hai lực cân bằng phải cùng đặt vào một vật; lực – phản lực đặt vào hai vật khác nhau.' },
    { q: 'Hai xe được thả bởi lò xo. Xe 1 nặng 0,5 kg, xe 2 nặng 1,0 kg. Tỉ số |v₁|/|v₂| sau khi rời nhau là:', o: ['0,5', '1', '2'], a: 2, why: '|v₁|/|v₂| = m₂/m₁ = 1,0/0,5 = 2.' },
    { q: 'Người nhảy từ thuyền nhỏ lên bờ thì thuyền lùi ra sau. Nguyên nhân là:', o: ['lực của người lên thuyền và lực của thuyền lên người là cặp lực trực đối', 'thuyền bị trọng lực kéo', 'quán tính của nước'], a: 0, why: 'Người đẩy thuyền ra sau thì thuyền đẩy người ra trước với lực cùng độ lớn.' },
    { q: 'Hai xe: F₁₂ = −2,40 N. Số chỉ của cảm biến ở xe 2 (F₂₁) là:', o: ['−2,40 N', '+2,40 N', '0'], a: 1, why: 'F₂₁ = −F₁₂ = +2,40 N.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

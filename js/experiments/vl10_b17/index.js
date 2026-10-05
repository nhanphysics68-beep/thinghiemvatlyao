// Vật lí 10 – Bài 17: Trọng lực và lực căng (máy Atwood: hai vật treo qua ròng rọc).
import { mountLab } from '../../core/lab.js';
import { mean, fmt } from '../../core/stats.js';
import { arrow, text, circle, rect, line } from '../../core/draw.js';

const G = 9.8, L = 1.0, TCAP = 2.5, MIN_T = 0.3;

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
// Ròng rọc và dây nhẹ, không ma sát. Chiều dương: vật 2 đi xuống (vật 1 đi lên). a < 0 nếu m1 > m2.
export const phys = {
  G,
  P: (m) => m * G,                                              // trọng lực P = mg
  a: (p) => ((p.m2 - p.m1) * G) / (p.m1 + p.m2),
  T: (p) => (2 * p.m1 * p.m2 * G) / (p.m1 + p.m2),
  x: (p, t) => 0.5 * phys.a(p) * t * t,                         // độ dời của vật 2 (xuống: dương)
  v: (p, t) => phys.a(p) * t,
  duration: (p) => (Math.abs(phys.a(p)) < 1e-9 ? TCAP : Math.min(TCAP, Math.sqrt((2 * L) / Math.abs(phys.a(p))))),
};
const usable = (rows) => rows.filter((r) => Math.abs(r.m2 - r.m1) >= 0.05);

export const spec = {
  seed: 1717,
  intro: 'Hai vật treo ở hai đầu một sợi dây vắt qua ròng rọc. Em đo gia tốc, so sánh trọng lực P = mg của mỗi vật với lực căng dây T để hiểu vì sao hệ chuyển động hoặc đứng yên.',
  goals: [
    'Nhớ lại trọng lực P = mg và lực căng dây T là lực do dây tác dụng lên vật, hướng dọc theo dây.',
    'Vận dụng định luật 2 Newton cho từng vật để tìm gia tốc và lực căng.',
    'Dùng gia tốc đo được để tính gia tốc rơi tự do g.',
  ],
  theory: 'Vật 1 (đi lên): T − m₁g = m₁a &nbsp;&nbsp; Vật 2 (đi xuống): m₂g − T = m₂a<br>a = (m₂ − m₁)g/(m₁ + m₂) &nbsp;&nbsp; T = 2m₁m₂g/(m₁ + m₂) = m₁(g + a) &nbsp;&nbsp; (g = 9,8 m/s²). Khi m₁ = m₂ thì a = 0 và T = mg.',
  setup: 'Đặt m₁, m₂, bấm Chạy (hoặc kéo thanh t) rồi ghi số liệu khi t ≥ 0,3 s. Cổng quang đo t, thước đo độ dời x của vật 2, lực kế gắn vào dây đọc T. Chiều dương: vật 2 đi xuống.',
  params: [
    { k: 'm1', label: 'Khối lượng vật 1 (m₁)', unit: 'kg', min: 0.1, max: 0.6, step: 0.05, def: 0.3, dec: 2 },
    { k: 'm2', label: 'Khối lượng vật 2 (m₂)', unit: 'kg', min: 0.1, max: 0.6, step: 0.05, def: 0.5, dec: 2 },
  ],
  toggles: [{ k: 'vec', label: 'Hiện trọng lực P và lực căng T', def: true }],
  stageHeight: 340,
  ariaLabel: 'Hai vật treo qua ròng rọc, có vectơ trọng lực và lực căng dây',
  duration: (p) => phys.duration(p),
  state: (p, t) => ({ x: phys.x(p, t), v: phys.v(p, t), a: phys.a(p), T: phys.T(p), P1: phys.P(p.m1), P2: phys.P(p.m2) }),
  readouts: (p, s) => [['a', fmt(s.a, 2) + ' m/s²'], ['x', fmt(s.x, 3) + ' m'], ['v', fmt(s.v, 2) + ' m/s'], ['T', fmt(s.T, 2) + ' N']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const cx = w / 2, py = 44, R = 24, ppm = Math.min(88, (h - 170) / 2), yc0 = 95 + ppm, k = 10;
    const y1 = yc0 - s.x * ppm, y2 = yc0 + s.x * ppm;
    const bw = 34, bh1 = 20 + p.m1 * 40, bh2 = 20 + p.m2 * 40, xl = cx - R, xr = cx + R;
    line(ctx, cx - 70, py - R - 10, cx + 70, py - R - 10, th.axis, 3); line(ctx, cx, py - R - 10, cx, py - 6, th.axis, 3);
    circle(ctx, cx, py, R, th.soft, th.ink); circle(ctx, cx, py, 4, th.ink);
    line(ctx, xl, py, xl, y1 - bh1 / 2, th.ink, 1.8); line(ctx, xr, py, xr, y2 - bh2 / 2, th.ink, 1.8);
    rect(ctx, xl - bw / 2, y1 - bh1 / 2, bw, bh1, th.car, null, 4); rect(ctx, xr - bw / 2, y2 - bh2 / 2, bw, bh2, th.s2, null, 4);
    text(ctx, 'm₁', xl, y1 + 4, { color: '#fff', size: 12, align: 'center', bold: true });
    text(ctx, 'm₂', xr, y2 + 4, { color: '#fff', size: 12, align: 'center', bold: true });
    if (!tg.vec) return;
    const side = (xa, yb, T, P, sgn, name) => {
      arrow(ctx, xa, yb, xa, yb - T * k, th.accent, 3.5); arrow(ctx, xa, yb, xa, yb + P * k, th.bad, 3.5);
      const al = sgn < 0 ? 'right' : 'left', dx = sgn * 7;
      text(ctx, 'T', xa + dx, yb - T * k + 10, { color: th.accent, size: 12, align: al, bold: true });
      text(ctx, `P${name}`, xa + dx, yb + P * k - 2, { color: th.bad, size: 12, align: al, bold: true });
    };
    side(xl - bw / 2 - 12, y1, s.T, s.P1, -1, '₁'); side(xr + bw / 2 + 12, y2, s.T, s.P2, +1, '₂');
    text(ctx, `a = ${fmt(s.a, 2)} m/s²`, 10, h - 12, { color: th.muted, size: 12 });
    text(ctx, `T = ${fmt(s.T, 2)} N`, w - 10, h - 12, { color: th.accent, size: 12, align: 'right', bold: true });
  },
  columns: [
    { k: 'm1', label: 'm₁', unit: 'kg', dec: 3 }, { k: 'm2', label: 'm₂', unit: 'kg', dec: 3 }, { k: 't', label: 't', unit: 's', dec: 3 },
    { k: 'x', label: 'x', unit: 'm', dec: 3 }, { k: 'a', label: 'a = 2x/t²', unit: 'm/s²', dec: 3 }, { k: 'T', label: 'T (lực kế)', unit: 'N', dec: 2 },
  ],
  recordLabel: 'Ghi số liệu (m₁, m₂, t, x, T)',
  note: 'Mỗi lần ghi: cân chia 1 g, cổng quang đo t với sai số khoảng 0,005 s, thước đo x chia 1 mm, lực kế chia 0,01 N (sai số khoảng 0,02 N). a tính theo a = 2x/t². Dấu của a: dương nếu vật 2 đi xuống.',
  record: (p, s, t, n) => {
    if (t < MIN_T) return { error: `Hãy để hệ chuyển động ít nhất ${fmt(MIN_T, 1)} s rồi mới ghi.` };
    const m1 = n.round(p.m1 + n.noise(0.0005), 0.001), m2 = n.round(p.m2 + n.noise(0.0005), 0.001);
    const tt = n.round(t + n.noise(0.005), 0.001), x = n.round(s.x + n.noise(0.002), 0.001);
    return { m1, m2, t: tt, x, a: n.round((2 * x) / (tt * tt), 0.001), T: n.round(s.T + n.noise(0.02), 0.01) };
  },
  demo: async (api) => {
    for (const [m1, m2] of [[0.3, 0.5], [0.2, 0.5], [0.1, 0.6], [0.4, 0.5], [0.5, 0.3], [0.25, 0.55], [0.35, 0.35]]) {
      api.setParam('m1', m1); api.setParam('m2', m2); api.setT(Math.min(api.duration(), 0.8)); api.record();
    }
  },
  graphs: [
    { title: 'Đồ thị x – t² (độ dời theo t²)', xlabel: 't² (s²)', ylabel: 'x (m)', x: 't2', y: 'x', fit: 'origin', dec: 3, zeroX: true, zeroY: true,
      curve: (p) => { const T = phys.duration(p); return [[0, 0], [T * T, phys.x(p, T)]]; }, marker: (p, s, t) => [t * t, s.x] },
    { title: 'Đồ thị gia tốc a theo (m₂ − m₁)/(m₁ + m₂)', xlabel: '(m₂ − m₁)/(m₁ + m₂)', ylabel: 'a (m/s²)', x: 'q', y: 'a', fit: 'origin', dec: 2, zeroX: true, zeroY: true,
      curve: () => [[-1, -G], [1, G]], marker: (p, s) => [(p.m2 - p.m1) / (p.m1 + p.m2), s.a] },
  ],
  predict: {
    prompt: '<p>Với m₁ và m₂ đang chọn, hãy dự đoán gia tốc a của vật 2 (dương nếu đi xuống) và lực căng dây T.</p>',
    fields: [{ k: 'a', label: 'a', unit: 'm/s²' }, { k: 'T', label: 'T', unit: 'N' }],
    expected: (p) => ({ a: phys.a(p), T: phys.T(p) }), tol: 0.02, absTol: 0.03,
    explain: (p) => `a = (m₂ − m₁)g/(m₁ + m₂) = ${fmt(phys.a(p), 2)} m/s²; T = m₁(g + a) = ${fmt(phys.T(p), 2)} N.`,
  },
  tasks: [
    {
      title: 'Xử lí số liệu: tính gia tốc rơi tự do g',
      prompt: '<p>Ghi ít nhất 3 lần đo với m₁ ≠ m₂ (chênh nhau từ 0,05 kg trở lên; nên đổi cặp khối lượng). Với mỗi lần, tính g = a(m₁ + m₂)/(m₂ − m₁), rồi lấy <b>trung bình</b> các lần (bỏ lần đo có m₁ ≈ m₂).</p>',
      fields: [{ k: 'g', label: 'g trung bình', unit: 'm/s²', dec: 2, absTol: 0.1 }],
      need: (rows) => (usable(rows).length < 3 ? 'Cần ít nhất 3 lần đo có |m₂ − m₁| ≥ 0,05 kg.' : null), tol: 0.02,
      expected: (p, rows) => ({ g: mean(usable(rows).map((r) => (r.a * (r.m1 + r.m2)) / (r.m2 - r.m1))) }),
      explain: (p, rows, e) => `Kết quả g ≈ ${fmt(e.g, 2)} m/s², gần giá trị 9,8 m/s² (sai lệch do sai số đo).`,
    },
    {
      title: 'Trọng lực và lực căng ở lần đo cuối',
      prompt: '<p>Với <b>lần đo cuối</b> trong bảng, tính trọng lực của vật 2 (P₂ = m₂g, lấy g = 9,8 m/s²) và lực căng dây theo định luật 2 Newton cho vật 1: T = m₁(g + a). So với số chỉ lực kế.</p>',
      fields: [{ k: 'P2', label: 'P₂ = m₂g', unit: 'N', dec: 2, absTol: 0.03 }, { k: 'T', label: 'T = m₁(g + a)', unit: 'N', dec: 2, absTol: 0.05 }],
      minRows: 1, tol: 0.03,
      expected: (p, rows) => { const r = rows[rows.length - 1]; return { P2: r.m2 * G, T: r.m1 * (G + r.a) }; },
      explain: (p, rows, e) => { const r = rows[rows.length - 1]; return `Lực kế chỉ ${fmt(r.T, 2)} N, gần với T tính được (${fmt(e.T, 2)} N). ${r.m2 > r.m1 ? 'Vật 2 có P₂ lớn hơn T nên đi xuống, vật 1 có T lớn hơn P₁ nên đi lên.' : r.m1 > r.m2 ? 'Vật 1 có P₁ lớn hơn T nên đi xuống, vật 2 có T lớn hơn P₂ nên đi lên.' : 'Hai vật có trọng lực bằng nhau nên đứng yên, T = P.'}`; },
    },
  ],
  quiz: [
    { q: 'Vật 0,5 kg có trọng lực (g = 9,8 m/s²) là:', o: ['0,5 N', '4,9 N', '49 N'], a: 1, why: 'P = mg = 0,5·9,8 = 4,9 N.' },
    { q: 'Vật treo đứng yên bằng một sợi dây nhẹ. Lực căng dây có độ lớn:', o: ['bằng trọng lực của vật', 'lớn hơn trọng lực', 'bằng không'], a: 0, why: 'Hợp lực bằng 0 nên T = P = mg.' },
    { q: 'Máy Atwood có m₁ = 0,2 kg, m₂ = 0,6 kg (g = 9,8 m/s²). Gia tốc của hệ là:', o: ['2,45 m/s²', '4,9 m/s²', '9,8 m/s²'], a: 1, why: 'a = (0,6 − 0,2)·9,8/(0,2 + 0,6) = 4,9 m/s².' },
    { q: 'Với hệ ở câu trên, lực căng dây là:', o: ['1,96 N', '2,94 N', '5,88 N'], a: 1, why: 'T = m₁(g + a) = 0,2·(9,8 + 4,9) = 2,94 N (cũng bằng m₂(g − a) = 0,6·4,9).' },
    { q: 'Khi m₁ = m₂ = m thì gia tốc của hệ và lực căng dây là:', o: ['a = 0 và T = mg', 'a = g và T = 0', 'a = 0 và T = 2mg'], a: 0, why: 'Hai trọng lực bằng nhau nên a = 0, mỗi vật cân bằng: T = mg.' },
  ],
};
const rec0 = spec.record;
spec.record = (p, s, t, n, rows) => { const r = rec0(p, s, t, n, rows); if (!r.error) { r.t2 = r.t * r.t; r.q = (r.m2 - r.m1) / (r.m1 + r.m2); } return r; };

export const mount = (root, entry) => mountLab(root, entry, spec);

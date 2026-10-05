// Vật lí 10 – Bài 6: Thực hành đo tốc độ của vật chuyển động (cổng quang điện + đồng hồ hiện số).
import { mountLab } from '../../core/lab.js';
import { mean, fmt } from '../../core/stats.js';
import { text, line, rect, circle } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
// Xe trượt trên đệm khí, bị ma sát nhỏ làm chậm với gia tốc −a (a rất nhỏ). Vị trí đầu tấm chắn: x = v₀t − ½at².
export const XA = 0.3, W = 0.05, LTRACK = 1.6;      // cổng A đặt tại 0,30 m; bề rộng tấm chắn 5,0 cm
export const phys = {
  XA, W,
  x: (p, t) => p.v0 * t - 0.5 * p.a * t * t,                                       // vị trí đầu tấm chắn (m)
  v: (p, t) => Math.max(0, p.v0 - p.a * t),
  // thời điểm đầu tấm chắn tới vị trí x (nghiệm nhỏ của v₀t − ½at² = x)
  tAt: (v0, a, x) => (a < 1e-12 ? x / v0 : (v0 - Math.sqrt(v0 * v0 - 2 * a * x)) / a),
  vAtX: (v0, a, x) => Math.sqrt(Math.max(0, v0 * v0 - 2 * a * x)),
  // thời gian giữa cổng A (tại XA) và cổng B (tại XA + s): đồng hồ chế độ A↔B
  tAB: (v0, a, s) => phys.tAt(v0, a, XA + s) - phys.tAt(v0, a, XA),
  // thời gian tấm chắn che chùm sáng tại cổng đặt ở x_g (từ lúc đầu tấm chắn tới x_g đến lúc đuôi qua x_g)
  tBlock: (v0, a, xg) => phys.tAt(v0, a, xg + W) - phys.tAt(v0, a, xg),
  tEnd: (p) => phys.tAt(p.v0, p.a, 1.5),
};

export const spec = {
  seed: 6006,
  intro: 'Xe có tấm chắn sáng trượt trên đệm khí qua hai cổng quang điện. Đồng hồ hiện số cho biết thời gian giữa hai cổng; em tính tốc độ trung bình và so sánh với tốc độ tức thời đo bằng một cổng.',
  goals: [
    'Biết bố trí cổng quang điện và đồng hồ hiện số để đo thời gian chuyển động.',
    'Tính tốc độ trung bình v = s/t từ nhiều lần đo, ghi kết quả v̄ ± Δv̄.',
    'Đo tốc độ tức thời bằng tấm chắn sáng v ≈ w/Δt và so sánh với tốc độ trung bình.',
  ],
  theory: 'Chế độ hai cổng A↔B: v₁ = s/t (s là khoảng cách hai cổng, t là số chỉ đồng hồ)<br>Chế độ một cổng: v₂ ≈ w/Δt (w = 5,0 cm là bề rộng tấm chắn, Δt là thời gian che sáng)<br>v̄ = (v₁ + … + vₙ)/n; Δv̄ = (|v₁ − v̄| + … + |vₙ − v̄|)/n',
  setup: 'Cổng A cố định cách đầu đường ray 0,30 m; chỉnh khoảng cách s tới cổng B. Mỗi lần bấm “Đo” là một lần đẩy xe (lực đẩy hơi khác nhau nên tốc độ dao động nhẹ). Nên đo lặp ít nhất 5 lần ở cùng s, sau đó đổi s để vẽ đồ thị s – t.',
  params: [
    { k: 's', label: 'Khoảng cách hai cổng s', unit: 'm', min: 0.2, max: 1, step: 0.05, def: 0.5, dec: 2 },
    { k: 'v0', label: 'Tốc độ đẩy ban đầu v₀', unit: 'm/s', min: 0.4, max: 1.2, step: 0.05, def: 0.8, dec: 2 },
    { k: 'a', label: 'Độ chậm dần do ma sát nhỏ a', unit: 'm/s²', min: 0, max: 0.03, step: 0.005, def: 0.01, dec: 3 },
  ],
  clearOnParam: ['v0', 'a'],
  stageHeight: 215,
  ariaLabel: 'Đường ray đệm khí có xe mang tấm chắn sáng, hai cổng quang điện A và B và đồng hồ hiện số',
  duration: (p) => phys.tEnd(p),
  state(p, t) {
    const x = phys.x(p, t), tA = phys.tAt(p.v0, p.a, XA), tAB = phys.tAB(p.v0, p.a, p.s);
    return { x, v: phys.v(p, t), timer: Math.min(Math.max(t - tA, 0), tAB), tA, xB: XA + p.s, blkA: x >= XA && x - W < XA, blkB: x >= XA + p.s && x - W < XA + p.s };
  },
  readouts: (p, s) => [['x', fmt(s.x, 2) + ' m'], ['v', fmt(s.v, 3) + ' m/s'], ['đồng hồ', fmt(s.timer, 3) + ' s']],
  draw(ctx, { w, h }, s, p, t, th) {
    const x0 = 22, ppm = (w - 44) / LTRACK, X = (m) => x0 + m * ppm, yt = h - 62;
    // đường ray và thước
    rect(ctx, X(0), yt, LTRACK * ppm, 8, th.road, th.axis, 2);
    ctx.save(); ctx.strokeStyle = th.axis; ctx.fillStyle = th.muted; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center';
    for (let m = 0; m <= 1.6001; m += 0.1) { const big = Math.abs(m * 10 - Math.round(m * 10)) < 1e-6 && Math.round(m * 10) % 2 === 0; ctx.beginPath(); ctx.moveTo(X(m), yt + 8); ctx.lineTo(X(m), yt + (big ? 14 : 11)); ctx.stroke(); if (big) ctx.fillText(m.toFixed(1).replace('.', ','), X(m), yt + 26); }
    ctx.textAlign = 'right'; ctx.fillText('m', X(LTRACK), yt + 40); ctx.restore();
    // xe (đầu tấm chắn ở x)
    const cl = 0.13 * ppm, cx = X(s.x), ch = 18;
    rect(ctx, cx - cl, yt - ch, cl, ch, th.car, null, 4); circle(ctx, cx - cl + 6, yt - 1, 3.5, th.ink); circle(ctx, cx - 6, yt - 1, 3.5, th.ink);
    rect(ctx, cx - W * ppm, yt - ch - 22, Math.max(3, W * ppm), 22, th.s3, null, 1);        // tấm chắn sáng
    // hai cổng quang điện
    for (const [g, xm, blk] of [['A', XA, s.blkA], ['B', s.xB, s.blkB]]) {
      const gx = X(xm), top = yt - 78;
      line(ctx, gx, yt, gx, top, th.ink, 3); rect(ctx, gx - 9, top - 4, 18, 8, th.ink, null, 2);
      line(ctx, gx, top + 4, gx, yt - 2, blk ? th.bad : th.s2, blk ? 2.5 : 1.5, blk ? [] : [3, 3]);      // chùm sáng
      text(ctx, g, gx, top - 10, { color: th.ink, size: 14, align: 'center', bold: true });
    }
    // khoảng cách s
    const ax = X(XA), bx = X(s.xB), ay = yt + 52 > h - 8 ? h - 8 : yt + 52;
    line(ctx, ax, ay - 7, bx, ay - 7, th.accent, 2); line(ctx, ax, ay - 12, ax, ay - 2, th.accent, 2); line(ctx, bx, ay - 12, bx, ay - 2, th.accent, 2);
    text(ctx, `s = ${fmt(p.s, 2)} m`, (ax + bx) / 2, ay - 11, { color: th.accent, size: 12, align: 'center' });
    // đồng hồ hiện số (góc trên bên trái, tránh cổng khi hẹp)
    const dw = 128; rect(ctx, 8, 8, dw, 34, '#10231a', th.ink, 5);
    ctx.save(); ctx.fillStyle = '#4cf08a'; ctx.font = '600 20px ui-monospace, Menlo, monospace'; ctx.textAlign = 'right'; ctx.fillText(s.timer.toFixed(3).replace('.', ','), 8 + dw - 30, 32); ctx.font = '12px system-ui'; ctx.textAlign = 'left'; ctx.fillText('s', 8 + dw - 22, 32); ctx.restore();
  },
  columns: [
    { k: 's', label: 's', unit: 'm', dec: 3 }, { k: 't', label: 't', unit: 's', dec: 3 }, { k: 'v', label: 'v₁', unit: 'm/s', dec: 3 },
    { k: 'tc', label: 'Δt', unit: 'ms', dec: 1 }, { k: 'v2', label: 'v₂', unit: 'm/s', dec: 3 },
  ],
  recordLabel: 'Đo một lần (thả xe)',
  note: 'Thước đo khoảng cách hai cổng có sai số khoảng 1 mm; đồng hồ hiện số chia 0,001 s (độ lệch kích hoạt khoảng 0,5 ms); w = 5,00 cm đo bằng thước kẹp.',
  record(p, s, t, n) {
    const v0 = p.v0 * (1 + n.noise(0.012));                  // lực đẩy mỗi lần hơi khác nhau
    const sm = n.round(p.s + n.noise(0.001), 0.001);
    const tm = n.round(phys.tAB(v0, p.a, p.s) + n.noise(0.0005), 0.001);
    const tc = n.round((phys.tBlock(v0, p.a, XA + p.s) + n.noise(0.0002)) * 1000, 0.1);
    return { n: 0, s: sm, t: tm, v: sm / tm, tc, v2: W / (tc / 1000) };
  },
  graphs: [
    { title: 'Đồ thị s – t (hai cổng)', xlabel: 't (s)', ylabel: 's (m)', x: 't', y: 's', fit: 'origin', dec: 3, zeroX: true, zeroY: true },
    { title: 'Tốc độ v₁ = s/t qua các lần đo', xlabel: 'Lần đo', ylabel: 'v₁ (m/s)', x: 'n', y: 'v', dec: 3, range: (p) => ({ ymin: 0.9 * p.v0, ymax: 1.04 * p.v0 }) },
  ],
  predict: {
    prompt: '<p>Nếu xe chuyển động đều (bỏ qua ma sát) với tốc độ v₀ đang chọn, đồng hồ hiện số ở chế độ A↔B sẽ chỉ bao nhiêu giây khi hai cổng cách nhau s đang chọn?</p>',
    fields: [{ k: 't', label: 't = s/v₀', unit: 's', dec: 3 }],
    expected: (p) => ({ t: p.s / p.v0 }), tol: 0.03, absTol: 0.005,
    explain: (p) => `t = s/v₀ = ${fmt(p.s, 2)}/${fmt(p.v0, 2)} = ${fmt(p.s / p.v0, 3)} s. Số đo thực tế sẽ lớn hơn chút vì xe chậm dần do ma sát (${fmt(phys.tAB(p.v0, p.a, p.s), 3)} s).`,
  },
  tasks: [
    {
      title: 'Xử lí số liệu: tốc độ trung bình và sai số',
      prompt: '<p>Ghi ít nhất 5 lần đo. Từ cột v₁ (= s/t) tính <b>v̄</b> và sai số tuyệt đối trung bình <b>Δv̄ = (Σ|vᵢ − v̄|)/n</b>; từ cột v₂ (= w/Δt, Δt là thời gian che sáng) tính tốc độ trung bình <b>v̄′</b> của phép đo một cổng.</p>',
      fields: [{ k: 'vm', label: 'v̄ (hai cổng)', unit: 'm/s', dec: 3 }, { k: 'dv', label: 'Δv̄', unit: 'm/s', dec: 3 }, { k: 'vm2', label: 'v̄′ (một cổng)', unit: 'm/s', dec: 3 }],
      minRows: 5, tol: 0.03, absTol: 0.003,
      expected: (p, rows) => { const v = rows.map((r) => r.v), m = mean(v); return { vm: m, dv: mean(v.map((x) => Math.abs(x - m))), vm2: mean(rows.map((r) => r.v2)) }; },
      explain: (p, rows, e) => `Kết quả: v = ${fmt(e.vm, 3)} ± ${fmt(e.dv, 3)} m/s. Tốc độ đo bằng một cổng là tốc độ <i>tức thời</i> gần cổng B; ${p.a >= 0.01 ? 'vì xe chậm dần nhẹ nên nó hơi nhỏ hơn tốc độ trung bình giữa hai cổng (chênh lệch nhỏ, có thể bị sai số đo che lấp).' : 'xe gần như chuyển động đều nên nó xấp xỉ bằng tốc độ trung bình giữa hai cổng.'}`,
      reference: (p) => `Cài đặt: v₀ = ${fmt(p.v0, 2)} m/s, a = ${fmt(p.a, 3)} m/s² (xe có thể chậm dần nhẹ).`,
    },
    {
      title: 'Đồ thị s – t: độ dốc là tốc độ',
      prompt: '<p>Đổi khoảng cách s (ít nhất 3 giá trị khác nhau, mỗi giá trị đo 1–2 lần). Đồ thị s – t gần là đường thẳng qua gốc toạ độ; đọc độ dốc trong chú thích dưới đồ thị.</p>',
      fields: [{ k: 'k', label: 'Độ dốc đường khớp', unit: 'm/s', dec: 3 }],
      need: (rows) => (rows.length >= 4 && new Set(rows.map((r) => Math.round(r.s * 10))).size >= 3 ? null : 'Cần ít nhất 4 lần đo với ít nhất 3 khoảng cách s khác nhau (cách nhau từ 0,1 m).'),
      tol: 0.02, absTol: 0.004,
      expected: (p, rows) => { let sxy = 0, sxx = 0; for (const r of rows) { sxy += r.t * r.s; sxx += r.t * r.t; } return { k: sxy / sxx }; },
      explain: () => 'Độ dốc của đồ thị s – t chính là tốc độ (trung bình) của xe.',
      reference: (p) => `Tốc độ đẩy cài đặt v₀ = ${fmt(p.v0, 2)} m/s; xe chậm dần nhẹ nên độ dốc nhỏ hơn v₀ một chút.`,
    },
  ],
  quiz: [
    { q: 'Hai cổng quang điện cách nhau 0,60 m, đồng hồ hiện số chỉ 0,750 s. Tốc độ trung bình của xe là:', o: ['0,45 m/s', '0,80 m/s', '1,25 m/s'], a: 1, why: 'v = s/t = 0,60/0,750 = 0,80 m/s.' },
    { q: 'Tấm chắn sáng rộng 5,0 cm che cổng trong 0,050 s. Tốc độ tức thời xấp xỉ:', o: ['0,25 m/s', '2,5 m/s', '1,0 m/s'], a: 2, why: 'v ≈ w/Δt = 0,050 m / 0,050 s = 1,0 m/s.' },
    { q: 'Để giảm ảnh hưởng của sai số ngẫu nhiên khi đo tốc độ, ta nên:', o: ['đo nhiều lần rồi lấy giá trị trung bình', 'chỉ đo một lần thật cẩn thận', 'đổi dụng cụ sau mỗi lần đo'], a: 0, why: 'Lấy trung bình nhiều lần làm các sai số ngẫu nhiên bù trừ nhau.' },
    { q: 'Đồ thị s – t của vật chuyển động đều là đường thẳng đi qua gốc toạ độ; độ dốc của nó là:', o: ['gia tốc', 'tốc độ', 'quãng đường'], a: 1, why: 'Độ dốc = Δs/Δt = tốc độ.' },
    { q: 'Tấm chắn sáng càng hẹp thì v = w/Δt càng gần tốc độ tức thời vì:', o: ['Δt càng nhỏ thì tốc độ trung bình trong khoảng đó càng gần tốc độ tại một thời điểm', 'tấm chắn nhẹ hơn nên xe nhanh hơn', 'đồng hồ chạy chính xác hơn'], a: 0, why: 'Tốc độ tức thời là giới hạn của tốc độ trung bình khi khoảng thời gian rất nhỏ.' },
  ],
  async demo(api) {
    let i = 0;
    for (const s of [0.3, 0.5, 0.5, 0.5, 0.5, 0.5, 0.7, 0.9]) { api.setParam('s', s); api.setT(0.5 + i++ * 0.1); api.record(); }
  },
};
// đánh số lần đo ngay khi ghi (cột n phục vụ đồ thị thứ hai)
const rec0 = spec.record;
spec.record = (p, s, t, n, rows) => { const r = rec0(p, s, t, n, rows); r.n = rows.length + 1; return r; };

export const mount = (root, entry) => mountLab(root, entry, spec);

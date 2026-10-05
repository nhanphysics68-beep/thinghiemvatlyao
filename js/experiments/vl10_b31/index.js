// Vật lí 10 – Bài 31: Động học của chuyển động tròn đều.
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, line, circle } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
export const phys = {
  omega: (p) => (2 * Math.PI) / p.T,                       // ω = 2π/T
  freq: (p) => 1 / p.T,                                    // f = 1/T
  speed: (p) => phys.omega(p) * p.r,                       // v = ωr
  acc: (p) => phys.omega(p) ** 2 * p.r,                    // a_ht = ω²r = v²/r
  theta: (p, t) => phys.omega(p) * t,                      // góc quay (rad), xuất phát tại trục Ox
  // Vị trí, vectơ vận tốc và gia tốc (m, m/s, m/s²) theo thời gian.
  vec(p, t) {
    const th = phys.theta(p, t), w = phys.omega(p), r = p.r;
    return { x: r * Math.cos(th), y: r * Math.sin(th), vx: -w * r * Math.sin(th), vy: w * r * Math.cos(th), ax: -w * w * r * Math.cos(th), ay: -w * w * r * Math.sin(th) };
  },
};

export const spec = {
  seed: 3131,
  intro: 'Một vật nhỏ chuyển động tròn đều quanh tâm O. Em quan sát hướng của vectơ vận tốc và gia tốc, đo thời gian quay n vòng bằng đồng hồ bấm giây rồi tính chu kì, tần số, tốc độ góc, tốc độ dài và gia tốc hướng tâm.',
  goals: [
    'Nắm các đại lượng đặc trưng: chu kì T, tần số f, tốc độ góc ω, tốc độ dài v.',
    'Vận dụng v = ωr, ω = 2π/T = 2πf và a_ht = ω²r = v²/r.',
    'Nhận biết vectơ vận tốc tiếp tuyến với quỹ đạo, vectơ gia tốc luôn hướng vào tâm.',
  ],
  theory: 'T = t/n &nbsp; f = 1/T &nbsp; ω = Δθ/Δt = 2π/T = 2πf [rad/s]<br>v = ω·r &nbsp;&nbsp; a_ht = v²/r = ω²·r [m/s²]',
  setup: 'Bấm Chạy để xem vật quay. Chọn số vòng n và bán kính r, rồi ghi số liệu: đồng hồ bấm giây đo thời gian t của n vòng (có sai số do phản xạ của người bấm), cảm biến đo tốc độ dài v và gia tốc hướng tâm a. Đổi chu kì T thì bảng số liệu sẽ bị xóa; giữ nguyên T khi thay đổi n và r giữa các lần ghi.',
  params: [
    { k: 'r', label: 'Bán kính quỹ đạo r', unit: 'm', min: 0.2, max: 2, step: 0.1, def: 1, dec: 1 },
    { k: 'T', label: 'Chu kì T', unit: 's', min: 0.5, max: 6, step: 0.1, def: 2, dec: 1 },
    { k: 'n', label: 'Số vòng đo n (đồng hồ bấm giây)', unit: 'vòng', min: 3, max: 20, step: 1, def: 10, dec: 0 },
  ],
  clearOnParam: ['T'],
  toggles: [{ k: 'vec', label: 'Hiện vectơ v và a', def: true }],
  stageHeight: 290,
  ariaLabel: 'Vật chuyển động tròn đều quanh tâm O, kèm vectơ vận tốc tiếp tuyến và vectơ gia tốc hướng tâm',
  duration: (p) => Math.min(15, Math.max(8, 2.5 * p.T)),
  state(p, t) {
    const v = phys.vec(p, t);
    return { ...v, th: phys.theta(p, t), turns: t / p.T, sp: phys.speed(p), a: phys.acc(p) };
  },
  readouts: (p, s) => [['số vòng', fmt(s.turns, 2)], ['ω', fmt(phys.omega(p), 2) + ' rad/s'], ['v', fmt(s.sp, 2) + ' m/s'], ['a', fmt(s.a, 2) + ' m/s²']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const top = 44, cx = w / 2, cy = top + (h - top) / 2, Rmax = Math.min(w / 2 - 24, (h - top) / 2 - 16);
    const R = Math.max(26, (p.r / 2) * Rmax), px = cx + (s.x / p.r) * R, py = cy - (s.y / p.r) * R;
    text(ctx, `Số vòng đã quay: ${fmt(s.turns, 2)}`, 10, 18, { color: th.ink, size: 13, bold: true });
    text(ctx, `r = ${fmt(p.r, 1)} m · T = ${fmt(p.T, 1)} s`, w - 10, 18, { color: th.muted, size: 12, align: 'right' });
    if (tg.vec) {
      text(ctx, `v tiếp tuyến: ${fmt(s.sp, 2)} m/s`, 10, 36, { color: th.s2, size: 12 });
      text(ctx, `a hướng tâm: ${fmt(s.a, 2)} m/s²`, w - 10, 36, { color: th.bad, size: 12, align: 'right' });
    }
    // quỹ đạo, trục Ox, bán kính
    ctx.save(); ctx.strokeStyle = th.axis; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    line(ctx, cx, cy, cx + R + 10, cy, th.grid, 1, [2, 3]);
    line(ctx, cx, cy, px, py, th.muted, 1.5);
    // cung góc quay θ (tô nhạt khi chưa quá một vòng)
    const frac = s.th % (2 * Math.PI);
    ctx.save(); ctx.strokeStyle = th.accent; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, -frac, true); ctx.stroke(); ctx.restore();
    text(ctx, 'θ', cx + 24 * Math.cos(-frac / 2), cy + 24 * Math.sin(-frac / 2) + 4, { color: th.accent, size: 12, align: 'center', bold: true });
    circle(ctx, cx, cy, 3.5, th.ink); text(ctx, 'O', cx - 8, cy + 14, { color: th.muted, size: 12, align: 'right' });
    text(ctx, 'r', (cx + px) / 2 + 10 * Math.sin(frac), (cy + py) / 2 + 10 * Math.cos(frac) + 4, { color: th.muted, size: 12, align: 'center' });
    // vectơ vận tốc, gia tốc: độ dài chỉ minh họa hướng
    if (tg.vec) {
      const ux = s.vx / s.sp, uy = -s.vy / s.sp, Lv = Math.min(0.42 * Rmax, 56), La = Math.min(0.85 * R, 44);
      arrow(ctx, px, py, px + ux * Lv, py + uy * Lv, th.s2, 3);
      text(ctx, 'v', px + ux * (Lv + 9), py + uy * (Lv + 9) + 4, { color: th.s2, size: 14, align: 'center', bold: true });
      const ax = (cx - px) / R, ay = (cy - py) / R;
      arrow(ctx, px, py, px + ax * La, py + ay * La, th.bad, 3);
      text(ctx, 'a', px + ax * (La + 10), py + ay * (La + 10) + 4, { color: th.bad, size: 14, align: 'center', bold: true });
    }
    circle(ctx, px, py, 8, th.accent, th.card);
  },
  columns: [
    { k: 'n', label: 'n', unit: 'vòng', dec: 0 }, { k: 'tn', label: 't (n vòng)', unit: 's', dec: 2 },
    { k: 'r', label: 'r', unit: 'm', dec: 2 }, { k: 'v', label: 'v', unit: 'm/s', dec: 2 }, { k: 'a', label: 'a', unit: 'm/s²', dec: 1 },
  ],
  recordLabel: 'Ghi số liệu (n vòng)',
  note: 'Đồng hồ bấm giây đo thời gian n vòng với sai số khoảng 0,08 s (do người bấm), độ chia 0,01 s; thước đo r đến 1 cm; cảm biến tốc độ có sai số khoảng 1 %, cảm biến gia tốc khoảng 2 %. Mũi tên v và a chỉ cho biết hướng, độ dài không theo tỉ lệ. Hãy thay đổi cả n và r giữa các lần ghi (giữ nguyên T).',
  record(p, s, t, n) {
    const w = phys.omega(p);
    return {
      n: p.n, tn: n.round(p.n * p.T + n.noise(0.08), 0.01), r: n.round(p.r + n.noise(0.003), 0.01),
      v: n.round(w * p.r * (1 + n.noise(0.01)), 0.01), a: n.round(w * w * p.r * (1 + n.noise(0.02)), 0.1),
    };
  },
  graphs: [
    { title: 'Thời gian t theo số vòng n', xlabel: 'n (vòng)', ylabel: 't (s)', x: 'n', y: 'tn', fit: 'origin', zeroX: true, zeroY: true, dec: 3, curve: (p) => [[0, 0], [20, 20 * p.T]] },
    { title: 'Tốc độ dài v theo bán kính r', xlabel: 'r (m)', ylabel: 'v (m/s)', x: 'r', y: 'v', fit: 'origin', zeroX: true, zeroY: true, dec: 3, curve: (p) => [[0, 0], [2, 2 * phys.omega(p)]] },
  ],
  predict: {
    prompt: '<p>Với r và T đang chọn, hãy dự đoán <b>tốc độ góc ω</b>, <b>tốc độ dài v</b> và <b>gia tốc hướng tâm a</b> của vật.</p>',
    fields: [{ k: 'w', label: 'ω', unit: 'rad/s', dec: 3 }, { k: 'v', label: 'v', unit: 'm/s', dec: 3 }, { k: 'a', label: 'a_ht', unit: 'm/s²', dec: 2 }],
    expected: (p) => ({ w: phys.omega(p), v: phys.speed(p), a: phys.acc(p) }), tol: 0.02, absTol: 0.02,
    explain: (p) => `ω = 2π/T = ${fmt(phys.omega(p), 3)} rad/s; v = ωr = ${fmt(phys.speed(p), 3)} m/s; a = ω²r = ${fmt(phys.acc(p), 2)} m/s².`,
  },
  tasks: [
    {
      title: 'Xử lí số liệu 1: chu kì, tần số, tốc độ góc',
      prompt: '<p>Ghi ít nhất 4 lần đo với số vòng n khác nhau. Trong đồ thị “t theo n”, <b>độ dốc của đường khớp qua gốc chính là chu kì T</b> (vì t = n·T). Từ T hãy tính tần số f = 1/T và tốc độ góc ω = 2π/T.</p>',
      fields: [{ k: 'T', label: 'Chu kì T', unit: 's', dec: 3, absTol: 0.005 }, { k: 'f', label: 'Tần số f', unit: 'Hz', dec: 3, absTol: 0.005 }, { k: 'w', label: 'Tốc độ góc ω', unit: 'rad/s', dec: 3, absTol: 0.02 }],
      minRows: 4, tol: 0.03,
      expected(p, rows) { let sxy = 0, sxx = 0; for (const r of rows) { sxy += r.n * r.tn; sxx += r.n * r.n; } const T = sxy / sxx; return { T, f: 1 / T, w: (2 * Math.PI) / T }; },
      reference: (p) => `Giá trị cài đặt trong mô phỏng: T = ${fmt(p.T, 2)} s.`,
      explain: () => 'Đo thời gian nhiều vòng rồi chia cho n (hoặc lấy độ dốc đồ thị) giúp giảm ảnh hưởng của sai số do người bấm đồng hồ.',
    },
    {
      title: 'Xử lí số liệu 2: tốc độ dài và gia tốc hướng tâm',
      prompt: '<p>Ở cùng chu kì T, v tỉ lệ với r: v = ωr. <b>Độ dốc của đường khớp qua gốc trong đồ thị “v theo r”</b> là tốc độ góc ω. Từ ω đó hãy tính gia tốc hướng tâm a = ω²r tại bán kính r đang chọn trên thanh trượt.</p>',
      fields: [{ k: 'w', label: 'ω (độ dốc v–r)', unit: 'rad/s', dec: 3, absTol: 0.02 }, { k: 'a', label: 'a_ht tại r hiện tại', unit: 'm/s²', dec: 2, absTol: 0.15 }],
      minRows: 4, tol: 0.03,
      expected(p, rows) { let sxy = 0, sxx = 0; for (const r of rows) { sxy += r.r * r.v; sxx += r.r * r.r; } const w = sxy / sxx; return { w, a: w * w * p.r }; },
      reference: (p) => `Giá trị cài đặt: ω = ${fmt(phys.omega(p), 3)} rad/s; a_ht = ${fmt(phys.acc(p), 2)} m/s² tại r = ${fmt(p.r, 1)} m.`,
      explain: (p) => 'a_ht = ω²r = v²/r, hướng vào tâm quỹ đạo; tăng r (giữ ω) thì v và a_ht đều tăng.',
    },
  ],
  quiz: [
    { q: 'Vật chuyển động tròn đều với chu kì T = 2,0 s. Tần số và tốc độ góc là:', o: ['0,5 Hz; 3,14 rad/s', '2 Hz; 6,28 rad/s', '0,5 Hz; 6,28 rad/s'], a: 0, why: 'f = 1/T = 0,5 Hz; ω = 2π/T = π ≈ 3,14 rad/s.' },
    { q: 'Chất điểm quay đều trên đường tròn bán kính 0,5 m với ω = 4 rad/s. Tốc độ dài là:', o: ['2 m/s', '8 m/s', '0,125 m/s'], a: 0, why: 'v = ωr = 4·0,5 = 2 m/s.' },
    { q: 'Với số liệu ở câu trên, gia tốc hướng tâm là:', o: ['8 m/s²', '2 m/s²', '32 m/s²'], a: 0, why: 'a = ω²r = 16·0,5 = 8 m/s² (hoặc v²/r = 4/0,5 = 8 m/s²).' },
    { q: 'Chuyển động tròn đều có gia tốc (hướng tâm) vì:', o: ['vectơ vận tốc luôn đổi hướng dù độ lớn không đổi', 'độ lớn vận tốc tăng đều', 'có lực ma sát tác dụng'], a: 0, why: 'Gia tốc đặc trưng cho sự biến đổi của vectơ vận tốc, kể cả khi chỉ đổi hướng.' },
    { q: 'Một đĩa quay đều 90 vòng trong 1 phút. Chu kì quay của đĩa là:', o: ['0,67 s', '1,5 s', '90 s'], a: 0, why: 'T = 60 s / 90 vòng ≈ 0,67 s.' },
  ],
  demo: async (api) => {
    const sets = [[4, 0.4], [6, 0.7], [8, 1.0], [10, 1.3], [12, 1.6], [15, 1.9], [18, 0.5], [20, 1.2]];
    for (const [n, r] of sets) { api.setParam('n', n); api.setParam('r', r); api.record(); }
    api.setParam('r', 1.0);
  },
};

export const mount = (root, entry) => mountLab(root, entry, spec);

// Vật lí 10 – Bài 32: Lực hướng tâm và gia tốc hướng tâm.
// Vật khối lượng m buộc ở đầu sợi dây, quay tròn đều trên mặt bàn nhẵn nằm ngang (nhìn từ trên xuống).
// Lực kế gắn ở trục quay đo lực căng của dây = lực hướng tâm.
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, circle, line } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
const TAU = 2 * Math.PI;
export const phys = {
  period: (p) => TAU / p.w,                        // chu kì T = 2π/ω (s)
  speed: (p) => p.w * p.r,                         // tốc độ dài v = ωr (m/s)
  acc: (p) => p.w * p.w * p.r,                     // gia tốc hướng tâm a = ω²r (m/s²)
  force: (p) => p.m * p.w * p.w * p.r,             // lực hướng tâm F = mω²r (N)
  pos: (p, t) => [p.r * Math.cos(p.w * t), p.r * Math.sin(p.w * t)],   // toạ độ (m), tâm O là gốc
  vel: (p, t) => [-p.w * p.r * Math.sin(p.w * t), p.w * p.r * Math.cos(p.w * t)],
  // Nếu dây đứt ở thời điểm tc: vật chuyển động thẳng đều theo phương tiếp tuyến với vận tốc lúc đứt.
  cutPos: (p, t, tc) => {
    if (t <= tc) return phys.pos(p, t);
    const [x, y] = phys.pos(p, tc), [vx, vy] = phys.vel(p, tc);
    return [x + vx * (t - tc), y + vy * (t - tc)];
  },
  // Một lần đo: n = {noise(sigma), round(v, step)}. T đo bằng đồng hồ bấm giờ 10 vòng; F đọc trên lực kế.
  sample(p, n) {
    const T10 = n.round(10 * phys.period(p) + n.noise(0.06), 0.01);
    const T = T10 / 10;
    const w = n.round(TAU / T, 0.01);
    const F = phys.force(p);
    return { T: n.round(T, 0.001), w, w2: n.round(w * w, 0.01), F: n.round(F + n.noise(0.01 + 0.004 * F), 0.01) };
  },
};
const TMAX = 6, TCUT = 1.2;

// Hệ số góc đường thẳng qua gốc toạ độ.
const originSlope = (pts) => { let sxy = 0, sxx = 0; for (const [x, y] of pts) { sxy += x * y; sxx += x * x; } return sxx ? sxy / sxx : NaN; };

export const spec = {
  seed: 3232,
  intro: 'Vật nhỏ buộc ở đầu sợi dây, quay tròn đều trên mặt bàn nhẵn quanh một trục cố định. Lực kế gắn ở trục cho biết dây kéo vật bằng lực bao nhiêu. Em sẽ thay đổi m, r, ω để tìm công thức của lực hướng tâm.',
  goals: [
    'Nhận biết lực hướng tâm và gia tốc hướng tâm luôn hướng vào tâm quỹ đạo.',
    'Khảo sát sự phụ thuộc của lực hướng tâm vào khối lượng m, bán kính r và tốc độ góc ω.',
    'Xác định m từ hệ số góc của đồ thị F – ω² và vận dụng F = mω²r = mv²/r.',
  ],
  theory: 'ω = 2π/T &nbsp;&nbsp; v = ωr &nbsp;&nbsp; a<sub>ht</sub> = v²/r = ω²r &nbsp;&nbsp; F<sub>ht</sub> = m·a<sub>ht</sub> = mω²r = mv²/r',
  setup: 'Mặt bàn nhẵn nên chỉ có lực căng của dây đóng vai trò lực hướng tâm. Tốc độ góc ω tính từ chu kì T đo bằng cách bấm giờ 10 vòng. Khi đổi m hoặc r, bảng số liệu được xóa; em chỉ đổi ω để lấy các điểm của đồ thị F – ω².',
  params: [
    { k: 'm', label: 'Khối lượng vật m', unit: 'kg', min: 0.05, max: 0.5, step: 0.05, def: 0.2, dec: 2 },
    { k: 'r', label: 'Bán kính r (chiều dài dây)', unit: 'm', min: 0.2, max: 0.8, step: 0.05, def: 0.4, dec: 2 },
    { k: 'w', label: 'Tốc độ góc ω', unit: 'rad/s', min: 1, max: 10, step: 0.5, def: 4, dec: 1 },
  ],
  clearOnParam: ['m', 'r'],
  toggles: [
    { k: 'vec', label: 'Hiện vectơ v và F', def: true },
    { k: 'cut', label: 'Cắt dây (quan sát hướng bay)', def: false },
  ],
  stageHeight: 290,
  ariaLabel: 'Nhìn từ trên xuống: vật buộc ở đầu dây quay tròn quanh trục, có vectơ vận tốc tiếp tuyến và lực hướng tâm hướng vào tâm',
  duration: () => TMAX,
  state: (p, t) => ({ th: p.w * t, T: phys.period(p), v: phys.speed(p), a: phys.acc(p), F: phys.force(p) }),
  readouts: (p, s) => [['ω', fmt(p.w, 1) + ' rad/s'], ['v', fmt(s.v, 2) + ' m/s'], ['Lực kế', fmt(s.F, 2) + ' N']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const cx = w / 2, cy = h / 2 + 6, R = Math.min(w / 2 - 12, h / 2 - 22), ppm = R / 0.86;
    circle(ctx, cx, cy, R, th.soft, th.line);
    const cut = tg.cut && t > TCUT;
    const [mx, my] = cut ? phys.cutPos(p, t, TCUT) : phys.pos(p, t);
    const X = cx + mx * ppm, Y = cy - my * ppm;
    const rad = 6 + 12 * Math.sqrt(p.m / 0.5);
    // vết quỹ đạo
    ctx.save(); ctx.setLineDash([3, 5]); ctx.strokeStyle = th.axis; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, p.r * ppm, 0, TAU); ctx.stroke(); ctx.restore();
    // dây
    const ct = Math.cos(s.th), st = Math.sin(s.th);
    if (!cut) line(ctx, cx, cy, X, Y, th.ink, 2);
    else text(ctx, 'Dây đứt: vật bay thẳng theo phương tiếp tuyến', cx, cy + R + 16, { color: th.bad, size: 12, align: 'center' });
    circle(ctx, cx, cy, 5, th.ink);
    circle(ctx, X, Y, rad, th.car, th.ink);
    if (tg.vec) {
      const ux = ct, uy = -st;                      // đơn vị hướng ra ngoài (màn hình)
      const tx = -st, ty = -ct;                     // đơn vị tiếp tuyến (chiều quay ngược kim đồng hồ)
      const Lv = 14 + 9 * s.v;                      // độ dài mũi tên v tỉ lệ với v
      if (!cut) {
        const Lf = Math.min(p.r * ppm - rad - 6, 16 + 44 * Math.sqrt(s.F / 40));
        if (Lf > 8) {
          const ox = -st * 7, oy = -ct * 7;       // dịch ngang để không trùng sợi dây
          // F hướng vào tâm
          arrow(ctx, X - ux * rad + ox * -1, Y - uy * rad + oy * -1, X - ux * (rad + Lf) - ox, Y - uy * (rad + Lf) - oy, th.s3, 3);
          text(ctx, 'F', X - ux * (rad + Lf * 0.55) + st * 14, Y - uy * (rad + Lf * 0.55) + ct * 14, { color: th.s3, size: 13, bold: true, base: 'middle', align: 'center' });
        }
      }
      arrow(ctx, X + tx * rad, Y + ty * rad, X + tx * (rad + Lv), Y + ty * (rad + Lv), th.accent, 3);
      text(ctx, 'v', X + tx * (rad + Lv + 10), Y + ty * (rad + Lv + 10), { color: th.accent, size: 13, bold: true, base: 'middle', align: 'center' });
    }
    // bảng lực kế
    text(ctx, 'Lực kế: ' + fmt(s.F, 2) + ' N', 10, 18, { color: th.s3, size: 13, bold: true });
    text(ctx, 'T = ' + fmt(s.T, 2) + ' s', 10, 36, { color: th.muted, size: 12 });
    text(ctx, 'r = ' + fmt(p.r, 2) + ' m', 10, 54, { color: th.muted, size: 12 });
    text(ctx, 'Nhìn từ trên xuống', w - 10, h - 8, { color: th.muted, size: 11, align: 'right' });
  },
  columns: [
    { k: 'T', label: 'T', unit: 's', dec: 3 }, { k: 'w', label: 'ω', unit: 'rad/s', dec: 2 },
    { k: 'w2', label: 'ω²', unit: 'rad²/s²', dec: 2 }, { k: 'F', label: 'F', unit: 'N', dec: 2 },
  ],
  recordLabel: 'Ghi số liệu (T, ω, F)',
  note: 'Mỗi lần ghi: chu kì T lấy từ phép bấm giờ 10 vòng (sai số đồng hồ khoảng 0,06 s cho 10 vòng), ω = 2π/T, lực kế chia đến 0,01 N và có dao động nhỏ.',
  record: (p, s, t, n) => phys.sample(p, n),
  graphs: [
    { title: 'Đồ thị F – ω²', xlabel: 'ω² (rad²/s²)', ylabel: 'F (N)', x: 'w2', y: 'F', fit: 'origin', dec: 3, marker: (p) => [p.w * p.w, phys.force(p)], zeroX: true, zeroY: true },
    { title: 'Đồ thị F – ω', xlabel: 'ω (rad/s)', ylabel: 'F (N)', x: 'w', y: 'F', marker: (p) => [p.w, phys.force(p)], zeroX: true, zeroY: true },
  ],
  predict: {
    prompt: '<p>Vật m đang chọn quay với bán kính r và tốc độ góc ω đang chọn. Hãy tính <b>gia tốc hướng tâm</b> và <b>lực hướng tâm</b> (g = 9,8 m/s², không dùng đến g trong bài này).</p>',
    fields: [{ k: 'a', label: 'a_ht', unit: 'm/s²' }, { k: 'F', label: 'F_ht', unit: 'N' }],
    expected: (p) => ({ a: phys.acc(p), F: phys.force(p) }), tol: 0.02, absTol: 0.03,
    explain: (p) => `a_ht = ω²r = ${fmt(p.w, 1)}² × ${fmt(p.r, 2)} = ${fmt(phys.acc(p), 2)} m/s²; F_ht = m·a_ht = ${fmt(p.m, 2)} × ${fmt(phys.acc(p), 2)} = ${fmt(phys.force(p), 2)} N.`,
  },
  tasks: [{
    title: 'Xử lí số liệu: hệ số góc của đồ thị F – ω²',
    prompt: '<p>Giữ nguyên m và r, đổi ω và ghi ít nhất 5 lần đo với các ω khác nhau (ít nhất một lần ω lớn gấp 1,5 lần lần nhỏ nhất). Theo F = mω²r, đồ thị F – ω² là đường thẳng qua gốc có <b>hệ số góc k = m·r</b>. Đọc k ở chú thích dưới đồ thị, rồi tính khối lượng m = k / r (r đang chọn trên thanh trượt).</p>',
    fields: [{ k: 'k', label: 'Hệ số góc k', unit: 'kg·m', dec: 3, absTol: 0.002 }, { k: 'm', label: 'Khối lượng m', unit: 'kg', dec: 3, absTol: 0.004 }],
    minRows: 5, tol: 0.03,
    need: (rows) => {
      if (rows.length < 5) return 'Cần ghi ít nhất 5 lần đo ở phần thí nghiệm.';
      const ws = rows.map((r) => r.w); if (Math.max(...ws) < 1.5 * Math.min(...ws)) return 'Hãy đổi ω để các lần đo có ω khác nhau rõ rệt (lớn nhất ≥ 1,5 lần nhỏ nhất).';
      return null;
    },
    expected: (p, rows) => { const k = originSlope(rows.map((r) => [r.w2, r.F])); return { k, m: k / p.r }; },
    explain: (p, rows, exp) => `Đồ thị F – ω² là đường thẳng qua gốc nên F = (m·r)·ω², k = m·r = ${fmt(exp.k, 3)} kg·m, m = k/r = ${fmt(exp.k, 3)} / ${fmt(p.r, 2)} = ${fmt(exp.m, 3)} kg.`,
    reference: (p) => `Giá trị cài đặt trong mô phỏng: m = ${fmt(p.m, 2)} kg, r = ${fmt(p.r, 2)} m nên m·r = ${fmt(p.m * p.r, 3)} kg·m.`,
  }],
  demo: async (api) => {
    for (let i = 0; i < 8; i++) { api.setParam('w', 1.5 + i * 1.2); api.record(); }
  },
  quiz: [
    { q: 'Vật chuyển động tròn đều thì gia tốc hướng tâm có hướng:', o: ['theo phương tiếp tuyến với quỹ đạo', 'từ tâm ra ngoài', 'vào tâm quỹ đạo'], a: 2, why: 'Gia tốc hướng tâm luôn hướng vào tâm quỹ đạo, đặc trưng cho sự thay đổi hướng của vận tốc.' },
    { q: 'Vật m = 0,2 kg quay tròn đều với r = 0,5 m, ω = 6 rad/s. Lực hướng tâm bằng:', o: ['0,6 N', '3,6 N', '7,2 N'], a: 1, why: 'F = mω²r = 0,2 × 36 × 0,5 = 3,6 N.' },
    { q: 'Giữ nguyên m và ω, tăng bán kính r lên gấp đôi thì lực hướng tâm:', o: ['tăng 4 lần', 'không đổi', 'tăng 2 lần'], a: 2, why: 'F = mω²r tỉ lệ thuận với r khi m và ω không đổi.' },
    { q: 'Vật chuyển động tròn đều với v = 3 m/s trên quỹ đạo bán kính 0,5 m. Gia tốc hướng tâm là:', o: ['1,5 m/s²', '18 m/s²', '6 m/s²'], a: 1, why: 'a_ht = v²/r = 9 / 0,5 = 18 m/s².' },
    { q: 'Đang quay tròn trên mặt bàn nhẵn, dây bị đứt thì vật sẽ:', o: ['bay thẳng theo phương tiếp tuyến với quỹ đạo', 'bay ra xa theo phương bán kính', 'tiếp tục quay tròn quanh O'], a: 0, why: 'Hết lực hướng tâm, vật chuyển động thẳng đều theo phương của vận tốc tại lúc dây đứt, tức phương tiếp tuyến.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

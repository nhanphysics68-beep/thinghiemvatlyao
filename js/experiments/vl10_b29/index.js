// Vật lí 10 – Bài 29: Định luật bảo toàn động lượng (hai xe trên đệm khí).
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, ruler, rect, line } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
export const TC = 1.2;                 // thời điểm va chạm (s)
const HALF = 2.0;                      // nửa chiều dài đoạn đệm khí dùng được (m)
const cartW = (m) => 0.2 + 0.25 * m;   // độ rộng xe vẽ trên đệm (m), tăng theo khối lượng
export const phys = {
  // Vận tốc sau tương tác. type: 'elastic' | 'soft' | 'explosion'. E: năng lượng lò xo (J) khi nổ tách.
  after(p) {
    const { m1, m2 } = p, M = m1 + m2;
    if (p.type === 'elastic') {
      const v1 = p.v1, v2 = p.v2;
      return { v1: ((m1 - m2) * v1 + 2 * m2 * v2) / M, v2: ((m2 - m1) * v2 + 2 * m1 * v1) / M };
    }
    if (p.type === 'soft') { const v = (m1 * p.v1 + m2 * p.v2) / M; return { v1: v, v2: v }; }
    const u = p.v1, w = Math.sqrt((2 * p.E * M) / (m1 * m2));   // tốc độ tương đối sau khi nổ
    return { v1: u - (m2 * w) / M, v2: u + (m1 * w) / M };
  },
  before: (p) => (p.type === 'explosion' ? { v1: p.v1, v2: p.v1 } : { v1: p.v1, v2: p.v2 }),
  mom: (m1, m2, v1, v2) => m1 * v1 + m2 * v2,
  ek: (m1, m2, v1, v2) => 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2,
  // Thời gian sau va chạm sao cho xe không ra khỏi đệm.
  tpost(p) {
    const a = phys.after(p), h1 = cartW(p.m1) / 2, h2 = cartW(p.m2) / 2;
    let tp = 1.5;
    if (a.v1 < -1e-6) tp = Math.min(tp, (HALF - h1) / -a.v1); else if (a.v1 > 1e-6) tp = Math.min(tp, (HALF + h1) / a.v1);
    if (a.v2 > 1e-6) tp = Math.min(tp, (HALF - h2) / a.v2); else if (a.v2 < -1e-6) tp = Math.min(tp, (HALF + h2) / -a.v2);
    return Math.max(0.5, tp);
  },
  pos(p, t) {
    const b = phys.before(p), a = phys.after(p), h1 = cartW(p.m1) / 2, h2 = cartW(p.m2) / 2, post = t > TC;
    const v1 = post ? a.v1 : b.v1, v2 = post ? a.v2 : b.v2, tau = t - TC;
    return { x1: -h1 + v1 * tau, x2: h2 + v2 * tau, v1, v2, h1, h2, post };
  },
};
export const cart = { w: cartW };

export const spec = {
  seed: 2929,
  intro: 'Hai xe trượt trên đệm khí (gần như không ma sát) nên hệ hai xe là hệ cô lập. Em cho hai xe tương tác, đo vận tốc trước và sau rồi kiểm tra xem tổng động lượng và tổng động năng có thay đổi không.',
  goals: [
    'Phát biểu và vận dụng định luật bảo toàn động lượng cho hệ cô lập.',
    'Phân biệt va chạm đàn hồi, va chạm mềm và sự tương tác nổ tách (lò xo bung ra).',
    'Kiểm tra bằng số liệu: động lượng luôn bảo toàn, còn động năng thì chỉ bảo toàn trong va chạm đàn hồi.',
  ],
  theory: 'Hệ cô lập: p₁ + p₂ = p₁′ + p₂′ &nbsp;⇔&nbsp; m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′<br>Va chạm mềm: (m₁ + m₂)v′ = m₁v₁ + m₂v₂ &nbsp; Va chạm đàn hồi: động năng cũng bảo toàn.<br>Chiều dương hướng sang phải; vận tốc hướng sang trái mang dấu âm.',
  setup: 'Chọn loại tương tác rồi chỉnh khối lượng và vận tốc đầu. Nhấn Chạy, kéo thanh thời gian tới sau lúc tương tác rồi mới bấm ghi số liệu (cổng quang đo vận tốc ngay trước và ngay sau tương tác). Ở loại “nổ tách”, hai xe ban đầu chuyển động cùng vận tốc v₁ (có thể bằng 0) với lò xo nén giữa hai xe.',
  choices: [{ k: 'type', label: 'Loại tương tác', string: true, def: 'elastic', options: [['elastic', 'Va chạm đàn hồi (lò xo đệm)'], ['soft', 'Va chạm mềm (hai xe dính nhau)'], ['explosion', 'Nổ tách (lò xo bung ra)']] }],
  params: [
    { k: 'm1', label: 'Khối lượng xe 1 (m₁)', unit: 'kg', min: 0.1, max: 0.6, step: 0.05, def: 0.3, dec: 2 },
    { k: 'm2', label: 'Khối lượng xe 2 (m₂)', unit: 'kg', min: 0.1, max: 0.6, step: 0.05, def: 0.5, dec: 2 },
    { k: 'v1', label: 'Vận tốc đầu xe 1 (v₁)', unit: 'm/s', min: -1, max: 1.2, step: 0.1, def: 0.8, dec: 1 },
    { k: 'v2', label: 'Vận tốc đầu xe 2 (v₂)', unit: 'm/s', min: -1, max: 1, step: 0.1, def: -0.2, dec: 1, show: (p) => p.type !== 'explosion' },
    { k: 'E', label: 'Năng lượng lò xo E', unit: 'J', min: 0.05, max: 0.6, step: 0.05, def: 0.2, dec: 2, show: (p) => p.type === 'explosion' },
  ],
  onParam(p, k) {      // xe 1 phải đuổi kịp xe 2 thì mới va chạm được
    if (p.type === 'explosion' || (k !== 'v1' && k !== 'v2')) return;
    if (p.v1 - p.v2 < 0.2 - 1e-9) { if (k === 'v1') p.v2 = Math.max(-1, +(p.v1 - 0.2).toFixed(1)); else p.v1 = Math.min(1.2, +(p.v2 + 0.2).toFixed(1)); }
  },
  onChoice(p) {
    if (p.type === 'explosion') Object.assign(p, { m1: 0.3, m2: 0.5, v1: 0, E: 0.2 });
    else Object.assign(p, { m1: 0.3, m2: 0.5, v1: 0.8, v2: -0.2 });
  },
  toggles: [{ k: 'vec', label: 'Hiện vectơ vận tốc', def: true }],
  stageHeight: 310,
  ariaLabel: 'Hai xe trên đệm khí tương tác với nhau, kèm thanh biểu diễn động lượng và động năng của hệ',
  duration: (p) => TC + phys.tpost(p),
  state(p, t) {
    const s = phys.pos(p, t);
    return { ...s, p1: p.m1 * s.v1, p2: p.m2 * s.v2, p: phys.mom(p.m1, p.m2, s.v1, s.v2), ek: phys.ek(p.m1, p.m2, s.v1, s.v2) };
  },
  readouts: (p, s) => [['p₁', fmt(s.p1, 3)], ['p₂', fmt(s.p2, 3)], ['p', fmt(s.p, 3) + ' kg·m/s'], ['Ek', fmt(s.ek, 3) + ' J']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const barsH = 126, sceneH = h - barsH, ppm = (w - 24) / 4.4, cx = w / 2, X = (x) => cx + x * ppm;
    const ytop = sceneH - 80, ch = 26, ybot = ytop + ch;
    // đệm khí
    rect(ctx, X(-2.2), ybot, 4.4 * ppm, 5, th.axis, null, 2);
    ruler(ctx, cx, ybot + 8, ppm, -2, 2, 0.25, th, { unit: 'm', labelEvery: 4 });
    const col = [th.accent, th.s2];
    const bx = [[s.x1, s.h1, '1'], [s.x2, s.h2, '2']];
    bx.forEach(([x, hh, lab], i) => {
      rect(ctx, X(x - hh), ytop, 2 * hh * ppm, ch, col[i], null, 4);
      text(ctx, lab, X(x), ytop + ch / 2 + 5, { color: '#fff', size: 14, align: 'center', bold: true });
    });
    if (p.type === 'soft' && s.post) line(ctx, X(s.x1 + s.h1), ytop + 4, X(s.x1 + s.h1), ybot - 4, '#fff', 2, [3, 3]);
    if (tg.vec) {
      const kv = 34;
      [[s.x1, s.v1, 'v₁', ytop - 12, col[0]], [s.x2, s.v2, 'v₂', ytop - 30, col[1]]].forEach(([x, v, lab, y, c]) => {
        if (Math.abs(v) < 0.02) { text(ctx, lab + ' = 0', X(x), y + 4, { color: c, size: 12, align: 'center', bold: true }); return; }
        arrow(ctx, X(x), y, X(x) + v * kv, y, c, 3);
        text(ctx, lab, X(x) + v * kv + (v > 0 ? 6 : -6), y + 4, { color: c, size: 12, align: v > 0 ? 'left' : 'right', bold: true });
      });
    }
    text(ctx, `m₁ = ${fmt(p.m1, 2)} kg`, 10, 18, { color: col[0], size: 12, bold: true });
    text(ctx, `m₂ = ${fmt(p.m2, 2)} kg`, w - 10, 18, { color: col[1], size: 12, align: 'right', bold: true });
    text(ctx, s.post ? 'Sau tương tác' : (p.type === 'explosion' ? 'Trước khi nổ tách' : 'Trước va chạm'), cx, 18, { color: th.muted, size: 12, align: 'center' });
    // thanh động lượng và động năng
    const b = phys.before(p), a = phys.after(p);
    const p0 = phys.mom(p.m1, p.m2, b.v1, b.v2), e0 = phys.ek(p.m1, p.m2, b.v1, b.v2), e1 = phys.ek(p.m1, p.m2, a.v1, a.v2);
    const pS = Math.max(0.15, ...[p.m1 * b.v1, p.m2 * b.v2, p.m1 * a.v1, p.m2 * a.v2, p0].map(Math.abs)) * 1.05;
    const eS = Math.max(0.05, e0, e1) * 1.05;
    const lx = 36, bw = w - lx - 14, zero = lx + bw / 2, y0 = sceneH + 18, rh = 22;
    text(ctx, 'Thanh p và Ek của hệ (vạch đỏ đứt: giá trị ban đầu)', 10, sceneH + 6, { color: th.muted, size: 11 });
    const rowsP = [['p₁', s.p1, col[0]], ['p₂', s.p2, col[1]], ['p', s.p, th.ink]];
    rowsP.forEach(([lab, val, c], i) => {
      const y = y0 + i * rh;
      text(ctx, lab, 8, y + 12, { color: c, size: 12, bold: true });
      line(ctx, zero, y, zero, y + 16, th.axis, 1);
      const L = (val / pS) * (bw / 2);
      rect(ctx, Math.min(zero, zero + L), y + 2, Math.abs(L), 12, c, null, 2);
    });
    const xp0 = zero + (p0 / pS) * (bw / 2);
    line(ctx, xp0, y0 + 2 * rh - 2, xp0, y0 + 3 * rh - 4, th.bad, 2, [3, 2]);
    const ye = y0 + 3 * rh;
    text(ctx, 'Ek', 8, ye + 12, { color: th.ink, size: 12, bold: true });
    const e1px = (s.ek / eS) * bw;
    rect(ctx, lx, ye + 2, Math.max(0, e1px), 12, th.s3, null, 2);
    const xe0 = lx + (e0 / eS) * bw;
    line(ctx, xe0, ye, xe0, ye + 16, th.bad, 2, [3, 2]);
  },
  columns: [
    { k: 'm1', label: 'm₁', unit: 'kg', dec: 3 }, { k: 'm2', label: 'm₂', unit: 'kg', dec: 3 },
    { k: 'v1', label: 'v₁', unit: 'm/s', dec: 2 }, { k: 'v2', label: 'v₂', unit: 'm/s', dec: 2 },
    { k: 'v1p', label: 'v₁′', unit: 'm/s', dec: 2 }, { k: 'v2p', label: 'v₂′', unit: 'm/s', dec: 2 },
    { k: 'p', label: 'p trước', unit: 'kg·m/s', dec: 3 }, { k: 'pp', label: 'p sau', unit: 'kg·m/s', dec: 3 },
    { k: 'Ek', label: 'Ek trước', unit: 'J', dec: 3 }, { k: 'Ekp', label: 'Ek sau', unit: 'J', dec: 3 },
  ],
  recordLabel: 'Ghi số liệu (một lần thí nghiệm)',
  note: 'Cổng quang đo vận tốc với sai số khoảng 0,01 m/s (độ chia 0,01 m/s); cân đo khối lượng chính xác đến 1 g. Các cột p và Ek được bảng tính sẵn từ số liệu đo (p = m₁v₁ + m₂v₂; Ek = ½m₁v₁² + ½m₂v₂²). Mỗi lần ghi là một lần thí nghiệm với các thông số hiện tại.',
  record(p, s, t, n) {
    if (t < TC + 0.05) return { error: 'Hãy chạy thí nghiệm tới sau lúc hai xe tương tác (kéo thanh thời gian về phía phải) rồi mới ghi số liệu.' };
    const b = phys.before(p), a = phys.after(p), q = (v) => n.round(v + n.noise(0.01), 0.01);
    const m1 = n.round(p.m1, 0.001), m2 = n.round(p.m2, 0.001), v1 = q(b.v1), v2 = q(b.v2), v1p = q(a.v1), v2p = q(a.v2);
    const r3 = (x) => Math.round(x * 1000) / 1000;
    return { m1, m2, v1, v2, v1p, v2p, p: r3(phys.mom(m1, m2, v1, v2)), pp: r3(phys.mom(m1, m2, v1p, v2p)), Ek: r3(phys.ek(m1, m2, v1, v2)), Ekp: r3(phys.ek(m1, m2, v1p, v2p)) };
  },
  graphs: [
    {
      title: 'Động lượng sau – trước (đường đứt: bằng nhau)', xlabel: 'p trước (kg·m/s)', ylabel: 'p sau (kg·m/s)', x: 'p', y: 'pp',
      curve: () => [[-3, -3], [3, 3]], curveDash: [6, 4],
      range: (p, rows) => { const M = Math.max(0.1, ...rows.flatMap((r) => [Math.abs(r.p), Math.abs(r.pp)])) * 1.2; return { xmin: -M, xmax: M, ymin: -M, ymax: M }; },
    },
    {
      title: 'Động năng sau – trước (đường đứt: bằng nhau)', xlabel: 'Ek trước (J)', ylabel: 'Ek sau (J)', x: 'Ek', y: 'Ekp',
      curve: () => [[0, 0], [3, 3]], curveDash: [6, 4],
      range: (p, rows) => { const M = Math.max(0.05, ...rows.flatMap((r) => [r.Ek, r.Ekp])) * 1.2; return { xmin: 0, xmax: M, ymin: 0, ymax: M }; },
    },
  ],
  predict: {
    prompt: '<p>Với loại tương tác và các thông số đang chọn, hãy dự đoán <b>vận tốc của hai xe ngay sau tương tác</b> (chiều dương sang phải). Dùng định luật bảo toàn động lượng (và bảo toàn động năng nếu va chạm đàn hồi; với nổ tách thì năng lượng lò xo biến thành động năng).</p>',
    fields: [{ k: 'v1p', label: 'v₁′', unit: 'm/s', dec: 2 }, { k: 'v2p', label: 'v₂′', unit: 'm/s', dec: 2 }],
    expected: (p) => { const a = phys.after(p); return { v1p: a.v1, v2p: a.v2 }; }, tol: 0.02, absTol: 0.02,
    explain: (p) => { const b = phys.before(p), a = phys.after(p); return `Tổng động lượng: ${fmt(phys.mom(p.m1, p.m2, b.v1, b.v2), 3)} kg·m/s = ${fmt(phys.mom(p.m1, p.m2, a.v1, a.v2), 3)} kg·m/s sau tương tác.`; },
  },
  tasks: [{
    title: 'Xử lí số liệu: động lượng và động năng có bảo toàn không?',
    prompt: '<p>Ghi ít nhất 4 lần thí nghiệm (có thể thay đổi khối lượng và vận tốc giữa các lần). Với mỗi lần đo, tính hiệu <b>p sau − p trước</b> và <b>Ek sau − Ek trước</b>, rồi lấy <b>giá trị trung bình</b> qua các lần đo (dùng đúng số liệu trong bảng).</p>',
    fields: [{ k: 'dp', label: 'Trung bình (p sau − p trước)', unit: 'kg·m/s', dec: 3 }, { k: 'dE', label: 'Trung bình (Ek sau − Ek trước)', unit: 'J', dec: 3 }],
    minRows: 4, tol: 0.03, absTol: 0.003,
    expected(p, rows) {
      const mean = (f) => rows.reduce((s, r) => s + f(r), 0) / rows.length;
      return { dp: mean((r) => r.pp - r.p), dE: mean((r) => r.Ekp - r.Ek) };
    },
    explain(p, rows, e) {
      return `Hiệu động lượng gần bằng 0 trong phạm vi sai số đo nên động lượng của hệ được bảo toàn. ` + (Math.abs(e.dE) < 0.01 ? 'Động năng cũng gần như không đổi: tương tác là đàn hồi.' : e.dE < 0 ? 'Động năng giảm: một phần chuyển thành nhiệt và biến dạng (va chạm mềm).' : 'Động năng tăng: năng lượng dự trữ trong lò xo biến thành động năng (nổ tách).');
    },
    reference: (p) => { const b = phys.before(p), a = phys.after(p); return `Giá trị chuẩn với thông số hiện tại: ΔEk = ${fmt(phys.ek(p.m1, p.m2, a.v1, a.v2) - phys.ek(p.m1, p.m2, b.v1, b.v2), 3)} J, Δp = 0.`; },
  }],
  quiz: [
    { q: 'Hệ hai xe trên đệm khí được coi gần đúng là hệ cô lập vì:', o: ['tổng ngoại lực tác dụng lên hệ theo phương ngang xấp xỉ bằng không', 'động năng của hệ luôn không đổi', 'khối lượng hai xe bằng nhau'], a: 0, why: 'Trọng lực cân bằng với phản lực của lớp khí, ma sát rất nhỏ nên tổng ngoại lực xấp xỉ bằng không; khi đó tổng động lượng bảo toàn.' },
    { q: 'Xe 1 (0,2 kg) chạy 3 m/s tới va chạm mềm với xe 2 (0,1 kg) đứng yên. Vận tốc hai xe sau va chạm là:', o: ['1 m/s', '2 m/s', '3 m/s'], a: 1, why: '0,2·3 = (0,2 + 0,1)·v′ nên v′ = 0,6/0,3 = 2 m/s.' },
    { q: 'Trong va chạm mềm của hệ cô lập:', o: ['động lượng bảo toàn, động năng giảm', 'động lượng giảm, động năng bảo toàn', 'cả động lượng và động năng đều bảo toàn'], a: 0, why: 'Động lượng luôn bảo toàn trong hệ cô lập; một phần động năng chuyển thành nhiệt và biến dạng.' },
    { q: 'Súng khối lượng 4 kg bắn viên đạn 0,02 kg với vận tốc 300 m/s (ban đầu cả hệ đứng yên). Vận tốc giật lùi của súng có độ lớn:', o: ['0,75 m/s', '1,5 m/s', '15 m/s'], a: 1, why: '0 = 0,02·300 − 4·v nên v = 6/4 = 1,5 m/s.' },
    { q: 'Hai xe cùng khối lượng va chạm đàn hồi xuyên tâm, xe 1 chạy 0,8 m/s tới xe 2 đứng yên. Sau va chạm:', o: ['xe 1 dừng lại, xe 2 chạy 0,8 m/s', 'cả hai cùng chạy 0,4 m/s', 'xe 1 bật lại 0,8 m/s, xe 2 đứng yên'], a: 0, why: 'Với m₁ = m₂ thì hai xe trao đổi vận tốc: v₁′ = 0, v₂′ = 0,8 m/s.' },
  ],
  demo: async (api) => {
    const sets = [[0.3, 0.5, 0.8, -0.2, 0.2], [0.2, 0.4, 1.0, 0.1, 0.3], [0.5, 0.3, 0.6, -0.4, 0.15], [0.4, 0.4, 1.1, 0.0, 0.4], [0.25, 0.55, 0.5, -0.5, 0.25], [0.6, 0.2, 0.9, 0.3, 0.1]];
    for (const [m1, m2, v1, v2, E] of sets) {
      api.setParam('m1', m1); api.setParam('m2', m2);
      if (api.p.type === 'explosion') { api.setParam('v1', v1 - 0.5); api.setParam('E', E); } else { api.setParam('v1', v1); api.setParam('v2', v2); }
      api.setT(api.duration()); api.record();
    }
  },
};

export const mount = (root, entry) => mountLab(root, entry, spec);

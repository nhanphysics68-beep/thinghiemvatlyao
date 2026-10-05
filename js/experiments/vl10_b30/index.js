// Vật lí 10 – Bài 30: Thực hành xác định động lượng của vật trước và sau va chạm (đệm khí, cổng quang điện).
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { text, ruler, rect, line } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
export const TC = 1.2;                  // thời điểm va chạm (s)
export const LOSS = 0.01;               // vận tốc sau va chạm giảm ~1 % do ma sát, lực cản không khí (sai số hệ thống)
export const G1 = -0.4, G2 = 0.4;       // vị trí hai cổng quang (m), va chạm xảy ra tại x = 0
export const H = 0.15;                  // nửa độ dài xe (m)
const XEND = 1.5;                       // bộ phận chặn cuối đệm khí (xe 2 dừng ở đây)
export const phys = {
  // Vận tốc ngay sau va chạm (xe 2 đứng yên trước va chạm), chiều dương sang phải.
  after(p) {
    const { m1, m2, v1 } = p, M = m1 + m2;
    if (p.type === 'soft') { const v = (m1 * v1) / M; return { v1: v, v2: v }; }
    return { v1: ((m1 - m2) / M) * v1, v2: ((2 * m1) / M) * v1 };
  },
  // Thời gian chắn sáng thật (s): t₁ qua cổng 1 trước va chạm; t₂ qua cổng 2 sau va chạm; t₃ xe 1 quay lại cổng 1 (đàn hồi).
  times(p) {
    const d = p.d / 1000, a = phys.after(p), k = 1 - LOSS;
    return { t1: d / p.v1, t2: d / (a.v2 * k), t3: p.type === 'elastic' ? d / (Math.abs(a.v1) * k) : NaN };
  },
  // Động lượng tính từ số liệu đo (d: mm, t: ms) -> kg·m/s
  pBefore: (m1, d, t1) => (m1 * d) / t1,
  pAfter: (type, m1, m2, d, t2, t3) => (type === 'soft' ? ((m1 + m2) * d) / t2 : (m2 * d) / t2 - (m1 * d) / t3),
  // Các mốc thời gian hiển thị (s)
  events(p) {
    const a = phys.after(p), d = p.d / 1000, ev = {};
    ev.g1End = TC + (G1 + d / 2 + H) / p.v1; ev.g1Start = TC + (G1 - d / 2 + H) / p.v1;
    ev.g2Start = TC + (G2 - d / 2 - H) / a.v2; ev.g2End = TC + (G2 + d / 2 - H) / a.v2;
    if (p.type === 'elastic') { ev.g3Start = TC + (G1 + d / 2 + H) / a.v1; ev.g3End = TC + (G1 - d / 2 + H) / a.v1; }
    return ev;
  },
  pos(p, t) {
    const a = phys.after(p), tau = t - TC, post = t > TC;
    const x1 = -H + (post ? a.v1 : p.v1) * tau, x2 = post ? Math.min(XEND, H + a.v2 * tau) : H;
    return { x1, x2, post };
  },
};
const blocked = (x, g, d) => Math.abs(x - g) < d / 2;

export const spec = {
  seed: 3030,
  intro: 'Em làm lại thí nghiệm của SGK: dùng đệm khí và cổng quang điện để đo vận tốc hai xe ngay trước và sau va chạm, từ đó tính động lượng và so sánh. Mô phỏng có sai số dụng cụ và một chút ma sát còn lại như thí nghiệm thật.',
  goals: [
    'Xác định vận tốc từ thời gian chắn sáng: v = d/t (d là bề rộng tấm chắn).',
    'Tính động lượng của hệ trước và sau va chạm, so sánh và tính sai lệch tương đối.',
    'Giải thích nguyên nhân sai số và nhận xét về định luật bảo toàn động lượng.',
  ],
  theory: 'v = d/t &nbsp;&nbsp; p = m·v &nbsp;&nbsp; Trước: p = m₁v₁ &nbsp;&nbsp; Sau (va chạm mềm): p′ = (m₁ + m₂)v′<br>Sau (đàn hồi): p′ = m₂v₂′ − m₁|v₁′| (xe 1 bật lại) &nbsp;&nbsp; Sai lệch tương đối: δ = |p′ − p|/p × 100 %',
  setup: 'Xe 1 (có tấm chắn) được đẩy chạy qua cổng 1, va chạm với xe 2 đang đứng yên. Đồng hồ hiện số ghi thời gian chắn sáng t₁ (cổng 1, trước va chạm), t₂ (cổng 2, sau va chạm) và, với va chạm đàn hồi, t₃ (xe 1 bật lại qua cổng 1 lần hai). Bề rộng tấm chắn d đo bằng thước kẹp, khối lượng đo bằng cân.',
  choices: [{ k: 'type', label: 'Loại va chạm', string: true, def: 'soft', options: [['soft', 'Va chạm mềm (xe dính nhau bằng miếng dính)'], ['elastic', 'Va chạm đàn hồi (đệm lò xo, m₁ < m₂)']] }],
  params: [
    { k: 'm1', label: 'Khối lượng xe 1 (m₁)', unit: 'kg', min: 0.25, max: 0.5, step: 0.05, def: 0.3, dec: 2 },
    { k: 'm2', label: 'Khối lượng xe 2 (m₂)', unit: 'kg', min: 0.3, max: 0.6, step: 0.05, def: 0.5, dec: 2 },
    { k: 'v1', label: 'Tốc độ xe 1 khi qua cổng 1', unit: 'm/s', min: 0.4, max: 1.2, step: 0.1, def: 0.8, dec: 1 },
    { k: 'd', label: 'Bề rộng tấm chắn d', unit: 'mm', min: 20, max: 100, step: 5, def: 50, dec: 0 },
  ],
  onParam(p, k) {      // va chạm đàn hồi: giữ m₁ < m₂ để xe 1 bật lại và đo được bằng cổng 1
    if (p.type !== 'elastic') return;
    if (p.m2 < p.m1 + 0.05 - 1e-9) { if (k === 'm1') p.m2 = Math.min(0.6, +(p.m1 + 0.05).toFixed(2)); else p.m1 = Math.max(0.25, +(p.m2 - 0.05).toFixed(2)); }
  },
  onChoice(p) { if (p.type === 'elastic') Object.assign(p, { m1: 0.3, m2: 0.5 }); },
  stageHeight: 230,
  ariaLabel: 'Hai xe trên đệm khí đi qua hai cổng quang điện, đồng hồ hiện số hiển thị thời gian chắn sáng',
  duration: (p) => { const e = phys.events(p); return Math.min(6, Math.max(TC + 1, (p.type === 'elastic' ? e.g3End : e.g2End) + 0.4)); },
  state(p, t) {
    const s = phys.pos(p, t), d = p.d / 1000, tm = phys.times(p), ev = phys.events(p);
    const eps = 1e-9;
    return {
      ...s, d, tm, ev,
      show1: t >= ev.g1End - eps, show2: t >= ev.g2End - eps, show3: p.type === 'elastic' && t >= ev.g3End - eps,
      b1: blocked(s.x1, G1, d) && t < TC, b2: blocked(s.x2, G2, d),
      b3: p.type === 'elastic' && s.post && blocked(s.x1, G1, d),
    };
  },
  readouts: (p, s) => [['t₁', s.show1 ? fmt(s.tm.t1 * 1000, 1) + ' ms' : '—'], ['t₂', s.show2 ? fmt(s.tm.t2 * 1000, 1) + ' ms' : '—'], ...(p.type === 'elastic' ? [['t₃', s.show3 ? fmt(s.tm.t3 * 1000, 1) + ' ms' : '—']] : [])],
  draw(ctx, { w, h }, s, p, t, th) {
    const ppm = (w - 20) / 3.4, cx = w / 2, X = (x) => cx + x * ppm;
    const ytop = 112, ch = 26, ybot = ytop + ch;
    // đồng hồ hiện số
    const cells = p.type === 'elastic'
      ? [['Cổng 1 · trước (t₁)', s.show1, s.tm.t1, s.b1], ['Cổng 2 · sau (t₂)', s.show2, s.tm.t2, s.b2], ['Cổng 1 · lần 2 (t₃)', s.show3, s.tm.t3, s.b3]]
      : [['Cổng 1 · trước (t₁)', s.show1, s.tm.t1, s.b1], ['Cổng 2 · sau (t₂)', s.show2, s.tm.t2, s.b2]];
    const cw = (w - 20 - (cells.length - 1) * 6) / cells.length;
    cells.forEach(([lab, on, v, blk], i) => {
      const x = 10 + i * (cw + 6);
      rect(ctx, x, 8, cw, 42, th.card, blk ? th.bad : th.line, 6);
      text(ctx, lab, x + cw / 2, 23, { color: th.muted, size: cw < 100 ? 10 : 11, align: 'center' });
      text(ctx, on ? fmt(v * 1000, 1) + ' ms' : (blk ? 'đang đo…' : '—'), x + cw / 2, 42, { color: on ? th.ink : th.muted, size: 14, align: 'center', bold: true });
    });
    // đệm khí, cổng quang
    rect(ctx, X(-1.7), ybot, 3.4 * ppm, 5, th.axis, null, 2);
    ruler(ctx, cx, ybot + 8, ppm, -1.5, 1.5, 0.25, th, { unit: 'm', labelEvery: 4 });
    [[G1, '1', s.b1 || s.b3], [G2, '2', s.b2]].forEach(([g, lab, blk]) => {
      const gx = X(g);
      line(ctx, gx, ytop - 44, gx, ybot, blk ? th.bad : th.muted, blk ? 3 : 2);
      rect(ctx, gx - 11, ytop - 62, 22, 18, th.card, blk ? th.bad : th.muted, 4);
      text(ctx, 'G' + lab, gx, ytop - 49, { color: th.ink, size: 11, align: 'center', bold: true });
    });
    // xe và tấm chắn (tấm chắn vẽ rộng tối thiểu 4 px)
    const col = [th.accent, th.s2];
    [[s.x1, '1'], [s.x2, '2']].forEach(([x, lab], i) => {
      rect(ctx, X(x - H), ytop, 2 * H * ppm, ch, col[i], null, 4);
      text(ctx, lab, X(x), ytop + ch / 2 + 5, { color: '#fff', size: 14, align: 'center', bold: true });
      const fw = Math.max(4, s.d * ppm);
      rect(ctx, X(x) - fw / 2, ytop - 16, fw, 16, th.ink, null, 1);
    });
    if (p.type === 'soft' && s.post) line(ctx, X(s.x1 + H), ytop + 4, X(s.x1 + H), ybot - 4, '#fff', 2, [3, 3]);
    text(ctx, `m₁ = ${fmt(p.m1, 2)} kg`, 10, ybot + 52, { color: col[0], size: 12, bold: true });
    text(ctx, `m₂ = ${fmt(p.m2, 2)} kg`, w - 10, ybot + 52, { color: col[1], size: 12, align: 'right', bold: true });
    text(ctx, `d = ${fmt(p.d, 0)} mm`, cx, ybot + 52, { color: th.muted, size: 12, align: 'center' });
  },
  columns: [
    { k: 'm1', label: 'm₁', unit: 'kg', dec: 4 }, { k: 'm2', label: 'm₂', unit: 'kg', dec: 4 }, { k: 'd', label: 'd', unit: 'mm', dec: 2 },
    { k: 't1', label: 't₁', unit: 'ms', dec: 1 }, { k: 't2', label: 't₂', unit: 'ms', dec: 1 }, { k: 't3', label: 't₃', unit: 'ms', dec: 1 },
  ],
  recordLabel: 'Ghi số liệu (một lần đo)',
  note: 'Mỗi lần ghi là một lần đẩy xe với thông số hiện tại, nên hãy thay đổi m₁, m₂ hoặc tốc độ giữa các lần. Cân đo đến 0,1 g, thước kẹp đo d đến 0,02 mm, đồng hồ hiện số có độ chia 0,1 ms. Với va chạm mềm không có t₃ (hiển thị “—”). Đồng hồ chỉ ghi lần chắn sáng đầu tiên ở mỗi cổng, riêng t₃ là lần chắn thứ hai ở cổng 1. Đồ thị tự tính p và p′ từ số liệu của em.',
  record(p, s, t, n) {
    const tm = phys.times(p), m1 = n.round(p.m1 + n.noise(0.0001), 0.0001), m2 = n.round(p.m2 + n.noise(0.0001), 0.0001);
    const d = n.round(p.d + n.noise(0.02), 0.02), tt = (x) => n.round(x * 1000 + n.noise(0.1), 0.1);
    const t1 = tt(tm.t1), t2 = tt(tm.t2), t3 = p.type === 'elastic' ? tt(tm.t3) : NaN;
    return { m1, m2, d, t1, t2, t3, p: phys.pBefore(m1, d, t1), pp: phys.pAfter(p.type, m1, m2, d, t2, t3) };
  },
  graphs: [{
    title: 'Động lượng sau va chạm theo động lượng trước (đường đứt: bằng nhau)', xlabel: 'p trước (kg·m/s)', ylabel: 'p sau (kg·m/s)', x: 'p', y: 'pp', fit: 'origin', dec: 3,
    curve: () => [[0, 0], [1, 1]], curveDash: [6, 4], zeroX: true, zeroY: true,
    range: (p, rows) => { const M = Math.max(0.2, ...rows.flatMap((r) => [r.p, r.pp])) * 1.15; return { xmin: 0, xmax: M, ymin: 0, ymax: M }; },
  }],
  predict: {
    prompt: '<p>Với loại va chạm và các thông số đang chọn (xe 2 đứng yên), hãy dự đoán <b>thời gian chắn sáng t₂ ở cổng 2</b> sau va chạm. Lập luận: tính v₂′ (hoặc v′) bằng bảo toàn động lượng rồi t₂ = d/v₂′. Bỏ qua ma sát.</p>',
    fields: [{ k: 't2', label: 't₂', unit: 'ms', dec: 1 }],
    expected: (p) => ({ t2: (p.d / phys.after(p).v2) }), tol: 0.03, absTol: 0.5,
    explain: (p) => { const a = phys.after(p); return `v₂′ = ${fmt(a.v2, 3)} m/s nên t₂ = d/v₂′ = ${fmt(p.d / 1000, 3)}/${fmt(a.v2, 3)} = ${fmt(p.d / a.v2, 1)} ms.`; },
  },
  tasks: [
    {
      title: 'Xử lí số liệu 1: động lượng trước và sau ở lần đo 1',
      prompt: '<p>Lấy <b>lần đo 1</b> trong bảng. Tính vận tốc của xe 1 qua cổng 1 (v₁ = d/t₁), động lượng trước p = m₁v₁, động lượng sau p′ (theo công thức trong phần lí thuyết, dùng t₂ và t₃ nếu có) và sai lệch tương đối δ = |p′ − p|/p × 100 %. Đổi d từ mm và t từ ms: v (m/s) = d (mm) / t (ms).</p>',
      fields: [{ k: 'v1', label: 'v₁', unit: 'm/s', dec: 3, absTol: 0.003 }, { k: 'p', label: 'p trước', unit: 'kg·m/s', dec: 4, absTol: 0.0005 }, { k: 'pp', label: 'p′ sau', unit: 'kg·m/s', dec: 4, absTol: 0.0005 }, { k: 'dl', label: 'δ', unit: '%', dec: 2, absTol: 0.1 }],
      minRows: 1, tol: 0.02,
      expected(p, rows) {
        const r = rows[0], pb = phys.pBefore(r.m1, r.d, r.t1), pa = phys.pAfter(p.type, r.m1, r.m2, r.d, r.t2, r.t3);
        return { v1: r.d / r.t1, p: pb, pp: pa, dl: (Math.abs(pa - pb) / pb) * 100 };
      },
      explain: () => 'Sai lệch vài phần trăm trở xuống: trong phạm vi sai số của thí nghiệm, động lượng của hệ trước và sau va chạm bằng nhau.',
    },
    {
      title: 'Xử lí số liệu 2: đánh giá chung qua nhiều lần đo',
      prompt: '<p>Ghi ít nhất 4 lần đo với m₁, m₂, tốc độ khác nhau. Đọc <b>độ dốc k</b> của đường khớp qua gốc trong đồ thị p′ theo p (nếu động lượng bảo toàn thì k ≈ 1), rồi tính sai lệch trung bình <b>|1 − k| × 100 %</b>.</p>',
      fields: [{ k: 'k', label: 'Độ dốc k', unit: '', dec: 3, absTol: 0.002 }, { k: 'dl', label: '|1 − k| × 100', unit: '%', dec: 2, absTol: 0.2 }],
      minRows: 4, tol: 0.02,
      expected(p, rows) { let sxy = 0, sxx = 0; for (const r of rows) { sxy += r.p * r.pp; sxx += r.p * r.p; } const k = sxy / sxx; return { k, dl: Math.abs(1 - k) * 100 }; },
      explain: () => 'k hơi nhỏ hơn 1 (khoảng 0,99): do ma sát và lực cản không khí còn lại (sai số hệ thống) cùng sai số ngẫu nhiên của dụng cụ.',
      reference: (p) => `Mô phỏng cài sẵn: sau va chạm vận tốc giảm ${fmt(LOSS * 100, 0)} % do ma sát nên k lí thuyết ≈ ${fmt(1 - LOSS, 2)}.`,
    },
  ],
  quiz: [
    { q: 'Tấm chắn rộng 5,0 cm chắn sáng cổng quang trong 62,5 ms. Tốc độ của xe là:', o: ['0,80 m/s', '0,31 m/s', '3,1 m/s'], a: 0, why: 'v = d/t = 0,050 m / 0,0625 s = 0,80 m/s.' },
    { q: 'Xe 0,30 kg chạy 0,80 m/s. Động lượng của xe là:', o: ['0,24 kg·m/s', '2,4 kg·m/s', '0,375 kg·m/s'], a: 0, why: 'p = mv = 0,30·0,80 = 0,24 kg·m/s.' },
    { q: 'Xe 0,30 kg chạy 0,80 m/s va chạm mềm với xe 0,50 kg đứng yên. Vận tốc của hai xe sau va chạm là:', o: ['0,30 m/s', '0,48 m/s', '0,80 m/s'], a: 0, why: '0,30·0,80 = (0,30 + 0,50)·v′ nên v′ = 0,24/0,80 = 0,30 m/s.' },
    { q: 'Vì sao p sau va chạm đo được thường nhỏ hơn p trước vài phần trăm?', o: ['Ma sát, lực cản không khí còn lại và sai số dụng cụ đo', 'Định luật bảo toàn động lượng không còn đúng', 'Tấm chắn quá hẹp'], a: 0, why: 'Hệ chỉ gần đúng là cô lập; các sai số cũng làm số liệu lệch nhẹ.' },
    { q: 'Với p = 0,240 kg·m/s và p′ = 0,236 kg·m/s, sai lệch tương đối là:', o: ['1,7 %', '0,4 %', '17 %'], a: 0, why: 'δ = 0,004/0,240 ≈ 0,017 = 1,7 %.' },
  ],
  demo: async (api) => {
    const sets = [[0.3, 0.5, 0.8, 50], [0.25, 0.4, 1.0, 40], [0.4, 0.55, 0.6, 60], [0.35, 0.6, 1.2, 30], [0.5, 0.6, 0.5, 50], [0.3, 0.3, 0.9, 80]];
    for (const [m1, m2, v1, d] of sets) {
      api.setParam('m1', m1); api.setParam('m2', m2); api.setParam('v1', v1); api.setParam('d', d);
      api.setT(api.duration()); api.record();
    }
  },
};

export const mount = (root, entry) => mountLab(root, entry, spec);

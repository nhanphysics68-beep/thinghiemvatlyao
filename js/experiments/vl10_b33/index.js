// Vật lí 10 – Bài 33: Biến dạng của vật rắn (biến dạng kéo của lò xo, định luật Hooke, giới hạn đàn hồi).
// Treo các quả cân vào lò xo, đọc chiều dài trên thước, vẽ đồ thị F – Δl.
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, line, rect, circle, spring } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
const G = 9.8;
const L0 = 0.20;                      // chiều dài tự nhiên của mỗi lò xo (m)
const PL = 0.5;                       // sau giới hạn đàn hồi, độ cứng "hiệu dụng" chỉ còn PL·k
const SPRINGS = [                     // k (N/m) và độ giãn tối đa còn đàn hồi Δl_gh (m)
  { name: 'Lò xo A (mềm)', k: 25, dm: 0.12 },
  { name: 'Lò xo B (trung bình)', k: 50, dm: 0.08 },
  { name: 'Lò xo C (cứng)', k: 100, dm: 0.05 },
];
const FMAXM = 0.6;                    // khối lượng lớn nhất trên thanh trượt (kg)

export const phys = {
  G, L0, SPRINGS,
  // độ giãn của MỘT lò xo chịu lực F: tuyến tính đến giới hạn đàn hồi, sau đó giãn nhanh hơn (biến dạng dư)
  ext1: (F, s) => (F <= s.k * s.dm ? F / s.k : s.dm + (F - s.k * s.dm) / (PL * s.k)),
  // cấu hình theo cách mắc: 0 = một lò xo, 1 = hai lò xo nối tiếp, 2 = hai lò xo song song
  cfg(p) {
    const s = SPRINGS[p.sp];
    if (p.mode === 1) return { s, kEff: s.k / 2, Fgh: s.k * s.dm, l0: 2 * L0 };
    if (p.mode === 2) return { s, kEff: 2 * s.k, Fgh: 2 * s.k * s.dm, l0: L0 };
    return { s, kEff: s.k, Fgh: s.k * s.dm, l0: L0 };
  },
  weight: (p) => p.m * G,                                   // F = P = mg
  perSpring(p, F = phys.weight(p)) {                        // độ giãn của từng lò xo trong hệ
    const s = SPRINGS[p.sp];
    return p.mode === 2 ? phys.ext1(F / 2, s) : phys.ext1(F, s);
  },
  ext(p, F = phys.weight(p)) {                              // độ giãn tổng Δl của hệ
    const e = phys.perSpring(p, F);
    return p.mode === 1 ? 2 * e : e;
  },
  // độ giãn còn lại sau khi bỏ quả cân: phần biến dạng dư
  resid(p, F = phys.weight(p)) { return Math.max(0, phys.ext(p, F) - F / phys.cfg(p).kEff); },
  // Một lần đo: thước chia đến 1 mm; Δl = l − l₀ (l₀ đã đo khi chưa treo vật).
  sample(p, n) {
    const c = phys.cfg(p), m = n.round(p.m, 0.001), F = n.round(m * G, 0.001);
    const l = n.round(c.l0 + phys.ext(p) + n.noise(0.0005), 0.001);
    const res = Math.max(0, n.round(phys.resid(p) + n.noise(0.0002), 0.001)) + 0;
    return { m, F, l, dl: n.round(l - c.l0, 0.001), res };
  },
};
const EL_TH = 0.0015;                                       // Δl dư ≤ 1,5 mm coi như còn đàn hồi
const isEl = (r) => r.res <= EL_TH;
const originSlope = (pts) => { let sxy = 0, sxx = 0; for (const [x, y] of pts) { sxy += x * y; sxx += x * x; } return sxx ? sxy / sxx : NaN; };

export const spec = {
  seed: 3333,
  intro: 'Treo các quả cân vào đầu dưới của lò xo và đọc chiều dài của lò xo trên thước. Em sẽ tìm mối liên hệ giữa lực kéo F và độ giãn Δl, xác định độ cứng k và tìm hiểu giới hạn đàn hồi của lò xo.',
  goals: [
    'Nhận biết biến dạng kéo của lò xo và lực đàn hồi hướng về vị trí không biến dạng.',
    'Phát biểu và vận dụng định luật Hooke: trong giới hạn đàn hồi, F_đh = k·|Δl|.',
    'Xác định độ cứng k từ hệ số góc của đồ thị F – Δl; nhận biết giới hạn đàn hồi qua biến dạng dư.',
  ],
  theory: 'Δl = l − l₀ &nbsp;&nbsp; F<sub>đh</sub> = k·|Δl| &nbsp;&nbsp; P = mg (g = 9,8 m/s²) &nbsp;&nbsp; k = F/Δl (N/m)<br>Mở rộng: hai lò xo giống nhau ghép nối tiếp có k<sub>nt</sub> = k/2; ghép song song có k<sub>ss</sub> = 2k.',
  setup: 'Vật nằm cân bằng nên lực đàn hồi cân bằng với trọng lực: F_đh = P = mg. Chọn lò xo và cách mắc; đổi một trong hai thì bảng số liệu bị xóa. Cột “Δl dư” là độ giãn còn lại sau khi gỡ quả cân ra.',
  choices: [
    { k: 'sp', label: 'Lò xo', options: SPRINGS.map((s, i) => [i, s.name]), def: 0 },
    { k: 'mode', label: 'Cách mắc (mở rộng)', options: [[0, 'Một lò xo'], [1, 'Hai lò xo ghép nối tiếp'], [2, 'Hai lò xo ghép song song']], def: 0 },
  ],
  params: [{ k: 'm', label: 'Khối lượng quả cân treo m', unit: 'kg', min: 0, max: FMAXM, step: 0.02, def: 0.1, dec: 2 }],
  toggles: [
    { k: 'vec', label: 'Hiện lực P và F_đh', def: true },
    { k: 'unload', label: 'Gỡ quả cân ra', def: false },
  ],
  stageHeight: 380,
  ariaLabel: 'Lò xo treo thẳng đứng bên cạnh thước đo, đầu dưới treo quả cân, có chỉ độ giãn và các lực',
  state(p) {
    const c = phys.cfg(p), F = phys.weight(p), dl = phys.ext(p);
    return { F, dl, l: c.l0 + dl, resid: phys.resid(p), over: F > c.Fgh + 1e-9, l0: c.l0, e1: phys.perSpring(p), r1: phys.resid(p) / (p.mode === 1 ? 2 : 1) };
  },
  readouts: (p, s) => [['l₀', fmt(s.l0, 3) + ' m'], ['l', fmt(s.l, 3) + ' m'], ['F', fmt(s.F, 2) + ' N']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const c = phys.cfg(p), top = 24, mode = p.mode;
    const maxL = c.l0 + phys.ext(p, FMAXM * G), ppm = (h - top - 110) / maxL;
    const xs = Math.max(120, w * 0.42), xr = w - 54;
    const un = tg.unload, dl = un ? s.resid : s.dl, L = c.l0 + dl, yb = top + L * ppm, y0 = top + c.l0 * ppm;
    const col = s.over ? th.bad : th.ink;
    // trần
    line(ctx, xs - 60, top, xs + 60, top, th.ink, 3);
    for (let x = xs - 60; x < xs + 60; x += 10) line(ctx, x, top, x + 6, top - 8, th.axis, 1);
    // lò xo theo cách mắc
    if (mode === 0) spring(ctx, xs, top, xs, yb, col, 8, 8);
    else if (mode === 1) {
      const ym = top + (c.l0 / 2 + (un ? s.r1 : s.e1)) * ppm;
      spring(ctx, xs, top, xs, ym, col, 6, 8); circle(ctx, xs, ym, 3, th.ink); spring(ctx, xs, ym, xs, yb, col, 6, 8);
    } else {
      const xa = xs - 20, xb = xs + 20;
      line(ctx, xa, top, xb, top, th.ink, 3); line(ctx, xa, yb, xb, yb, th.ink, 3);
      spring(ctx, xa, top, xa, yb, col, 8, 5); spring(ctx, xb, top, xb, yb, col, 8, 5);
    }
    // thước thẳng đứng, gốc ở điểm treo
    const base = Math.ceil(maxL * 20) / 20;
    line(ctx, xr, top, xr, top + base * ppm, th.axis, 1);
    const minor = ppm * 0.01 >= 5 ? 0.01 : 0.05;
    for (let v = 0; v <= base + 1e-9; v += minor) {
      const big = Math.abs(v / 0.05 - Math.round(v / 0.05)) < 1e-6, y = top + v * ppm;
      line(ctx, xr, y, xr + (big ? 8 : 4), y, th.axis, 1);
      if (big && Math.abs(v / 0.1 - Math.round(v / 0.1)) < 1e-6) text(ctx, fmt(v, 1), xr + 11, y + 4, { color: th.muted, size: 11 });
    }
    text(ctx, 'm', xr + 11, top - 6, { color: th.muted, size: 11 });
    // chiều dài tự nhiên l₀ và vị trí đầu lò xo
    line(ctx, xs - 40, y0, xr, y0, th.axis, 1, [4, 4]);
    text(ctx, 'l₀', xr - 6, y0 - 4, { color: th.muted, size: 12, align: 'right' });
    line(ctx, xs + (mode === 2 ? 26 : 14), yb, xr, yb, th.accent, 1.5, [2, 3]);
    if (dl * ppm > 4) {
      const xd = xs - (mode === 2 ? 44 : 32);
      arrow(ctx, xd, y0, xd, yb, th.accent, 2, 7);
      text(ctx, un ? 'Δl dư' : 'Δl', xd - 5, (y0 + yb) / 2 + 4, { color: th.accent, size: 12, align: 'right', bold: true });
    }
    // quả cân
    if (!un && p.m > 0.0005) {
      const wd = 34 + 26 * (p.m / FMAXM), ht = 22 + 22 * (p.m / FMAXM), wy = yb + 10;
      line(ctx, xs, yb, xs, wy, th.ink, 2);
      rect(ctx, xs - wd / 2, wy, wd, ht, th.s2, th.ink, 4);
      text(ctx, fmt(p.m * 1000, 0) + ' g', xs, wy + ht / 2 + 4, { color: '#ffffff', size: 12, align: 'center', bold: true });
      if (tg.vec) {
        const Lp = 18 + 34 * (s.F / (FMAXM * G)), xv = xs + wd / 2 + 14, ym = wy + ht / 2;
        arrow(ctx, xv, ym, xv, ym + Lp, th.car, 3);
        text(ctx, 'P', xv + 6, ym + Lp, { color: th.car, size: 13, bold: true });
        arrow(ctx, xv + 24, ym, xv + 24, ym - Lp, th.ok, 3);
        text(ctx, 'F_đh', xv + 35, ym - Lp + 8, { color: th.ok, size: 13, bold: true });
      }
    } else circle(ctx, xs, yb + 3, 3, th.ink);
    // trạng thái
    if (un) text(ctx, s.resid > EL_TH ? 'Lò xo không về chiều dài ban đầu' : 'Lò xo trở về chiều dài ban đầu', 10, h - 8, { color: s.resid > EL_TH ? th.bad : th.ok, size: 12, bold: true });
    else text(ctx, s.over ? 'Vượt giới hạn đàn hồi' : 'Trong giới hạn đàn hồi', 10, h - 8, { color: s.over ? th.bad : th.ok, size: 12, bold: true });
  },
  columns: [
    { k: 'm', label: 'm', unit: 'kg', dec: 3 }, { k: 'F', label: 'F = mg', unit: 'N', dec: 3 }, { k: 'l', label: 'l', unit: 'm', dec: 3 },
    { k: 'dl', label: 'Δl', unit: 'm', dec: 3 }, { k: 'res', label: 'Δl dư', unit: 'm', dec: 3 },
  ],
  recordLabel: 'Ghi số liệu (m, l, Δl dư)',
  note: 'Mỗi lần ghi: thước chia đến 1 mm (sai số khoảng 0,5 mm); Δl = l − l₀ với l₀ là chiều dài khi chưa treo vật; Δl dư đo sau khi gỡ quả cân.',
  record: (p, s, t, n) => phys.sample(p, n),
  graphs: [
    { title: 'Đồ thị F – Δl', xlabel: 'Δl (m)', ylabel: 'F (N)', x: 'dl', y: 'F', fit: 'origin', dec: 1, marker: (p, s) => [s.dl, s.F], zeroX: true, zeroY: true },
    { title: 'Đồ thị Δl dư – F', xlabel: 'F (N)', ylabel: 'Δl dư (m)', x: 'F', y: 'res', dec: 3, marker: (p, s) => [s.F, s.resid], zeroX: true, zeroY: true },
  ],
  predict: {
    prompt: '<p>Một lò xo có độ cứng <b>k = 40 N/m</b>, treo thẳng đứng và đầu dưới treo vật <b>m = 0,25 kg</b> (g = 9,8 m/s²). Giả sử lò xo vẫn trong giới hạn đàn hồi. Tính lực đàn hồi và độ giãn của lò xo.</p>',
    fields: [{ k: 'F', label: 'F_đh', unit: 'N', dec: 2 }, { k: 'dl', label: 'Δl', unit: 'm', dec: 3 }],
    expected: () => ({ F: 0.25 * G, dl: (0.25 * G) / 40 }), tol: 0.02, absTol: 0.002,
    explain: () => 'Vật cân bằng: F_đh = P = mg = 0,25 × 9,8 = 2,45 N; Δl = F_đh/k = 2,45/40 ≈ 0,061 m.',
  },
  tasks: [{
    title: 'Xử lí số liệu 1: độ cứng k của lò xo',
    prompt: '<p>Ghi ít nhất 5 lần đo với các khối lượng khác nhau <b>trong giới hạn đàn hồi</b> (cột Δl dư bằng 0; nếu có điểm vượt giới hạn, xóa chúng bằng nút ✕ trước khi đọc đồ thị). Đồ thị F – Δl là đường thẳng qua gốc, <b>hệ số góc là k</b>. Đọc k ở chú thích dưới đồ thị, rồi dùng k tính độ giãn khi treo vật 0,25 kg.</p>',
    fields: [{ k: 'k', label: 'Độ cứng k', unit: 'N/m', dec: 1, absTol: 0.5 }, { k: 'dl', label: 'Δl khi m = 0,25 kg', unit: 'm', dec: 3, absTol: 0.003 }],
    minRows: 5, tol: 0.03,
    need: (rows) => (rows.filter(isEl).length < 5 ? 'Cần ghi ít nhất 5 lần đo còn trong giới hạn đàn hồi (cột Δl dư ≈ 0).' : null),
    expected: (p, rows) => { const k = originSlope(rows.filter(isEl).map((r) => [r.dl, r.F])); return { k, dl: (0.25 * G) / k }; },
    explain: (p, rows, exp) => `Hệ số góc của đoạn thẳng là k = ΔF/Δl = ${fmt(exp.k, 1)} N/m; Δl = mg/k = 2,45/${fmt(exp.k, 1)} = ${fmt(exp.dl, 3)} m. Nếu đáp án của em lệch, kiểm tra xem còn điểm vượt giới hạn đàn hồi trong đồ thị không.`,
    reference: (p) => `Giá trị cài đặt trong mô phỏng: k = ${fmt(phys.cfg(p).kEff, 1)} N/m.`,
  }, {
    title: 'Xử lí số liệu 2: giới hạn đàn hồi',
    prompt: '<p>Tăng dần khối lượng cho tới khi sau khi gỡ quả cân, lò xo <b>không còn trở về chiều dài cũ</b> (Δl dư > 0). Ghi các lần đo ở cả hai phía. Lực lớn nhất mà lò xo còn đàn hồi (lần đo có Δl dư = 0 và F lớn nhất) là ước lượng của <b>giới hạn đàn hồi F<sub>gh</sub></b>.</p>',
    fields: [{ k: 'F', label: 'F lớn nhất còn đàn hồi', unit: 'N', dec: 2, absTol: 0.02 }],
    minRows: 4, tol: 0.01,
    need: (rows) => (rows.filter(isEl).length < 3 ? 'Cần ít nhất 3 lần đo còn đàn hồi.' : rows.some((r) => !isEl(r)) ? null : 'Hãy tăng khối lượng cho tới khi Δl dư > 0 để thấy lò xo vượt giới hạn.'),
    expected: (p, rows) => ({ F: Math.max(...rows.filter(isEl).map((r) => r.F)) }),
    explain: (p, rows, exp) => { const bad = rows.filter((r) => !isEl(r)).map((r) => r.F), nx = Math.min(...bad); return `Giới hạn đàn hồi nằm trong khoảng từ ${fmt(exp.F, 2)} N đến ${fmt(nx, 2)} N (lần đo kế tiếp đã có biến dạng dư).`; },
    reference: (p) => `Giá trị cài đặt trong mô phỏng: F_gh = ${fmt(phys.cfg(p).Fgh, 2)} N (ứng với Δl = ${fmt(phys.cfg(p).Fgh / phys.cfg(p).kEff, 3)} m).`,
  }],
  demo: async (api) => {
    for (const m of [0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.4, 0.5, 0.6]) { api.setParam('m', m); api.record(); }
  },
  quiz: [
    { q: 'Trong giới hạn đàn hồi, lực đàn hồi của lò xo:', o: ['tỉ lệ nghịch với độ biến dạng', 'không phụ thuộc độ biến dạng', 'tỉ lệ thuận với độ biến dạng'], a: 2, why: 'Định luật Hooke: F_đh = k|Δl|.' },
    { q: 'Lò xo có k = 50 N/m bị kéo giãn 4 cm. Lực đàn hồi của lò xo là:', o: ['2 N', '200 N', '12,5 N'], a: 0, why: 'F = kΔl = 50 × 0,04 = 2 N (đổi 4 cm = 0,04 m).' },
    { q: 'Khi lò xo bị kéo giãn, lực đàn hồi tác dụng lên vật có hướng:', o: ['cùng chiều với biến dạng, hướng ra xa điểm treo', 'ngược chiều biến dạng, hướng về vị trí lò xo không biến dạng', 'vuông góc với trục lò xo'], a: 1, why: 'Lực đàn hồi luôn có xu hướng đưa lò xo trở về chiều dài tự nhiên.' },
    { q: 'Khi lực kéo vượt quá giới hạn đàn hồi, sau khi bỏ lực lò xo:', o: ['không trở về hoàn toàn chiều dài ban đầu', 'vẫn trở về đúng chiều dài ban đầu', 'co ngắn hơn chiều dài ban đầu'], a: 0, why: 'Vượt giới hạn đàn hồi thì có biến dạng dư; định luật Hooke không còn đúng.' },
    { q: 'Ghép song song hai lò xo giống nhau, mỗi lò xo có độ cứng k thì độ cứng của hệ là:', o: ['k/2', 'k', '2k'], a: 2, why: 'Mỗi lò xo chịu một nửa lực nên cùng độ giãn cần lực gấp đôi: k_ss = 2k (ghép nối tiếp thì k/2).' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

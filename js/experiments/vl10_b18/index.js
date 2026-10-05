// Vật lí 10 – Bài 18: Lực ma sát (kéo vật bằng lực kế / mặt phẳng nghiêng).
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, ground, ruler, rect, circle, line, spring } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
const G = 9.8;          // m/s²
const RATE_F = 1.5;     // N/s: tốc độ tăng lực kéo khi kéo ngang
const RATE_A = 3;       // độ/s: tốc độ nâng ván nghiêng
const LB = 0.6;         // m: quãng đường trượt trên ván nghiêng
const VP = 0.15;        // m/s: tốc độ kéo đều khi vật đã trượt
const DEG = Math.PI / 180;
// Cặp bề mặt: [μn (nghỉ), μt (trượt)]
const MAT = { go: [0.50, 0.35], nham: [0.70, 0.55], nhua: [0.30, 0.22], cao: [0.90, 0.70] };

export const phys = {
  G, RATE_F, RATE_A, LB, VP, MAT,
  // Các đại lượng đặc trưng của một lần thí nghiệm
  model(p) {
    const [mus, muk] = MAT[p.mat], P = G * p.m;
    if (p.mode === 'nghieng') {
      const as = Math.atan(mus);                              // tan α₀ = μn
      const a = G * (Math.sin(as) - muk * Math.cos(as));      // a = g(sinα − μt cosα)
      return { mode: 'nghieng', mus, muk, P, as, ts: as / DEG / RATE_A, a, tL: Math.sqrt((2 * LB) / a) };
    }
    return { mode: 'ngang', mus, muk, P, ts: (mus * P) / RATE_F, Fmax: mus * P, Ft: muk * P };
  },
  duration(p) { const m = phys.model(p); return m.mode === 'nghieng' ? m.ts + m.tL + 0.8 : m.ts + 3; },
  // Trạng thái tại thời điểm t
  at(p, t) {
    const m = phys.model(p), P = m.P;
    if (m.mode === 'nghieng') {
      if (t < m.ts) { const al = RATE_A * t * DEG; return { mode: m.mode, slid: false, alpha: al, N: P * Math.cos(al), fr: P * Math.sin(al), F: 0, x: 0, v: 0, peak: P * Math.sin(al) }; }
      const tt = t - m.ts, x = Math.min(LB, 0.5 * m.a * tt * tt), v = m.a * Math.min(tt, m.tL);
      return { mode: m.mode, slid: true, alpha: m.as, N: P * Math.cos(m.as), fr: m.muk * P * Math.cos(m.as), F: 0, x, v, peak: m.mus * P * Math.cos(m.as) };
    }
    if (t < m.ts) { const F = RATE_F * t; return { mode: m.mode, slid: false, alpha: 0, N: P, fr: F, F, x: 0, v: 0, peak: F }; }
    return { mode: m.mode, slid: true, alpha: 0, N: P, fr: m.Ft, F: m.Ft, x: VP * (t - m.ts), v: VP, peak: m.Fmax };
  },
};

const rowsOf = (rows, k) => rows.filter((r) => isFinite(r[k]));
const originSlope = (rows, xk, yk) => { let a = 0, b = 0; for (const r of rows) { a += r[xk] * r[yk]; b += r[xk] * r[xk]; } return a / b; };
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

export const spec = {
  seed: 1818,
  intro: 'Em kéo một khối gỗ trên mặt bàn bằng lực kế, hoặc nâng dần một tấm ván nghiêng cho khối gỗ trượt. Từ số liệu, em xác định hệ số ma sát nghỉ μn và hệ số ma sát trượt μt.',
  goals: [
    'Quan sát: lực ma sát nghỉ tăng theo lực kéo, đạt giá trị cực đại rồi vật mới trượt; khi trượt lực ma sát nhỏ hơn.',
    'Xác định hệ số ma sát từ đồ thị F – N hoặc từ góc trượt trên mặt phẳng nghiêng.',
    'Vận dụng: Fmsn max = μn·N; Fmst = μt·N; trên mặt phẳng nghiêng tanα₀ = μn.',
  ],
  theory: 'F<sub>msn</sub> ≤ μ<sub>n</sub>·N &nbsp; (cực đại: μ<sub>n</sub>·N) &nbsp;&nbsp; F<sub>mst</sub> = μ<sub>t</sub>·N &nbsp;&nbsp; N = P = mg (mặt ngang), N = mg·cosα (mặt nghiêng)<br>Vật bắt đầu trượt trên mặt nghiêng khi tanα₀ = μ<sub>n</sub>; khi trượt a = g(sinα − μ<sub>t</sub>·cosα). Lấy g = 9,8 m/s².',
  setup: 'Chọn cách bố trí và cặp bề mặt tiếp xúc. <b>Kéo ngang:</b> lực kéo tăng đều; vật đứng yên cho tới khi lực kéo vượt ma sát nghỉ cực đại, sau đó được kéo đều. <b>Mặt phẳng nghiêng:</b> ván được nâng dần 3°/s cho tới khi khối gỗ bắt đầu trượt. Bấm “Chạy”, tạm dừng đúng lúc cần quan sát, rồi chạy tiếp tới khi vật đã trượt để ghi số liệu.',
  choices: [
    { k: 'mode', label: 'Cách bố trí', options: [['ngang', 'Kéo ngang bằng lực kế'], ['nghieng', 'Mặt phẳng nghiêng']], def: 'ngang', string: true },
    { k: 'mat', label: 'Cặp bề mặt', options: [['go', 'Gỗ – gỗ'], ['nham', 'Gỗ – giấy nhám'], ['nhua', 'Gỗ – nhựa nhẵn'], ['cao', 'Gỗ – cao su']], def: 'go', string: true },
  ],
  params: [
    { k: 'm', label: 'Khối lượng khối gỗ m', unit: 'kg', min: 0.3, max: 1.5, step: 0.1, def: 0.5, dec: 1 },
  ],
  toggles: [{ k: 'vec', label: 'Hiện sơ đồ lực', def: true }],
  stageHeight: 250,
  ariaLabel: 'Khối gỗ được kéo bằng lực kế trên mặt bàn hoặc đặt trên ván nghiêng, kèm sơ đồ các lực',
  duration: (p) => phys.duration(p),
  state: (p, t) => phys.at(p, t),
  readouts: (p, s) => (p.mode === 'nghieng'
    ? [['α', fmt(s.alpha / DEG, 1) + '°'], ['Fms', fmt(s.fr, 2) + ' N'], ['đã trượt', fmt(s.x, 2) + ' m']]
    : [['Lực kéo', fmt(s.F, 2) + ' N'], ['Fms', fmt(s.fr, 2) + ' N'], ['số chỉ cực đại', fmt(s.peak, 2) + ' N']]),
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const P = G * p.m, k = 46 / P;
    text(ctx, s.slid ? 'Đang trượt' : 'Đứng yên', w - 10, 20, { color: s.slid ? th.bad : th.ok, align: 'right', bold: true, size: 14 });
    const cx = 74, cy = 76;
    if (tg.vec) {
      text(ctx, 'Sơ đồ lực', 8, 16, { color: th.muted, size: 11 });
      circle(ctx, cx, cy, 4, th.ink);
      if (p.mode === 'ngang') {
        arrow(ctx, cx, cy, cx, cy + P * k, th.ink, 2.5); text(ctx, 'P', cx + 6, cy + P * k, { color: th.ink, size: 12 });
        arrow(ctx, cx, cy, cx, cy - s.N * k, th.ok, 2.5); text(ctx, 'N', cx + 6, cy - s.N * k + 8, { color: th.ok, size: 12 });
        if (s.F > 0.05) { arrow(ctx, cx, cy, cx + s.F * k, cy, th.accent, 2.5); text(ctx, 'F', cx + s.F * k - 4, cy - 8, { color: th.accent, size: 12 }); }
        if (s.fr > 0.05) { arrow(ctx, cx, cy, cx - s.fr * k, cy, th.bad, 2.5); text(ctx, 'Fms', cx - s.fr * k - 2, cy - 8, { color: th.bad, size: 12, align: 'right' }); }
      } else {
        const a = s.alpha, ux = Math.cos(a), uy = -Math.sin(a), nx = -Math.sin(a), ny = -Math.cos(a);
        arrow(ctx, cx, cy, cx, cy + P * k, th.ink, 2.5); text(ctx, 'P', cx + 6, cy + P * k, { color: th.ink, size: 12 });
        arrow(ctx, cx, cy, cx + nx * s.N * k, cy + ny * s.N * k, th.ok, 2.5); text(ctx, 'N', cx + nx * s.N * k - 8, cy + ny * s.N * k - 2, { color: th.ok, size: 12, align: 'right' });
        if (s.fr > 0.05) { arrow(ctx, cx, cy, cx + ux * s.fr * k, cy + uy * s.fr * k, th.bad, 2.5); text(ctx, 'Fms', cx + ux * s.fr * k + 5, cy + uy * s.fr * k - 3, { color: th.bad, size: 12 }); }
      }
    }
    if (p.mode === 'ngang') {
      const yg = h - 46, ppm = Math.min(400, (w - 214) / 0.5), bx = 24 + s.x * ppm, yc = yg - 19;
      ground(ctx, 10, w - 10, yg, th, 8);
      ruler(ctx, 24, yg + 12, ppm, 0, 0.5, 0.05, th, { unit: 'm', labelEvery: 4 });
      line(ctx, 24, yg - 44, 24, yg, th.muted, 1, [3, 3]);
      rect(ctx, bx, yg - 38, 56, 38, th.car, null, 4);
      text(ctx, fmt(p.m, 1) + ' kg', bx + 28, yg - 14, { color: '#fff', align: 'center', bold: true, size: 12 });
      spring(ctx, bx + 56, yc, bx + 104, yc, th.axis, 6, 5);
      rect(ctx, bx + 104, yc - 15, 78, 30, th.card, th.axis, 5);
      text(ctx, fmt(s.F, 2) + ' N', bx + 143, yc + 5, { align: 'center', bold: true, size: 13, color: th.ink });
    } else {
      const a = s.alpha, Lb = Math.min(w - 50, (h - 70) / 0.8, 380), x0 = 24, yg = h - 28, ppm = (Lb - 90) / LB, d0 = Lb - 34, d = d0 - s.x * ppm;
      ground(ctx, 10, w - 10, yg, th, 8);
      ctx.save(); ctx.translate(x0, yg); ctx.rotate(-a);
      rect(ctx, 0, -6, Lb, 6, th.axis, null, 2);
      line(ctx, d0 - 24, -8, d0 - 24, -46, th.muted, 1, [3, 3]);
      line(ctx, d0 - 24 - LB * ppm, -8, d0 - 24 - LB * ppm, -46, th.muted, 1, [3, 3]);
      line(ctx, d0 - 24 - LB * ppm, 14, d0 - 24, 14, th.muted, 1);
      text(ctx, 'L = ' + fmt(LB, 2) + ' m', d0 - 24 - (LB * ppm) / 2, 28, { align: 'center', color: th.muted, size: 11 });
      rect(ctx, d - 24, -36, 48, 30, th.car, null, 4);
      text(ctx, fmt(p.m, 1) + ' kg', d, -16, { color: '#fff', align: 'center', bold: true, size: 12 });
      ctx.restore();
      ctx.save(); ctx.strokeStyle = th.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x0, yg, 44, -a, 0); ctx.stroke(); ctx.restore();
      text(ctx, 'α = ' + fmt(a / DEG, 1) + '°', x0 + 4, yg + 20, { color: th.accent, bold: true, size: 12 });
    }
  },
  columns: [
    { k: 'P', label: 'P', unit: 'N', dec: 2 }, { k: 'Fn', label: 'Fmsn max', unit: 'N', dec: 2 }, { k: 'Ft', label: 'Fmst', unit: 'N', dec: 2 },
    { k: 'al', label: 'α₀', unit: '°', dec: 1 }, { k: 'tL', label: 'tL', unit: 's', dec: 2 },
  ],
  recordLabel: 'Ghi số liệu',
  note: 'Kéo ngang: lực kế chia 0,05 N, ghi sau khi vật đã trượt đều (Fmsn max = số chỉ lớn nhất, Fmst = số chỉ khi kéo đều). Mặt nghiêng: thước đo góc chia 0,5°, đồng hồ đo thời gian tL để vật trượt hết quãng đường L = 0,60 m.',
  record(p, s, t, n) {
    const m = phys.model(p), P = n.round(G * p.m + n.noise(0.02), 0.01);
    if (p.mode === 'nghieng') {
      if (!s.slid || t < m.ts + m.tL) return { error: 'Hãy chạy tới khi vật đã trượt hết quãng đường L (đồng hồ dừng) rồi mới ghi.' };
      return { P, al: n.round(m.as / DEG + n.noise(0.4), 0.5), tL: n.round(m.tL + n.noise(0.03), 0.01) };
    }
    if (!s.slid || t < m.ts + 0.5) return { error: 'Hãy chạy tới khi vật đã trượt đều (số chỉ lực kế đã giảm xuống) rồi mới ghi.' };
    return { P, Fn: n.round(m.Fmax + n.noise(0.04), 0.05), Ft: n.round(m.Ft + n.noise(0.03), 0.05) };
  },
  async demo(api) {
    for (let i = 0; i < 8; i++) { api.setParam('m', +(0.3 + 0.15 * i).toFixed(2)); api.setT(api.duration()); api.record(); }
  },
  graphs: [
    { title: 'Fmsn max – P (kéo ngang)', xlabel: 'P (N)', ylabel: 'Fmsn max (N)', x: 'P', y: 'Fn', fit: 'origin', zeroX: true, zeroY: true },
    { title: 'Fmst – P (kéo ngang)', xlabel: 'P (N)', ylabel: 'Fmst (N)', x: 'P', y: 'Ft', fit: 'origin', zeroX: true, zeroY: true },
    { title: 'Góc trượt α₀ – P (mặt nghiêng)', xlabel: 'P (N)', ylabel: 'α₀ (°)', x: 'P', y: 'al', zeroX: true, zeroY: true },
    {
      title: 'Lực ma sát Fms – t', xlabel: 't (s)', ylabel: 'Fms (N)', x: 'none', y: 'none', zeroX: true, zeroY: true,
      curve: (p) => {
        const T = phys.duration(p), ts = phys.model(p).ts, pts = [];
        for (let i = 0; i <= 120; i++) { const u = (T * i) / 120; pts.push([u, phys.at(p, u).fr]); }
        pts.push([ts - 1e-6, phys.at(p, ts - 1e-6).fr], [ts + 1e-6, phys.at(p, ts + 1e-6).fr]);
        return pts.sort((a, b) => a[0] - b[0]);
      },
      marker: (p, s, t) => [t, s.fr],
    },
  ],
  predict: {
    prompt: '<p>Khối gỗ 2,0 kg nằm trên sàn ngang, μn = 0,40 và μt = 0,30 (g = 9,8 m/s²). Tính lực kéo nhỏ nhất làm vật bắt đầu trượt và lực kéo để vật chuyển động thẳng đều.</p>',
    fields: [{ k: 'Fn', label: 'Lực kéo tối thiểu để vật trượt', unit: 'N' }, { k: 'Ft', label: 'Lực kéo để vật trượt đều', unit: 'N' }],
    expected: () => ({ Fn: 0.4 * 2 * G, Ft: 0.3 * 2 * G }), tol: 0.02, absTol: 0.05,
    explain: () => 'N = P = mg = 19,6 N. Fmsn max = μn·N = 0,40·19,6 = 7,84 N; vật trượt đều thì F = Fmst = μt·N = 0,30·19,6 = 5,88 N.',
  },
  tasks: [{
    title: 'Xử lí số liệu: tìm hệ số ma sát',
    prompt: '<p>Ghi ít nhất 4 lần đo (khác khối lượng). <b>Kéo ngang:</b> μn là độ dốc đường khớp qua gốc của đồ thị Fmsn max – P, μt là độ dốc của đồ thị Fmst – P. <b>Mặt nghiêng:</b> μn = tan của góc α₀ trung bình; μt = tanα₀ − 2L/(g·tL²·cosα₀), lấy trung bình các lần đo (L = 0,60 m).</p>',
    fields: [{ k: 'mus', label: 'Hệ số ma sát nghỉ μn', dec: 2, absTol: 0.01 }, { k: 'muk', label: 'Hệ số ma sát trượt μt', dec: 2, absTol: 0.01 }],
    need: (rows, p) => (rowsOf(rows, p.mode === 'nghieng' ? 'al' : 'Fn').length < 4 ? 'Cần ít nhất 4 lần ghi số liệu của cách bố trí đang chọn.' : null),
    tol: 0.03,
    expected(p, rows) {
      if (p.mode === 'nghieng') {
        const r = rowsOf(rows, 'al');
        return { mus: Math.tan(mean(r.map((q) => q.al)) * DEG), muk: mean(r.map((q) => { const a = q.al * DEG; return Math.tan(a) - (2 * LB) / (G * q.tL * q.tL * Math.cos(a)); })) };
      }
      return { mus: originSlope(rowsOf(rows, 'Fn'), 'P', 'Fn'), muk: originSlope(rowsOf(rows, 'Ft'), 'P', 'Ft') };
    },
    explain: (p) => (p.mode === 'nghieng' ? 'Trên mặt nghiêng: N = mg·cosα, Fmsn max = mg·sinα₀ nên μn = tanα₀ (không phụ thuộc khối lượng).' : 'Vì N = P nên Fms = μ·P: hệ số góc của đường thẳng qua gốc chính là μ.'),
    reference: (p) => `Giá trị cài đặt trong mô phỏng: μn = ${fmt(MAT[p.mat][0], 2)}, μt = ${fmt(MAT[p.mat][1], 2)}.`,
  }],
  quiz: [
    { q: 'Vật 2 kg được kéo đều trên sàn ngang, μt = 0,30 (g = 9,8 m/s²). Lực ma sát trượt là:', o: ['0,6 N', '5,9 N', '19,6 N'], a: 1, why: 'Fmst = μt·mg = 0,30·2·9,8 ≈ 5,9 N.' },
    { q: 'So với ma sát trượt, ma sát nghỉ cực đại thường:', o: ['nhỏ hơn', 'bằng', 'lớn hơn'], a: 2, why: 'Vì vậy số chỉ lực kế giảm xuống khi vật bắt đầu trượt.' },
    { q: 'Khối gỗ bắt đầu trượt trên ván khi góc nghiêng là 30°. Hệ số ma sát nghỉ là:', o: ['0,50', '0,58', '0,87'], a: 1, why: 'μn = tan30° ≈ 0,58.' },
    { q: 'Tăng khối lượng khối gỗ gấp đôi thì góc nghiêng làm vật bắt đầu trượt:', o: ['tăng gấp đôi', 'không đổi', 'giảm một nửa'], a: 1, why: 'tanα₀ = μn, không phụ thuộc khối lượng.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

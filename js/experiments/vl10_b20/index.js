// Vật lí 10 – Bài 20: Một số ví dụ về cách giải bài toán động lực học.
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, ground, rect, circle, line } from '../../core/draw.js';

const G = 9.8, DEG = Math.PI / 180, SMAX = 4;

// ---- Vật lí (hàm thuần) ----
export const phys = {
  G,
  // Giải bằng phương trình Newton. Trả về a, lực thứ hai cần tìm X (N hoặc T), N, Fms, có chuyển động hay không.
  solve(p) {
    const m = p.m1, mu = p.mu;
    if (p.bt === 'inc') {
      const al = p.alpha * DEG, N = m * G * Math.cos(al), Px = m * G * Math.sin(al), moving = Px > mu * N;
      return { moving, a: moving ? (Px - mu * N) / m : 0, N, X: N, fms: moving ? mu * N : Px };
    }
    if (p.bt === 'pull') {
      const be = p.beta * DEG, N = m * G - p.F * Math.sin(be), Fx = p.F * Math.cos(be), moving = Fx > mu * N;
      return { moving, a: moving ? (Fx - mu * N) / m : 0, N, X: N, fms: moving ? mu * N : Fx };
    }
    const m2 = p.m2, moving = m2 * G > mu * m * G, a = moving ? ((m2 - mu * m) * G) / (m + m2) : 0;
    return { moving, a, N: m * G, X: moving ? m * (a + mu * G) : m2 * G, fms: moving ? mu * m * G : m2 * G };
  },
  duration: (p) => { const a = phys.solve(p).a; return a > 1e-9 ? Math.min(3, Math.sqrt((2 * SMAX) / a)) : 3; },
};

// Giữ cho vật không bị nhấc khỏi sàn khi kéo chéo lên: F·sinβ ≤ 0,9·mg
const clampPull = (p) => {
  if (p.bt === 'pull' && p.beta > 0) { const fm = Math.floor((0.9 * p.m1 * G) / Math.sin(p.beta * DEG) / 0.5) * 0.5; if (p.F > fm) p.F = Math.max(0, fm); }
};

const STEPS = {
  inc: (p, r) => `Chọn Ox dọc mặt phẳng nghiêng chiều xuống dốc, Oy vuông góc với mặt phẳng.<br>Oy: N − P·cosα = 0 ⇒ N = mg·cosα = ${fmt(r.N)} N.<br>Ox: P·sinα − μN = ma ⇒ a = g(sinα − μ·cosα) = ${fmt(r.a)} m/s².`,
  pull: (p, r) => `Chọn Ox nằm ngang theo chiều chuyển động, Oy thẳng đứng hướng lên.<br>Oy: N + F·sinβ − P = 0 ⇒ N = mg − F·sinβ = ${fmt(r.N)} N.<br>Ox: F·cosβ − μN = ma ⇒ a = [F·cosβ − μ(mg − F·sinβ)]/m = ${fmt(r.a)} m/s².`,
  atw: (p, r) => `Vật m₁ (Ox theo chiều chuyển động): T − μm₁g = m₁a. Vật m₂: m₂g − T = m₂a.<br>Cộng hai phương trình: a = (m₂ − μm₁)g/(m₁ + m₂) = ${fmt(r.a)} m/s²; T = m₁(a + μg) = ${fmt(r.X)} N.`,
};

export const spec = {
  seed: 2020,
  intro: 'Em tự chọn số liệu cho một bài toán nhiều lực, giải bằng phương trình Newton rồi đối chiếu kết quả tính với mô phỏng.',
  goals: [
    'Thực hiện đủ các bước: vẽ lực, chọn hệ trục, phân tích lực, viết phương trình Newton cho từng trục.',
    'Tìm gia tốc, phản lực N hoặc lực căng T từ số liệu đã chọn.',
    'Kiểm tra lời giải bằng cách so sánh gia tốc tính được với gia tốc đo từ đồ thị v – t của mô phỏng.',
  ],
  theory: 'Σ<b>F</b> = m<b>a</b> &nbsp;⇒&nbsp; trên từng trục: ΣF<sub>x</sub> = ma<sub>x</sub>, ΣF<sub>y</sub> = ma<sub>y</sub> &nbsp;&nbsp; F<sub>ms</sub> = μN &nbsp;&nbsp; P = mg (g = 9,8 m/s²)<br>Các bước: (1) vẽ các lực; (2) chọn hệ trục, một trục theo chiều gia tốc; (3) phân tích lực lên trục; (4) viết và giải phương trình.',
  setup: 'Chọn bài toán, đặt số liệu, bật “Hiện hệ trục và thành phần lực” để đối chiếu với hình vẽ của em. Vật bắt đầu chuyển động từ trạng thái nghỉ khi t = 0.',
  choices: [
    { k: 'bt', label: 'Bài toán', options: [['inc', 'Vật trượt trên mặt phẳng nghiêng có ma sát'], ['pull', 'Kéo vật trên sàn ngang bằng lực F chếch góc β'], ['atw', 'Vật m₁ trên bàn nối vật m₂ treo qua ròng rọc']], def: 'inc', string: true },
  ],
  params: [
    { k: 'm1', label: 'Khối lượng vật m (m₁)', unit: 'kg', min: 1, max: 6, step: 0.5, def: 2, dec: 1 },
    { k: 'mu', label: 'Hệ số ma sát μ', min: 0, max: 0.6, step: 0.05, def: 0.2, dec: 2 },
    { k: 'alpha', label: 'Góc nghiêng α', unit: '°', min: 10, max: 45, step: 1, def: 30, dec: 0, show: (p) => p.bt === 'inc' },
    { k: 'F', label: 'Lực kéo F', unit: 'N', min: 0, max: 30, step: 0.5, def: 15, dec: 1, show: (p) => p.bt === 'pull' },
    { k: 'beta', label: 'Góc β của lực kéo', unit: '°', min: 0, max: 50, step: 5, def: 30, dec: 0, show: (p) => p.bt === 'pull' },
    { k: 'm2', label: 'Khối lượng vật treo m₂', unit: 'kg', min: 0.5, max: 5, step: 0.5, def: 2, dec: 1, show: (p) => p.bt === 'atw' },
  ],
  onParam: (p) => clampPull(p),
  onChoice: (p) => clampPull(p),
  toggles: [{ k: 'vec', label: 'Hiện các lực', def: true }, { k: 'axes', label: 'Hiện hệ trục và thành phần lực', def: false }],
  stageHeight: 280,
  ariaLabel: 'Hình minh họa bài toán động lực học với các vector lực và hệ trục tọa độ',
  duration: (p) => phys.duration(p),
  state: (p, t) => { const a = phys.solve(p).a; return { a, x: 0.5 * a * t * t, v: a * t }; },
  readouts: (p, s) => [['x', fmt(s.x, 2) + ' m'], ['v', fmt(s.v, 2) + ' m/s']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const r = phys.solve(p), m = p.m1;
    text(ctx, r.moving ? 'Vật chuyển động' : 'Vật đứng yên', w - 10, 20, { color: r.moving ? th.bad : th.ok, align: 'right', bold: true, size: 14 });
    const lab = (s2, x, y, c, al = 'left') => text(ctx, s2, x, y, { color: c, size: 12, bold: true, align: al });
    if (p.bt === 'inc') {
      const a = p.alpha * DEG, Lb = Math.min(w - 50, (h - 60) / 0.8, 400), x0 = 24, yg = h - 26, ppm = (Lb - 100) / SMAX, d0 = Lb - 40;
      ground(ctx, 10, w - 10, yg, th, 8);
      ctx.save(); ctx.translate(x0, yg); ctx.rotate(-a); rect(ctx, 0, -6, Lb, 6, th.axis, null, 2);
      const d = d0 - s.x * ppm; rect(ctx, d - 28, -36, 56, 30, th.car, null, 4);
      text(ctx, fmt(m, 1) + ' kg', d - 26, -10, { color: '#fff', bold: true, size: 10 }); ctx.restore();
      ctx.save(); ctx.strokeStyle = th.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x0, yg, 40, -a, 0); ctx.stroke(); ctx.restore();
      text(ctx, 'α = ' + p.alpha + '°', x0 + 4, yg + 18, { color: th.accent, bold: true, size: 12 });
      // vị trí tâm khối
      const bx = x0 + Math.cos(a) * d - Math.sin(a) * 21, by = yg - Math.sin(a) * d - Math.cos(a) * 21, k = 40 / (m * G);
      const ux = Math.cos(a), uy = -Math.sin(a), nx = -Math.sin(a), ny = -Math.cos(a);
      if (tg.axes) {
        line(ctx, bx, by, bx - ux * 62, by - uy * 62, th.muted, 1, [4, 3]); lab('x', bx - ux * 66, by - uy * 66 + 4, th.muted, 'right');
        line(ctx, bx, by, bx + nx * 62, by + ny * 62, th.muted, 1, [4, 3]); lab('y', bx + nx * 66, by + ny * 66, th.muted, 'right');
        const Px = m * G * Math.sin(a) * k, Py = m * G * Math.cos(a) * k;
        line(ctx, bx, by, bx - ux * Px, by - uy * Px, th.ink, 1.5, [2, 3]); lab('Px', bx - ux * Px - 2, by - uy * Px + 14, th.ink, 'right');
        line(ctx, bx, by, bx - nx * Py, by - ny * Py, th.ink, 1.5, [2, 3]); lab('Py', bx - nx * Py + 4, by - ny * Py + 12, th.ink);
      }
      if (tg.vec) {
        arrow(ctx, bx, by, bx, by + m * G * k, th.ink, 2.5); lab('P', bx + 6, by + m * G * k, th.ink);
        arrow(ctx, bx, by, bx + nx * r.N * k, by + ny * r.N * k, th.ok, 2.5); lab('N', bx + nx * r.N * k - 6, by + ny * r.N * k, th.ok, 'right');
        if (r.fms > 0.05) { arrow(ctx, bx, by, bx + ux * r.fms * k, by + uy * r.fms * k, th.bad, 2.5); lab('Fms', bx + ux * r.fms * k + 5, by + uy * r.fms * k - 3, th.bad); }
      }
    } else if (p.bt === 'pull') {
      const yg = h - 40, ppm = Math.min(300, (w - 24 - 64 - 90) / SMAX), bx = 24 + s.x * ppm, cx = bx + 32, cy = yg - 19, k = 40 / (m * G), be = p.beta * DEG;
      ground(ctx, 10, w - 10, yg, th, 8);
      rect(ctx, bx, yg - 38, 64, 38, th.car, null, 4);
      text(ctx, fmt(m, 1) + ' kg', bx + 4, yg - 6, { color: '#fff', bold: true, size: 10 });
      line(ctx, 24, yg - 44, 24, yg, th.muted, 1, [3, 3]);
      if (tg.axes) {
        line(ctx, cx, cy, cx + 80, cy, th.muted, 1, [4, 3]); lab('x', cx + 84, cy + 4, th.muted);
        line(ctx, cx, cy, cx, cy - 70, th.muted, 1, [4, 3]); lab('y', cx + 5, cy - 70, th.muted);
        const Fx = p.F * Math.cos(be) * k, Fy = p.F * Math.sin(be) * k;
        line(ctx, cx, cy - Fy, cx + Fx, cy - Fy, th.accent, 1, [2, 3]); line(ctx, cx + Fx, cy - Fy, cx + Fx, cy, th.accent, 1, [2, 3]);
        lab('Fx', cx + Fx / 2, cy + 14, th.accent, 'center'); lab('Fy', cx + Fx + 4, cy - Fy / 2, th.accent);
      }
      if (tg.vec) {
        arrow(ctx, cx, cy, cx, cy + m * G * k, th.ink, 2.5); lab('P', cx + 6, cy + m * G * k + 2, th.ink);
        if (r.N * k > 2) { arrow(ctx, cx, cy, cx, cy - r.N * k, th.ok, 2.5); lab('N', cx + 6, cy - r.N * k + 10, th.ok); }
        if (p.F > 0.05) { arrow(ctx, cx, cy, cx + p.F * Math.cos(be) * k, cy - p.F * Math.sin(be) * k, th.accent, 2.5); lab('F', cx + p.F * Math.cos(be) * k + 4, cy - p.F * Math.sin(be) * k - 4, th.accent); }
        if (r.fms > 0.05) { arrow(ctx, cx, cy, cx - r.fms * k, cy, th.bad, 2.5); lab('Fms', cx - r.fms * k - 3, cy - 6, th.bad, 'right'); }
      }
      text(ctx, 'β = ' + p.beta + '°', w - 10, 40, { color: th.accent, align: 'right', size: 12, bold: true });
    } else {
      const yt = 96, xp = w - 56, ppm = Math.min(60, (xp - 24 - 44 - 30) / SMAX, (h - yt - 110) / SMAX), m2 = p.m2;
      const k = 30 / (Math.max(m, m2) * G), b1 = 24 + s.x * ppm, y1 = yt - 36, c1x = b1 + 28, c1y = yt - 18;
      line(ctx, 10, yt, xp, yt, th.axis, 3); line(ctx, 10, yt, 10, yt + 8, th.axis, 3);
      circle(ctx, xp, yt - 10, 10, th.card, th.axis); circle(ctx, xp, yt - 10, 2, th.axis);
      const ry = yt + 42 + s.x * ppm;                      // đỉnh vật m₂
      line(ctx, xp + 10, yt - 10, xp + 10, ry, th.ink, 1.5); line(ctx, c1x + 28, c1y, xp, yt - 20, th.ink, 1.5);
      line(ctx, xp, yt - 20, xp + 10, yt - 20, th.ink, 1.5); line(ctx, xp + 10, yt - 20, xp + 10, yt - 10, th.ink, 1.5);
      rect(ctx, b1, y1, 56, 36, th.car, null, 4); text(ctx, fmt(m, 1) + ' kg', b1 + 3, yt - 4, { color: '#fff', bold: true, size: 10 });
      rect(ctx, xp + 10 - 26, ry, 52, 32, th.s3, null, 4); text(ctx, fmt(m2, 1) + ' kg', xp - 13, ry + 28, { color: '#fff', bold: true, size: 10 });
      const c2x = xp + 10, c2y = ry + 16;
      if (tg.axes) { line(ctx, c1x, c1y, c1x + 70, c1y, th.muted, 1, [4, 3]); lab('x₁', c1x + 74, c1y + 4, th.muted); line(ctx, c2x - 36, c2y, c2x - 36, c2y + 50, th.muted, 1, [4, 3]); lab('x₂', c2x - 40, c2y + 60, th.muted, 'center'); }
      if (tg.vec) {
        arrow(ctx, c1x, c1y, c1x, c1y + m * G * k, th.ink, 2.5); lab('P₁', c1x + 5, c1y + m * G * k + 2, th.ink);
        arrow(ctx, c1x, c1y, c1x, c1y - r.N * k, th.ok, 2.5); lab('N', c1x + 5, c1y - r.N * k + 8, th.ok);
        arrow(ctx, c1x, c1y, c1x + r.X * k, c1y, th.accent, 2.5); lab('T', c1x + r.X * k - 2, c1y - 6, th.accent);
        if (r.fms > 0.05 && r.moving) { arrow(ctx, c1x, c1y, c1x - r.fms * k, c1y, th.bad, 2.5); lab('Fms', c1x - r.fms * k - 3, c1y - 6, th.bad, 'right'); }
        arrow(ctx, c2x, c2y, c2x, c2y + m2 * G * k, th.ink, 2.5); lab('P₂', c2x + 5, c2y + m2 * G * k, th.ink);
        arrow(ctx, c2x, c2y, c2x, c2y - r.X * k, th.accent, 2.5); lab('T', c2x + 6, c2y - r.X * k + 10, th.accent);
      }
    }
  },
  columns: [{ k: 't', label: 't', unit: 's', dec: 2 }, { k: 'x', label: 'x', unit: 'm', dec: 3 }, { k: 'v', label: 'v', unit: 'm/s', dec: 2 }],
  recordLabel: 'Ghi số liệu (t, x, v)',
  note: 'Đồng hồ sai số khoảng 0,02 s, thước chia đến 1 mm, cổng quang đọc v với sai số khoảng 0,03 m/s.',
  record: (p, s, t, n) => ({ t: n.round(t + n.noise(0.02), 0.01), x: n.round(s.x + n.noise(0.004), 0.001), v: n.round(s.v + n.noise(0.03), 0.01) }),
  graphs: [
    { title: 'Đồ thị x – t', xlabel: 't (s)', ylabel: 'x (m)', x: 't', y: 'x', zeroX: true, zeroY: true, curve: (p) => { const a = phys.solve(p).a, T = phys.duration(p); return Array.from({ length: 41 }, (_, i) => [(T * i) / 40, 0.5 * a * ((T * i) / 40) ** 2]); }, marker: (p, s, t) => [t, s.x] },
    { title: 'Đồ thị v – t', xlabel: 't (s)', ylabel: 'v (m/s)', x: 't', y: 'v', fit: 'origin', dec: 3, zeroX: true, zeroY: true, curve: (p) => { const a = phys.solve(p).a, T = phys.duration(p); return [[0, 0], [T, a * T]]; }, marker: (p, s, t) => [t, s.v] },
  ],
  predict: {
    prompt: '<p>Giải bài toán với số liệu đang đặt (đọc ở các thanh trượt): tìm <b>gia tốc a</b> và <b>lực thứ hai</b>: phản lực N (mặt phẳng nghiêng, kéo chếch) hoặc lực căng dây T (hai vật nối nhau). Nếu vật đứng yên thì a = 0.</p>',
    fields: [{ k: 'a', label: 'Gia tốc a', unit: 'm/s²' }, { k: 'X', label: 'Phản lực N hoặc lực căng T', unit: 'N' }],
    expected: (p) => { const r = phys.solve(p); return { a: r.a, X: r.X }; }, tol: 0.02, absTol: 0.03,
    explain: (p) => { const r = phys.solve(p); return r.moving ? STEPS[p.bt](p, r) : 'Lực kéo (hoặc thành phần trọng lực) không vượt quá ma sát nghỉ cực đại nên vật đứng yên: a = 0.'; },
  },
  tasks: [{
    title: 'Đối chiếu lời giải với mô phỏng',
    prompt: '<p>Chạy mô phỏng và ghi ít nhất 5 lần đo. Vật xuất phát từ nghỉ nên đồ thị v – t là đường thẳng qua gốc, <b>gia tốc đo được là độ dốc</b>. Tính độ lệch tương đối giữa gia tốc đo được và gia tốc em tính ở bước trên: δ = |a<sub>đo</sub> − a<sub>tính</sub>|/a<sub>tính</sub>·100%.</p>',
    fields: [{ k: 'a', label: 'Gia tốc đo được từ đồ thị', unit: 'm/s²', dec: 2, absTol: 0.03 }, { k: 'dev', label: 'Độ lệch δ', unit: '%', dec: 1, absTol: 0.8 }],
    minRows: 5, tol: 0.03,
    need: (rows, p) => (!phys.solve(p).moving ? 'Với số liệu này vật đứng yên (a = 0). Hãy đổi số liệu để vật chuyển động rồi ghi lại.' : rows.length < 5 ? 'Cần ghi ít nhất 5 lần đo ở phần thí nghiệm.' : null),
    expected(p, rows) {
      let sv = 0, ss = 0; for (const r of rows) { sv += r.t * r.v; ss += r.t * r.t; }
      const a = sv / ss, at = phys.solve(p).a; return { a, dev: (Math.abs(a - at) / at) * 100 };
    },
    explain: () => 'Độ lệch nhỏ (vài %) cho thấy lời giải đúng; lệch lớn thường do chọn sai chiều trục, thiếu lực hoặc phân tích lực sai.',
    reference: (p) => `Gia tốc tính theo phương trình Newton: a = ${fmt(phys.solve(p).a, 2)} m/s².`,
  }],
  quiz: [
    { q: 'Vật 2 kg trên mặt phẳng nghiêng 30°, không ma sát. Gia tốc của vật là:', o: ['4,9 m/s²', '8,5 m/s²', '9,8 m/s²'], a: 0, why: 'a = g·sin30° = 9,8·0,5 = 4,9 m/s².' },
    { q: 'Kéo vật trên sàn ngang bằng lực F chếch lên góc β. Phản lực N của sàn bằng:', o: ['mg', 'mg − F·sinβ', 'mg + F·sinβ'], a: 1, why: 'Oy: N + F·sinβ − P = 0 nên N = mg − F·sinβ.' },
    { q: 'Hai vật m₁ = 1 kg (trên bàn nhẵn) và m₂ = 1 kg (treo) nối qua ròng rọc. Gia tốc là:', o: ['9,8 m/s²', '4,9 m/s²', '2,45 m/s²'], a: 1, why: 'a = m₂g/(m₁ + m₂) = 9,8/2 = 4,9 m/s².' },
    { q: 'Khi chọn hệ trục để giải bài toán, nên chọn một trục:', o: ['vuông góc với gia tốc', 'cùng phương, chiều với gia tốc', 'bất kì, không ảnh hưởng gì'], a: 1, why: 'Khi đó phương trình theo trục kia có a = 0, việc giải đơn giản hơn.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

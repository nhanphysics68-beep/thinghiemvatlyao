// Vật lí 10 – Bài 28: Động lượng (p = mv; xung của lực F·Δt = Δp).
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, ground, circle, rect, line } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
// Quy ước chiều dương: chiều chuyển động ban đầu của bóng (hướng tới tường / hướng cú đá).
export const TA = 1.2, TCON = 0.5, TB = 1.2;            // thời gian hiển thị (s): bay tới, va chạm (làm chậm), bay ra
export const phys = {
  momentum: (m, v) => m * v,                               // p = m·v
  // Va chạm: tốc độ trước/sau, độ biến thiên động lượng, lực trung bình, lực cực đại (xung dạng nửa sin).
  impact(p) {
    const dt = p.dt / 1000;
    const v1 = p.mode === 'wall' ? p.v : 0;
    const v2 = p.mode === 'wall' ? p.e * p.v : p.v;
    const dp = p.m * (v1 + v2);                            // độ lớn Δp (hai vận tốc ngược chiều khi đập tường)
    const F = dp / dt;                                     // lực trung bình: F = Δp/Δt
    return { m: p.m, v1, v2, dp, dt, F, Fpk: (Math.PI / 2) * F };
  },
  pulse: (im, tau) => (tau < 0 || tau > im.dt ? 0 : im.Fpk * Math.sin((Math.PI * tau) / im.dt)),
  // Phần xung lực đã truyền sau thời gian tau (0..1): ∫F dt / (F·Δt) = (1 − cos(πτ/Δt))/2.
  impulseFrac: (im, tau) => (1 - Math.cos((Math.PI * Math.min(Math.max(tau, 0), im.dt)) / im.dt)) / 2,
  // Vận tốc có dấu của bóng theo thời gian hiển thị t.
  velocity(p, t) {
    const im = phys.impact(p), sgn = p.mode === 'wall' ? -1 : 1;
    const vb = im.v1, tc0 = TA, tc1 = TA + TCON;
    if (t <= tc0) return { v: vb, tau: 0, phase: 'before', im };
    const tau = Math.min(1, (t - tc0) / TCON) * im.dt;
    const frac = phys.impulseFrac(im, tau);
    const v = vb + sgn * (im.dp / p.m) * frac;
    return { v, tau, phase: t < tc1 ? 'contact' : 'after', im };
  },
};

const T_TOTAL = TA + TCON + TB;
const VSCALE = 20;                                           // v lớn nhất của thanh trượt (m/s)

export const spec = {
  seed: 2828,
  intro: 'Một quả bóng đập vào tường hoặc bị đá. Cảm biến đo tốc độ trước và sau va chạm, còn cảm biến lực đo lực trung bình và thời gian va chạm Δt. Em sẽ kiểm tra xung của lực bằng độ biến thiên động lượng.',
  goals: [
    'Tính động lượng p = mv và nhận biết đây là đại lượng vectơ cùng hướng với vận tốc.',
    'Vận dụng định lí xung lượng: F·Δt = Δp = p₂ − p₁.',
    'Giải thích vì sao kéo dài thời gian va chạm Δt thì lực tác dụng giảm.',
  ],
  theory: 'p = m·v &nbsp;&nbsp; Δp = p₂ − p₁ = m(v₂ − v₁) &nbsp;&nbsp; F·Δt = Δp &nbsp;&nbsp; (xung của lực = độ biến thiên động lượng)<br>Đơn vị: p [kg·m/s]; xung lực [N·s] = [kg·m/s].',
  setup: 'Chọn tình huống: bóng đập tường (bóng bật ngược lại) hoặc cú đá (bóng đứng yên bị đá bay đi). Chiều dương là chiều chuyển động ban đầu của bóng, nên khi đập tường vận tốc sau mang dấu âm và Δp = m(v₁ + v₂) về độ lớn.',
  choices: [{ k: 'mode', label: 'Tình huống', string: true, def: 'wall', options: [['wall', 'Bóng đập vào tường'], ['kick', 'Cú đá vào bóng đứng yên']] }],
  params: [
    { k: 'm', label: 'Khối lượng bóng m', unit: 'kg', min: 0.05, max: 0.6, step: 0.01, def: 0.4, dec: 2 },
    { k: 'v', label: 'Tốc độ của bóng', unit: 'm/s', min: 2, max: 20, step: 1, def: 10, dec: 0 },
    { k: 'e', label: 'Hệ số bật lại e (v₂ = e·v₁)', unit: '', min: 0, max: 1, step: 0.05, def: 0.8, dec: 2, show: (p) => p.mode === 'wall' },
    { k: 'dt', label: 'Thời gian va chạm Δt', unit: 'ms', min: 3, max: 30, step: 1, def: 10, dec: 0 },
  ],
  onChoice(p) {
    if (p.mode === 'wall') Object.assign(p, { m: 0.4, v: 10, e: 0.8, dt: 10 });
    else Object.assign(p, { m: 0.43, v: 20, dt: 10 });
  },
  toggles: [{ k: 'vec', label: 'Hiện vectơ vận tốc và lực', def: true }],
  stageHeight: 300,
  ariaLabel: 'Quả bóng va chạm với tường hoặc bị đá, kèm đồ thị lực theo thời gian trong lúc va chạm',
  duration: () => T_TOTAL,
  state(p, t) {
    const { v, tau, phase, im } = phys.velocity(p, t);
    const u = phase === 'contact' ? (t - TA) / TCON : phase === 'after' ? 1 : 0;
    return { v, tau, phase, u, p: p.m * v, F: (p.mode === 'wall' ? -1 : 1) * phys.pulse(im, tau), im, frac: phys.impulseFrac(im, tau) };
  },
  readouts: (p, s) => [['v', fmt(s.v, 2) + ' m/s'], ['p', fmt(s.p, 2) + ' kg·m/s'], ['F', fmt(s.F, 0) + ' N']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const wall = p.mode === 'wall', im = s.im;
    const plotH = 112, sceneH = h - plotH, yg = sceneH - 26, R = 15;
    ground(ctx, 8, w - 8, yg, th);
    // --- vị trí (tỉ lệ hiển thị, không theo tỉ lệ thật vì Δt rất ngắn)
    let bx, rx = R, ry = R, fx = null;
    if (wall) {
      const xw = w - 36, L = xw - 40 - 2 * R;
      let g;
      if (t <= TA) g = 1 - t / TA; else if (t <= TA + TCON) g = 0; else g = p.e * ((t - TA - TCON) / TB);
      const sq = Math.sin(Math.PI * s.u); rx = R * (1 - 0.32 * sq); ry = R * (1 + 0.1 * sq);
      bx = xw - rx - g * L;
      rect(ctx, xw, yg - 92, 14, 92, th.muted, null, 2);
      for (let y = yg - 88; y < yg; y += 12) line(ctx, xw, y + 8, xw + 14, y, th.card, 1);
      text(ctx, 'tường', xw + 7, yg - 98, { color: th.muted, size: 11, align: 'center' });
    } else {
      const x0 = Math.max(70, 0.3 * w), sq = Math.sin(Math.PI * s.u);
      rx = R * (1 - 0.3 * sq); ry = R * (1 + 0.1 * sq);
      const travel = 0.58 * w * (p.v / VSCALE) + 0.08 * w;
      const k = t <= TA + TCON ? 0 : (t - TA - TCON) / TB;
      bx = x0 + travel * k;
      const Lf = 0.2 * w;
      fx = (t <= TA ? x0 - R - Lf * (1 - t / TA) : bx - rx - 16 * Math.min(1, k * 2)) - 0;
      rect(ctx, fx - 36, yg - 20, 36, 20, th.s3, null, 8);
      text(ctx, 'chân', fx - 18, yg - 26, { color: th.muted, size: 11, align: 'center' });
    }
    ctx.save(); ctx.beginPath(); ctx.ellipse(bx, yg - ry, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = th.accent; ctx.fill(); ctx.restore();
    // --- vectơ
    if (tg.vec) {
      const kv = (0.22 * w) / VSCALE, yv = yg - 2 * R - 16;
      if (Math.abs(s.v) > 0.05 && s.phase !== 'contact') {
        arrow(ctx, bx, yv, bx + s.v * kv, yv, th.s2, 3);
        text(ctx, 'v', bx + s.v * kv + (s.v > 0 ? 6 : -6), yv - 5, { color: th.s2, size: 13, align: s.v > 0 ? 'left' : 'right', bold: true });
      }
      if (s.phase === 'contact' && im.Fpk > 0) {
        const len = 12 + 38 * (Math.abs(s.F) / im.Fpk), dir = s.F >= 0 ? 1 : -1, yf = yg - R;
        arrow(ctx, bx, yf, bx + dir * len, yf, th.bad, 3);
        text(ctx, 'F', bx + dir * len + dir * 6, yf - 4, { color: th.bad, size: 13, align: dir > 0 ? 'left' : 'right', bold: true });
      }
    }
    text(ctx, s.phase === 'before' ? (wall ? 'Trước va chạm' : 'Bóng đứng yên, chân đang tới') : s.phase === 'contact' ? 'Đang va chạm (làm chậm hàng trăm lần)' : 'Sau va chạm', 10, 18, { color: th.muted, size: 12 });
    // --- đồ thị F theo thời gian trong va chạm (xung = diện tích)
    const px = 14, pw = w - 2 * px, pTop = sceneH + 40, ph = 48, pBot = pTop + ph;
    text(ctx, 'Lực lên bóng khi va chạm (diện tích = xung F·Δt)', px, sceneH + 12, { color: th.muted, size: 11 });
    line(ctx, px, pBot, px + pw, pBot, th.axis, 1.5); line(ctx, px, pTop - 4, px, pBot, th.axis, 1.5);
    const X = (tau) => px + 4 + (tau / im.dt) * (pw - 12), Y = (f) => pBot - (f / im.Fpk) * ph;
    const N = 48;
    ctx.save(); ctx.beginPath(); ctx.moveTo(X(0), pBot);
    const upto = s.phase === 'before' ? 0 : s.tau;
    for (let i = 0; i <= N; i++) { const tau = (i / N) * upto; ctx.lineTo(X(tau), Y(phys.pulse(im, tau))); }
    ctx.lineTo(X(upto), pBot); ctx.closePath(); ctx.fillStyle = th.soft; ctx.fill(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.strokeStyle = th.accent; ctx.lineWidth = 2;
    for (let i = 0; i <= N; i++) { const tau = (i / N) * im.dt; ctx[i ? 'lineTo' : 'moveTo'](X(tau), Y(phys.pulse(im, tau))); }
    ctx.stroke(); ctx.restore();
    line(ctx, X(0), Y(im.F), X(im.dt), Y(im.F), th.s3, 1.5, [5, 4]);
    text(ctx, `F tb = ${fmt(im.F, 0)} N`, px + pw / 2, Y(im.F) + 14, { color: th.s3, size: 11, align: 'center' });
    text(ctx, `F max = ${fmt(im.Fpk, 0)} N`, px + pw - 2, pTop - 8, { color: th.accent, size: 11, align: 'right' });
    text(ctx, '0', px + 4, pBot + 13, { color: th.muted, size: 11, align: 'center' });
    text(ctx, `Δt = ${fmt(p.dt, 0)} ms`, px + pw - 2, pBot + 13, { color: th.muted, size: 11, align: 'right' });
    if (s.phase === 'contact') circle(ctx, X(s.tau), Y(phys.pulse(im, s.tau)), 4.5, th.bad);
  },
  columns: [
    { k: 'm', label: 'm', unit: 'kg', dec: 3 }, { k: 'v1', label: 'v₁ trước', unit: 'm/s', dec: 2 },
    { k: 'v2', label: 'v₂ sau', unit: 'm/s', dec: 2 }, { k: 'dt', label: 'Δt', unit: 'ms', dec: 1 }, { k: 'F', label: 'F tb', unit: 'N', dec: 1 },
  ],
  recordLabel: 'Ghi một lần va chạm',
  note: 'Mỗi lần ghi là một lần va chạm mới: cảm biến tốc độ đọc v (độ chia 0,01 m/s, sai số khoảng 0,03 m/s), cảm biến lực–thời gian cho F tb và Δt (sai số khoảng 1,5 % và 0,1 ms). v₁ và v₂ ghi ở dạng độ lớn. Đồ thị bên dưới tự tính Δp = m(v₁ + v₂) và F·Δt từ số liệu của em.',
  record(p, s, t, n) {
    const im = s.im, v1 = im.v1 === 0 ? 0 : n.round(im.v1 + n.noise(0.03), 0.01);
    const v2 = n.round(im.v2 + n.noise(0.03), 0.01), dt = n.round(p.dt + n.noise(0.1), 0.1);
    const F = n.round(im.F * (1 + n.noise(0.015)), 0.1), m = n.round(p.m, 0.001);
    return { m, v1, v2, dt, F, dp: Math.round(m * (v1 + v2) * 1e5) / 1e5, J: Math.round(F * (dt / 1000) * 1e5) / 1e5 };
  },
  graphs: [
    {
      title: 'Độ biến thiên động lượng theo xung lực', xlabel: 'F·Δt (N·s)', ylabel: 'Δp (kg·m/s)', x: 'J', y: 'dp', fit: 'origin', zeroX: true, zeroY: true, dec: 3,
      curve: (p) => { const d = phys.impact(p).dp * 1.5; return [[0, 0], [d, d]]; },
    },
    {
      title: 'Lực trung bình theo thời gian va chạm', xlabel: 'Δt (ms)', ylabel: 'F tb (N)', x: 'dt', y: 'F', zeroX: true, zeroY: true,
      curve: (p) => { const dp = phys.impact(p).dp; return Array.from({ length: 28 }, (_, i) => [3 + i, dp / ((3 + i) / 1000)]); },
      marker: (p) => [p.dt, phys.impact(p).F],
    },
  ],
  predict: {
    prompt: '<p>Với khối lượng, tốc độ và Δt đang chọn, hãy dự đoán <b>độ lớn Δp</b> của bóng và <b>lực trung bình F</b> tác dụng lên bóng trong lúc va chạm. (Gợi ý: ở tình huống đập tường, hai vận tốc ngược chiều nhau.)</p>',
    fields: [{ k: 'dp', label: 'Δp', unit: 'kg·m/s', dec: 2 }, { k: 'F', label: 'F tb', unit: 'N', dec: 0 }],
    expected: (p) => { const im = phys.impact(p); return { dp: im.dp, F: im.F }; }, tol: 0.02, absTol: 0.02,
    explain: (p) => { const im = phys.impact(p); return `Δp = m(v₁ + v₂) = ${fmt(p.m, 2)}·(${fmt(im.v1, 2)} + ${fmt(im.v2, 2)}) = ${fmt(im.dp, 2)} kg·m/s; F = Δp/Δt = ${fmt(im.dp, 2)}/${fmt(im.dt, 3)} = ${fmt(im.F, 0)} N.`; },
  },
  tasks: [{
    title: 'Xử lí số liệu: kiểm tra định lí xung lượng',
    prompt: '<p>Ghi ít nhất 5 lần va chạm với các giá trị m, v, Δt khác nhau. Với <b>lần ghi cuối cùng</b>, tính Δp = m(v₁ + v₂) và xung của lực F·Δt (nhớ đổi Δt sang giây). Sau đó đọc <b>độ dốc k</b> của đường khớp qua gốc trong đồ thị “Δp theo F·Δt”: nếu định lí đúng thì k ≈ 1.</p>',
    fields: [{ k: 'dp', label: 'Δp (lần cuối)', unit: 'kg·m/s', dec: 3 }, { k: 'J', label: 'F·Δt (lần cuối)', unit: 'N·s', dec: 3 }, { k: 'k', label: 'Độ dốc k', unit: '', dec: 3 }],
    minRows: 5, tol: 0.03, absTol: 0.005,
    expected(p, rows) {
      const last = rows[rows.length - 1]; let sxy = 0, sxx = 0;
      for (const r of rows) { sxy += r.J * r.dp; sxx += r.J * r.J; }
      return { dp: last.m * (last.v1 + last.v2), J: last.F * (last.dt / 1000), k: sxy / sxx };
    },
    explain: () => 'Hai đại lượng Δp và F·Δt bằng nhau trong phạm vi sai số đo: k ≈ 1, nghĩa là xung của lực bằng độ biến thiên động lượng.',
    reference: (p) => { const im = phys.impact(p); return `Giá trị chuẩn trong mô phỏng với thông số hiện tại: Δp = ${fmt(im.dp, 3)} kg·m/s, F tb = ${fmt(im.F, 1)} N, Δt = ${fmt(p.dt, 0)} ms.`; },
  }],
  quiz: [
    { q: 'Ô tô khối lượng 1000 kg chạy với tốc độ 72 km/h có động lượng:', o: ['2,0×10⁴ kg·m/s', '7,2×10⁴ kg·m/s', '2,0×10³ kg·m/s'], a: 0, why: '72 km/h = 20 m/s nên p = 1000·20 = 2,0×10⁴ kg·m/s.' },
    { q: 'Bóng 0,5 kg tới tường với tốc độ 6 m/s và bật ngược lại với tốc độ 6 m/s. Độ lớn Δp của bóng là:', o: ['0 kg·m/s', '3 kg·m/s', '6 kg·m/s'], a: 2, why: 'Chọn chiều dương hướng tới tường: Δp = 0,5·(−6) − 0,5·(6) = −6 kg·m/s, độ lớn 6 kg·m/s.' },
    { q: 'Với quả bóng ở câu trên, thời gian va chạm 0,02 s thì lực trung bình của tường tác dụng lên bóng có độ lớn:', o: ['3 N', '300 N', '120 N'], a: 1, why: 'F = Δp/Δt = 6/0,02 = 300 N.' },
    { q: 'Khi nhảy từ cao xuống, người ta gập chân khi chạm đất để:', o: ['tăng thời gian chạm đất nên lực tác dụng lên chân giảm', 'tăng động lượng của người', 'giảm khối lượng của người'], a: 0, why: 'Δp không đổi; Δt tăng thì F = Δp/Δt giảm.' },
    { q: 'Đơn vị nào sau đây tương đương với N·s?', o: ['kg·m/s', 'kg·m/s²', 'J'], a: 0, why: 'N·s = (kg·m/s²)·s = kg·m/s, là đơn vị của động lượng.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

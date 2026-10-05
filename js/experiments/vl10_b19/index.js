// Vật lí 10 – Bài 19: Lực cản và lực nâng (vật rơi trong chất lưu, vận tốc giới hạn).
import { mountLab } from '../../core/lab.js';
import { fmt, linearFit } from '../../core/stats.js';
import { arrow, text, rect, circle, line } from '../../core/draw.js';

const G = 9.8;
const lncosh = (x) => { const u = Math.abs(x); return u + Math.log1p(Math.exp(-2 * u)) - Math.LN2; };

// ---- Vật lí (hàm thuần) ----
// law = 'lin': F = b·v ; law = 'quad': F = c·v²   (k = b hoặc c)
export const phys = {
  G,
  coef: (p) => (p.law === 'lin' ? p.b : p.c),
  vt: (p) => (p.law === 'lin' ? (p.m * G) / p.b : Math.sqrt((p.m * G) / p.c)),
  tau: (p) => (p.law === 'lin' ? p.m / p.b : phys.vt(p) / G),
  v(p, t) { const vt = phys.vt(p); return p.law === 'lin' ? vt * (1 - Math.exp(-t / phys.tau(p))) : vt * Math.tanh((G * t) / vt); },
  y(p, t) {
    const vt = phys.vt(p), tau = phys.tau(p);
    return p.law === 'lin' ? vt * (t - tau * (1 - Math.exp(-t / tau))) : ((vt * vt) / G) * lncosh((G * t) / vt);
  },
  drag: (p, v) => (p.law === 'lin' ? p.b * v : p.c * v * v),
  a: (p, v) => G - phys.drag(p, v) / p.m,
  duration: (p) => Math.min(15, Math.max(3, 4 * phys.tau(p))),
};

export const spec = {
  seed: 1919,
  intro: 'Thả một vật nặng rơi trong chất lưu (chất lỏng nhớt hoặc không khí). Em sẽ quan sát lực cản tăng dần theo vận tốc, làm vật chuyển động nhanh dần chậm lại rồi đạt vận tốc giới hạn.',
  goals: [
    'Nhận biết lực cản của chất lưu luôn ngược chiều chuyển động và tăng khi vận tốc tăng.',
    'Giải thích vì sao vật đạt vận tốc giới hạn vt khi lực cản cân bằng trọng lực.',
    'Xác định vt và hệ số cản từ đồ thị gia tốc a – v hoặc a – v².',
  ],
  theory: 'Phương trình Newton: m·a = mg − F<sub>C</sub> &nbsp;&nbsp; Lực cản nhỏ: F<sub>C</sub> = b·v &nbsp;&nbsp; Lực cản lớn: F<sub>C</sub> = c·v²<br>Vận tốc giới hạn khi a = 0: F<sub>C</sub> = mg → v<sub>t</sub> = mg/b hoặc v<sub>t</sub> = √(mg/c). Lấy g = 9,8 m/s². Lực nâng (ví dụ cánh máy bay) cũng do chất lưu tác dụng khi vật chuyển động tương đối so với chất lưu.',
  setup: 'Chọn quy luật lực cản, khối lượng và hệ số cản rồi bấm “Chạy”. Ghi các giá trị t, v, a ở nhiều thời điểm (đồng hồ, tốc kế và gia tốc kế).',
  choices: [
    { k: 'law', label: 'Loại lực cản', options: [['lin', 'Chất lỏng nhớt: F = b·v'], ['quad', 'Không khí, vật lớn: F = c·v²']], def: 'lin', string: true },
  ],
  params: [
    { k: 'm', label: 'Khối lượng vật m', unit: 'kg', min: 0.1, max: 2, step: 0.1, def: 0.5, dec: 1 },
    { k: 'b', label: 'Hệ số cản b', unit: 'kg/s', min: 0.5, max: 4, step: 0.1, def: 1, dec: 1, show: (p) => p.law === 'lin' },
    { k: 'c', label: 'Hệ số cản c', unit: 'kg/m', min: 0.02, max: 0.5, step: 0.01, def: 0.1, dec: 2, show: (p) => p.law === 'quad' },
  ],
  toggles: [{ k: 'vec', label: 'Hiện lực', def: true }, { k: 'trail', label: 'Hiện các vị trí cách đều thời gian', def: true }],
  stageHeight: 320,
  ariaLabel: 'Quả cầu rơi trong cột chất lưu, có thước độ sâu, vector trọng lực và lực cản',
  duration: (p) => phys.duration(p),
  state(p, t) { const v = phys.v(p, t); return { v, y: phys.y(p, t), a: phys.a(p, v), Fc: phys.drag(p, v) }; },
  readouts: (p, s) => [['v', fmt(s.v, 2) + ' m/s'], ['vt', fmt(phys.vt(p), 2) + ' m/s'], ['FC', fmt(s.Fc, 2) + ' N'], ['a', fmt(s.a, 2) + ' m/s²']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const T = phys.duration(p), ymax = phys.y(p, T), top = 70, bot = h - 62, cx = Math.min(w / 2 + 20, w - 120);
    const Y = (d) => top + (d / ymax) * (bot - top);
    rect(ctx, cx - 50, 14, 100, h - 28, th.soft, th.line, 8);
    // thước độ sâu
    const steps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50], st = steps.find((q) => ymax / q <= 6) || 50;
    for (let d = 0; d <= ymax + 1e-9; d += st) {
      line(ctx, 34, Y(d), 44, Y(d), th.axis, 1.5);
      text(ctx, fmt(d, st < 1 ? 1 : 0), 30, Y(d) + 4, { color: th.muted, size: 11, align: 'right' });
    }
    line(ctx, 44, top, 44, Y(ymax), th.axis, 1.5);
    text(ctx, 'y (m)', 6, 12, { color: th.muted, size: 11 });
    if (tg.trail) for (let i = 0; i <= 20; i++) { const u = (T * i) / 20; if (u <= t + 1e-9) circle(ctx, cx - 38, Y(phys.y(p, u)), 3, th.muted); }
    const yc = Y(s.y), P = p.m * G, k = 44 / P;
    if (tg.vec) {
      arrow(ctx, cx, yc, cx, yc + P * k, th.ink, 3); text(ctx, 'P', cx + 8, yc + P * k + 4, { color: th.ink, size: 12 });
      if (s.Fc * k > 2) { arrow(ctx, cx, yc, cx, yc - s.Fc * k, th.bad, 3); text(ctx, 'FC', cx + 8, yc - s.Fc * k + 2, { color: th.bad, size: 12 }); }
    }
    circle(ctx, cx, yc, 11, th.car, th.ink);
    text(ctx, 'v = ' + fmt(s.v, 2) + ' m/s', cx + 56, yc + 4, { color: th.accent, bold: true, size: 12 });
    text(ctx, 'ΣF = ' + fmt(P - s.Fc, 2) + ' N', cx + 56, yc + 20, { color: th.muted, size: 12 });
  },
  columns: [
    { k: 't', label: 't', unit: 's', dec: 2 }, { k: 'v', label: 'v', unit: 'm/s', dec: 2 }, { k: 'a', label: 'a', unit: 'm/s²', dec: 2 }, { k: 'v2', label: 'v²', unit: 'm²/s²', dec: 2 },
  ],
  recordLabel: 'Ghi số liệu (t, v, a)',
  note: 'Mỗi lần ghi: đồng hồ sai số khoảng 0,01 s; tốc kế sai số khoảng 1% + 0,01 m/s; gia tốc kế sai số khoảng 0,08 m/s².',
  record(p, s, t, n) {
    const v = n.round(s.v + n.noise(0.01 * Math.abs(s.v) + 0.01), 0.01);
    return { t: n.round(t + n.noise(0.01), 0.01), v, a: n.round(s.a + n.noise(0.08), 0.01), v2: n.round(v * v, 0.01) };
  },
  graphs: [
    { title: 'Đồ thị v – t', xlabel: 't (s)', ylabel: 'v (m/s)', x: 't', y: 'v', zeroX: true, zeroY: true, curve: (p) => { const T = phys.duration(p); return Array.from({ length: 61 }, (_, i) => [(T * i) / 60, phys.v(p, (T * i) / 60)]); }, marker: (p, s, t) => [t, s.v] },
    { title: 'Đồ thị a – v', xlabel: 'v (m/s)', ylabel: 'a (m/s²)', x: 'v', y: 'a', fit: true, dec: 3, zeroX: true, zeroY: true, curve: (p) => { const vt = phys.vt(p); return Array.from({ length: 41 }, (_, i) => [(vt * i) / 40, phys.a(p, (vt * i) / 40)]); }, marker: (p, s) => [s.v, s.a] },
    { title: 'Đồ thị a – v²', xlabel: 'v² (m²/s²)', ylabel: 'a (m/s²)', x: 'v2', y: 'a', fit: true, dec: 4, zeroX: true, zeroY: true, curve: (p) => { const vt = phys.vt(p); return Array.from({ length: 41 }, (_, i) => { const v = (vt * i) / 40; return [v * v, phys.a(p, v)]; }); }, marker: (p, s) => [s.v * s.v, s.a] },
  ],
  predict: {
    prompt: '<p>Với khối lượng và hệ số cản đang đặt ở các thanh trượt, hãy tính <b>vận tốc giới hạn</b> vt và độ lớn lực cản khi vật đạt vận tốc đó. Sau đó chạy mô phỏng để kiểm tra.</p>',
    fields: [{ k: 'vt', label: 'Vận tốc giới hạn vt', unit: 'm/s' }, { k: 'Fc', label: 'Lực cản khi v = vt', unit: 'N' }],
    expected: (p) => ({ vt: phys.vt(p), Fc: p.m * G }), tol: 0.02, absTol: 0.03,
    explain: (p) => `Khi a = 0: F<sub>C</sub> = mg = ${fmt(p.m * G)} N. ${p.law === 'lin' ? `v<sub>t</sub> = mg/b = ${fmt(phys.vt(p))} m/s` : `v<sub>t</sub> = √(mg/c) = ${fmt(phys.vt(p))} m/s`}.`,
  },
  tasks: [{
    title: 'Xử lí số liệu: vận tốc giới hạn và hệ số cản',
    prompt: '<p>Ghi ít nhất 6 lần đo ở các thời điểm khác nhau (từ lúc thả đến lúc gần đạt vt). Đồ thị nào là đường thẳng cho biết quy luật lực cản: <b>a – v</b> (F = bv) hoặc <b>a – v²</b> (F = cv²). Với đường khớp a = A + B·x: vật đạt vt khi a = 0. Với F = bv: vt = −A/B và b = −B·m. Với F = cv²: vt = √(−A/B) và c = −B·m.</p>',
    fields: [{ k: 'vt', label: 'Vận tốc giới hạn vt', unit: 'm/s' }, { k: 'k', label: 'Hệ số cản (b theo kg/s hoặc c theo kg/m)', dec: 3, absTol: 0.005 }],
    minRows: 6, tol: 0.03,
    expected(p, rows) {
      const f = linearFit(rows.map((r) => [p.law === 'lin' ? r.v : r.v2, r.a]));
      if (!f || f.slope >= 0) return { vt: NaN, k: NaN };
      return { vt: p.law === 'lin' ? -f.intercept / f.slope : Math.sqrt(-f.intercept / f.slope), k: -f.slope * p.m };
    },
    explain: (p) => (p.law === 'lin' ? 'Đồ thị a – v là đường thẳng: a = g − (b/m)·v nên hệ số góc B = −b/m.' : 'Đồ thị a – v² là đường thẳng: a = g − (c/m)·v² nên hệ số góc B = −c/m.'),
    reference: (p) => `Giá trị cài đặt trong mô phỏng: vt = ${fmt(phys.vt(p), 2)} m/s; ${p.law === 'lin' ? 'b' : 'c'} = ${fmt(phys.coef(p), 2)}.`,
  }],
  quiz: [
    { q: 'Vật rơi trong chất lưu đạt vận tốc giới hạn khi:', o: ['lực cản bằng không', 'hợp lực tác dụng lên vật bằng không', 'vật dừng lại'], a: 1, why: 'Lực cản cân bằng trọng lực: mg − FC = 0 nên a = 0 và v không đổi.' },
    { q: 'Vật 0,5 kg rơi trong chất lỏng, lực cản F = b·v với b = 1 kg/s. Vận tốc giới hạn là:', o: ['0,5 m/s', '4,9 m/s', '9,8 m/s'], a: 1, why: 'vt = mg/b = 0,5·9,8/1 = 4,9 m/s.' },
    { q: 'Vật 0,5 kg, lực cản F = c·v² với c = 0,1 kg/m. Vận tốc giới hạn là:', o: ['4,9 m/s', '7,0 m/s', '49 m/s'], a: 1, why: 'vt = √(mg/c) = √(4,9/0,1) = √49 = 7,0 m/s.' },
    { q: 'Khi vật đang rơi nhanh dần trong chất lưu, gia tốc của vật:', o: ['tăng dần', 'giảm dần tới 0', 'luôn bằng g'], a: 1, why: 'Lực cản tăng theo v nên a = g − FC/m giảm dần tới 0.' },
    { q: 'Cánh máy bay tạo ra lực nâng khi:', o: ['có chuyển động tương đối so với không khí', 'đứng yên trong không khí', 'ở trong chân không'], a: 0, why: 'Lực nâng do không khí tác dụng lên vật chuyển động tương đối so với nó.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

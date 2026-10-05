// Vật lí 10 – Bài 14: Định luật 1 Newton (xe trên đệm khí).
import { mountLab } from '../../core/lab.js';
import { linearFit, mean, fmt } from '../../core/stats.js';
import { arrow, text, ruler, ground, rect, circle, line } from '../../core/draw.js';

const G = 9.8, TMAX = 4, TRACK = 3.5;

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
// mode: 'air' = bật đệm khí (bỏ qua ma sát); 'fric' = tắt đệm khí (ma sát trượt, hệ số mu);
//       'balance' = tắt đệm khí nhưng kéo xe bằng lực đúng bằng lực ma sát.
export const phys = {
  G,
  friction: (p) => (p.mode === 'air' ? 0 : p.mu * p.m * G),          // độ lớn lực ma sát (N)
  pull: (p) => (p.mode === 'balance' ? p.mu * p.m * G : 0),           // lực kéo (N)
  net: (p) => (p.mode === 'fric' ? -p.mu * p.m * G : 0),              // hợp lực khi xe còn chuyển động (N)
  a: (p) => (p.mode === 'fric' ? -p.mu * G : 0),                       // gia tốc khi xe còn chuyển động
  stopTime: (p) => (p.mode === 'fric' ? p.v0 / (p.mu * G) : Infinity),
  v(p, t) { const ts = phys.stopTime(p); return t >= ts ? 0 : p.v0 + phys.a(p) * t; },
  x(p, t) { const ts = phys.stopTime(p), tt = Math.min(t, ts); return p.v0 * tt + 0.5 * phys.a(p) * tt * tt; },
  stopDistance: (p) => (p.mode === 'fric' ? (p.v0 * p.v0) / (2 * p.mu * G) : Infinity),
};

export const spec = {
  seed: 1414,
  intro: 'Xe nhỏ được đẩy nhẹ cho chạy trên đường ray. Em bật hoặc tắt đệm khí (ma sát), thêm lực kéo cân bằng ma sát, rồi quan sát vận tốc của xe thay đổi thế nào.',
  goals: [
    'Nhận biết quán tính: vật có xu hướng giữ nguyên vận tốc.',
    'Rút ra định luật 1 Newton: khi hợp lực bằng 0, vật đứng yên hoặc chuyển động thẳng đều.',
    'Giải thích vì sao xe trên mặt bàn dừng lại: do lực ma sát, không phải vì “hết đà”.',
  ],
  theory: 'Nếu ΣF = 0 thì a = 0: vật đang đứng yên vẫn đứng yên, đang chuyển động vẫn chuyển động thẳng đều. &nbsp; Lực ma sát trượt: F_ms = μ·N = μ·m·g (g = 9,8 m/s²).',
  setup: 'Chọn cách bố trí: <b>Bật đệm khí</b> (ma sát rất nhỏ, bỏ qua); <b>Tắt đệm khí</b> (có ma sát); <b>Tắt đệm khí và kéo cân bằng ma sát</b>. Cổng quang đọc vận tốc v, thước đọc vị trí x.',
  choices: [{ k: 'mode', label: 'Cách bố trí', options: [['air', 'Bật đệm khí (không ma sát)'], ['fric', 'Tắt đệm khí (có ma sát)'], ['balance', 'Tắt đệm khí, kéo cân bằng ma sát']], def: 'air', string: true }],
  params: [
    { k: 'v0', label: 'Vận tốc ban đầu v₀ (sau cú đẩy)', unit: 'm/s', min: 0.2, max: 0.8, step: 0.1, def: 0.6, dec: 1 },
    { k: 'm', label: 'Khối lượng xe m', unit: 'kg', min: 0.1, max: 0.5, step: 0.05, def: 0.25, dec: 2 },
    { k: 'mu', label: 'Hệ số ma sát μ', unit: '', min: 0.02, max: 0.15, step: 0.01, def: 0.05, dec: 2, show: (p) => p.mode !== 'air' },
  ],
  toggles: [{ k: 'vec', label: 'Hiện vectơ vận tốc và các lực', def: true }, { k: 'strobe', label: 'Dấu vết mỗi 0,5 s', def: true }],
  stageHeight: 240,
  ariaLabel: 'Xe chạy trên đường ray có thước, vectơ vận tốc và các lực tác dụng lên xe',
  duration: () => TMAX,
  state: (p, t) => ({ x: phys.x(p, t), v: phys.v(p, t), net: phys.v(p, t) > 0 || p.mode !== 'fric' ? phys.net(p) : 0, f: phys.friction(p), F: phys.pull(p) }),
  readouts: (p, s) => [['x', fmt(s.x, 3) + ' m'], ['v', fmt(s.v, 2) + ' m/s'], ['ΣF', fmt(s.net, 3) + ' N']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const x0 = 24, ppm = (w - 48) / TRACK, yg = h - 52, off = 0.12;
    const X = (m) => x0 + (off + m) * ppm;
    ground(ctx, 10, w - 10, yg + 4, th);
    rect(ctx, 10, yg - 2, w - 20, 6, th.road, th.axis, 2);
    ruler(ctx, x0 + off * ppm, yg + 14, ppm, 0, 3.4, 0.1, th, { unit: 'm', labelEvery: 5 });
    if (tg.strobe) for (let u = 0; u <= t + 1e-9; u += 0.5) circle(ctx, X(phys.x(p, u)), yg - 12, 3, th.muted);
    const cx = X(s.x), cw = 44 + p.m * 24, lift = p.mode === 'air' ? 5 : 0;
    if (p.mode === 'air') for (let k = -2; k <= 2; k++) line(ctx, cx + k * 9, yg - 1, cx + k * 9 + (k ? Math.sign(k) * 3 : 0), yg - 5, th.s2, 1.5);
    rect(ctx, cx - cw / 2, yg - 28 - lift, cw, 22, th.car, null, 5);
    text(ctx, 'm', cx, yg - 12 - lift, { color: '#fff', size: 12, align: 'center', bold: true });
    if (tg.vec) {
      const yv = yg - 78;
      if (s.v > 0.005) { arrow(ctx, cx, yv, cx + s.v * 70, yv, th.accent, 3); text(ctx, 'v', cx + s.v * 70 + 6, yv + 4, { color: th.accent, size: 13, bold: true }); }
      const yf = yg - 17 - lift, moving = s.v > 0.005;
      if (p.mode !== 'air' && moving) {
        const L = Math.max(20, s.f * 90);
        arrow(ctx, cx - cw / 2, yf, cx - cw / 2 - L, yf, th.bad, 3); text(ctx, 'F_ms', cx - cw / 2 - L - 4, yf - 8, { color: th.bad, size: 12, align: 'right', bold: true });
        if (p.mode === 'balance') { arrow(ctx, cx + cw / 2, yf, cx + cw / 2 + L, yf, th.s3, 3); text(ctx, 'F_kéo', cx + cw / 2 + L + 4, yf - 8, { color: th.s3, size: 12, bold: true }); }
      }
      text(ctx, moving || p.mode !== 'fric' ? (Math.abs(s.net) < 1e-9 ? 'ΣF = 0' : `ΣF = ${fmt(s.net, 3)} N`) : 'Xe đã dừng', 12, 20, { color: Math.abs(s.net) < 1e-9 ? th.ok : th.bad, size: 14, bold: true });
    }
  },
  columns: [{ k: 't', label: 't', unit: 's', dec: 2 }, { k: 'x', label: 'x', unit: 'm', dec: 3 }, { k: 'v', label: 'v', unit: 'm/s', dec: 2 }],
  recordLabel: 'Ghi số liệu (t, x, v)',
  note: 'Đồng hồ có sai số khoảng 0,02 s, thước chia đến 1 mm, cổng quang đọc v với sai số khoảng 0,01 m/s. Khi bật đệm khí, ma sát nhỏ đến mức bỏ qua.',
  record: (p, s, t, n) => (s.v < 0.005 ? { error: 'Xe đã dừng. Hãy ghi số liệu khi xe còn chuyển động.' }
    : { t: n.round(t + n.noise(0.02), 0.01), x: n.round(s.x + n.noise(0.003), 0.001), v: n.round(s.v + n.noise(0.01), 0.01) }),
  graphs: [
    { title: 'Đồ thị x – t', xlabel: 't (s)', ylabel: 'x (m)', x: 't', y: 'x', curve: (p) => Array.from({ length: 41 }, (_, i) => [i * 0.1, phys.x(p, i * 0.1)]), marker: (p, s, t) => [t, s.x], zeroX: true, zeroY: true },
    { title: 'Đồ thị v – t', xlabel: 't (s)', ylabel: 'v (m/s)', x: 't', y: 'v', fit: true, dec: 3, curve: (p) => Array.from({ length: 41 }, (_, i) => [i * 0.1, phys.v(p, i * 0.1)]), marker: (p, s, t) => [t, s.v], zeroX: true, zeroY: true, range: (p) => ({ ymin: 0, ymax: Math.max(1, p.v0 * 1.15) }) },
  ],
  predict: {
    prompt: '<p>Với cách bố trí và các giá trị đang chọn, hãy dự đoán vận tốc và toạ độ của xe tại <b>t = 3 s</b> (xe bắt đầu từ x = 0).</p>',
    fields: [{ k: 'v', label: 'v(3 s)', unit: 'm/s' }, { k: 'x', label: 'x(3 s)', unit: 'm' }],
    expected: (p) => ({ v: phys.v(p, 3), x: phys.x(p, 3) }), tol: 0.02, absTol: 0.02,
    explain: (p) => (p.mode === 'fric'
      ? `Có ma sát: a = −μg = ${fmt(phys.a(p), 2)} m/s². Xe dừng sau ${fmt(phys.stopTime(p), 2)} s, đã đi ${fmt(phys.stopDistance(p), 2)} m.`
      : `Hợp lực bằng 0 nên v không đổi = ${fmt(p.v0, 1)} m/s và x = v₀t = ${fmt(p.v0 * 3, 2)} m.`),
  },
  tasks: [{
    title: 'Xử lí số liệu: hợp lực tác dụng lên xe',
    prompt: '<p>Ghi ít nhất 5 lần đo khi xe còn chuyển động. Đọc <b>độ dốc của đường khớp v – t</b> (gia tốc a), tính <b>vận tốc trung bình</b> của các lần đo và <b>hợp lực ΣF = m·a</b> (m là khối lượng xe đã chọn). Hợp lực bằng 0 thì a bằng 0.</p>',
    fields: [{ k: 'a', label: 'Gia tốc a', unit: 'm/s²', dec: 3, absTol: 0.02 }, { k: 'vbar', label: 'Vận tốc trung bình', unit: 'm/s', dec: 3, absTol: 0.02 }, { k: 'F', label: 'ΣF = m·a', unit: 'N', dec: 3, absTol: 0.01 }],
    minRows: 5, tol: 0.03,
    expected: (p, rows) => { const f = linearFit(rows.map((r) => [r.t, r.v])); return { a: f.slope, vbar: mean(rows.map((r) => r.v)), F: p.m * f.slope }; },
    explain: (p, rows, e) => (Math.abs(e.a) < 0.05 ? 'a ≈ 0 (trong sai số đo) nên hợp lực ≈ 0: xe chuyển động thẳng đều, đúng định luật 1 Newton.' : 'a khác 0 nên có hợp lực khác 0 (lực ma sát): vận tốc giảm dần, xe không chuyển động thẳng đều.'),
    reference: (p) => `Giá trị chuẩn của bố trí hiện tại: a = ${fmt(phys.a(p), 3)} m/s², ΣF = ${fmt(phys.net(p), 3)} N.`,
  }],
  quiz: [
    { q: 'Theo định luật 1 Newton, vật đang chuyển động mà hợp lực tác dụng lên nó bằng 0 thì:', o: ['dừng lại ngay', 'chuyển động thẳng đều', 'chuyển động nhanh dần'], a: 1, why: 'Khi ΣF = 0 thì a = 0, vận tốc không đổi.' },
    { q: 'Xe trượt trên mặt bàn nhám dừng lại vì:', o: ['xe hết lực đẩy', 'lực ma sát làm vận tốc giảm', 'quán tính của xe mất đi'], a: 1, why: 'Lực ma sát là hợp lực khác 0 ngược chiều chuyển động, làm xe chậm dần.' },
    { q: 'Xe chạy trên mặt nhám, kéo bằng lực đúng bằng lực ma sát (cùng phương, ngược chiều). Xe sẽ:', o: ['chuyển động thẳng đều', 'chuyển động chậm dần', 'chuyển động nhanh dần'], a: 0, why: 'Hợp lực bằng 0 nên xe giữ nguyên vận tốc.' },
    { q: 'Xe buýt đang chạy phanh gấp, hành khách bị chúi về phía trước. Đó là do:', o: ['lực đẩy của ghế', 'quán tính', 'trọng lực'], a: 1, why: 'Người có xu hướng giữ nguyên vận tốc cũ (quán tính) khi xe giảm tốc đột ngột.' },
    { q: 'Xe có v₀ = 0,8 m/s trượt trên mặt có μ = 0,05 (g = 9,8 m/s²). Xe đi được quãng đường tới khi dừng là:', o: ['0,65 m', '1,3 m', '0,33 m'], a: 0, why: 'a = −μg = −0,49 m/s²; s = v₀²/(2μg) = 0,64/0,98 ≈ 0,65 m.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

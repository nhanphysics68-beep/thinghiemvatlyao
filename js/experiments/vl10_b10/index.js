// Vật lí 10 – Bài 10: Sự rơi tự do (ống Newton ảo). g = 9,8 m/s².
import { mountLab } from '../../core/lab.js';
import { linearFit, mean, fmt } from '../../core/stats.js';
import { text, circle, line } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
// Chân không: s = ½gt², v = gt.
// Có không khí: lực cản tỉ lệ v², vận tốc giới hạn vt:
//   v = vt·tanh(gt/vt),  s = (vt²/g)·ln cosh(gt/vt).
export const G = 9.8;
export const OBJ = {
  ball: { name: 'Bi thép', vt: 80, label: 'Bi thép (nặng)' },
  paper: { name: 'Giấy vo', vt: 6, label: 'Viên giấy vo tròn' },
  feather: { name: 'Lông vũ', vt: 1.0, label: 'Lông vũ (nhẹ)' },
};
const lncosh = (z) => z + Math.log1p(Math.exp(-2 * z)) - Math.LN2; // z ≥ 0
export const phys = {
  sFree: (t) => 0.5 * G * t * t,
  vFree: (t) => G * t,
  s: (p, t, k) => (p.air === 'vac' ? 0.5 * G * t * t : (OBJ[k].vt ** 2 / G) * lncosh((G * t) / OBJ[k].vt)),
  v: (p, t, k) => (p.air === 'vac' ? G * t : OBJ[k].vt * Math.tanh((G * t) / OBJ[k].vt)),
  // thời gian rơi hết độ cao h
  fall: (p, h, k) => {
    if (p.air === 'vac') return Math.sqrt((2 * h) / G);
    const vt = OBJ[k].vt, z = (G * h) / (vt * vt);
    return (vt / G) * (z + Math.log(1 + Math.sqrt(1 - Math.exp(-2 * z))));
  },
};
const KEYS = ['ball', 'paper', 'feather'];
const tEnd = (p) => Math.max(...KEYS.map((k) => phys.fall(p, p.h, k)));

export const spec = {
  seed: 1010,
  intro: 'Ống Newton là ống thủy tinh dài chứa ba vật: bi thép, viên giấy vo tròn và lông vũ. Em lật ống cho các vật rơi cùng lúc, khi có không khí và khi đã hút hết không khí.',
  goals: [
    'Nhận ra: nếu bỏ qua sức cản không khí, mọi vật rơi nhanh như nhau (sự rơi tự do).',
    'Nhận biết sự rơi tự do là chuyển động thẳng nhanh dần đều với gia tốc g ≈ 9,8 m/s².',
    'Đo quãng đường s theo thời gian t, vận tốc v theo t và tính gia tốc rơi tự do g.',
  ],
  theory: 'Rơi tự do: v = g·t &nbsp;&nbsp; s = ½·g·t² &nbsp;&nbsp; v² = 2·g·s &nbsp;&nbsp; (g = 9,8 m/s²)',
  setup: 'Bước 1: để ống có không khí, bấm “Chạy” và quan sát. Bước 2: chọn “đã hút hết không khí” rồi chạy lại. Bước 3: chọn một vật để đo s và v theo t.',
  choices: [
    { k: 'air', label: 'Trong ống', def: 'air', options: [['air', 'Có không khí'], ['vac', 'Đã hút hết không khí']] },
    { k: 'obj', label: 'Vật đo số liệu', def: 'ball', options: KEYS.map((k) => [k, OBJ[k].label]) },
  ],
  params: [{ k: 'h', label: 'Độ cao thả h', unit: 'm', min: 0.5, max: 10, step: 0.1, def: 1.5, dec: 1 }],
  toggles: [{ k: 'strobe', label: 'Hiện ảnh hoạt nghiệm (vị trí sau những khoảng thời gian bằng nhau)', def: true }],
  stageHeight: 340,
  ariaLabel: 'Ống thủy tinh thẳng đứng có thước đo, trong đó bi thép, viên giấy và lông vũ cùng rơi',
  duration: (p) => tEnd(p) + 0.4,
  state(p, t) {
    const o = {};
    for (const k of KEYS) { const tt = Math.min(t, phys.fall(p, p.h, k)); o[k] = { s: Math.min(p.h, phys.s(p, tt, k)), v: phys.v(p, tt, k) }; }
    return o;
  },
  readouts: (p, s) => [['s bi', fmt(s.ball.s, 2) + ' m'], ['v bi', fmt(s.ball.v, 2) + ' m/s'], ['s lông', fmt(s.feather.s, 2) + ' m'], ['v lông', fmt(s.feather.v, 2) + ' m/s']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const xa = 52, xb = w - 14, y0 = 56, y1 = h - 30, ppm = (y1 - y0) / p.h;
    // ống thủy tinh
    ctx.save(); ctx.beginPath(); ctx.roundRect(xa, y0 - 26, xb - xa, y1 - y0 + 46, 14);
    ctx.fillStyle = p.air === 'vac' ? th.soft : 'transparent'; ctx.fill(); ctx.strokeStyle = th.axis; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    text(ctx, p.air === 'vac' ? 'Chân không (đã hút hết không khí)' : 'Có không khí', 12, 16, { color: p.air === 'vac' ? th.accent : th.ink, size: 13, bold: true });
    // thước đứng bên trái: gốc ở vị trí thả, chiều dương hướng xuống
    const stepM = [0.1, 0.2, 0.5, 1, 2, 5].find((m) => m * ppm >= 26) || 5;
    ctx.save(); ctx.strokeStyle = th.axis; ctx.fillStyle = th.muted; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.lineWidth = 1;
    line(ctx, xa - 8, y0, xa - 8, y1, th.axis, 1);
    for (let m = 0; m <= p.h + 1e-9; m += stepM) { const y = y0 + m * ppm; ctx.beginPath(); ctx.moveTo(xa - 8, y); ctx.lineTo(xa - 2, y); ctx.stroke(); ctx.fillText(String(+m.toFixed(2)).replace('.', ','), xa - 12, y); }
    ctx.textAlign = 'left'; ctx.fillText('s (m)', 4, y0 - 12); ctx.restore();
    line(ctx, xa + 6, y1, xb - 6, y1, th.line, 1, [4, 4]);
    const cols = { ball: th.ink, paper: th.s2, feather: th.s3 };
    const dtS = phys.fall({ air: 'vac' }, p.h, 'ball') <= 0.9 ? 0.1 : phys.fall({ air: 'vac' }, p.h, 'ball') <= 1.5 ? 0.2 : 0.25;
    KEYS.forEach((k, i) => {
      const cx = xa + ((i + 0.5) * (xb - xa)) / 3, o = s[k], tf = phys.fall(p, p.h, k);
      text(ctx, OBJ[k].name, cx, y0 - 8, { color: th.muted, size: 11, align: 'center' });
      if (tg.strobe) for (let u = dtS; u <= Math.min(t, tf) + 1e-9; u += dtS) circle(ctx, cx, y0 + Math.min(p.h, phys.s(p, u, k)) * ppm, 2.2, th.muted);
      const sway = k === 'feather' && p.air === 'air' && t < tf ? Math.sin(t * 9) * Math.min(8, 3 + t) : 0;
      const y = y0 + o.s * ppm, x = cx + sway;
      if (k === 'ball') circle(ctx, x, y, 8, th.ink, th.card);
      else if (k === 'paper') { ctx.save(); ctx.fillStyle = cols[k]; ctx.strokeStyle = th.card; ctx.lineWidth = 1.5; ctx.beginPath(); for (let j = 0; j < 9; j++) { const ang = (j / 9) * Math.PI * 2, rr = j % 2 ? 7 : 9.5; ctx[j ? 'lineTo' : 'moveTo'](x + rr * Math.cos(ang), y + rr * Math.sin(ang)); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
      else { ctx.save(); ctx.translate(x, y); ctx.rotate(sway * 0.05); ctx.fillStyle = cols[k]; ctx.beginPath(); ctx.ellipse(0, 0, 4, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = th.card; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke(); ctx.restore(); }
    });
  },
  columns: [
    { k: 't', label: 't', unit: 's', dec: 3 }, { k: 's', label: 's', unit: 'm', dec: 3 }, { k: 'v', label: 'v', unit: 'm/s', dec: 2 },
  ],
  recordLabel: 'Ghi số liệu (t, s, v) của vật đo',
  note: 'Đồng hồ và thước có sai số khoảng 0,002 (s và m), cổng quang đọc v với sai số khoảng 0,05 m/s. Nên ghi ở các thời điểm t > 0,15 s và trước khi vật chạm đáy ống. Đồ thị bên dưới là của “Vật đo số liệu” đã chọn.',
  record(p, s, t, n) {
    const tf = phys.fall(p, p.h, p.obj);
    if (t > tf) return { error: 'Vật đã chạm đáy ống. Hãy ghi ở thời điểm trước đó.' };
    const o = s[p.obj];
    return { t: n.round(t + n.noise(0.002), 0.001), s: n.round(o.s + n.noise(0.002), 0.001), v: n.round(o.v + n.noise(0.05), 0.01) };
  },
  demo: async (api) => {
    const tf = phys.fall(api.p, api.p.h, api.p.obj);
    for (let i = 0; i < 8; i++) { api.setT(tf * (0.2 + (0.75 * i) / 7)); api.record(); }
  },
  graphs: [
    {
      title: 'Đồ thị s – t', xlabel: 't (s)', ylabel: 's (m)', x: 't', y: 's', zeroX: true, zeroY: true,
      curve: (p) => { const tf = phys.fall(p, p.h, p.obj); return Array.from({ length: 41 }, (_, i) => [(tf * i) / 40, phys.s(p, (tf * i) / 40, p.obj)]); },
      marker: (p, s, t) => [Math.min(t, phys.fall(p, p.h, p.obj)), s[p.obj].s],
    },
    {
      title: 'Đồ thị v – t', xlabel: 't (s)', ylabel: 'v (m/s)', x: 't', y: 'v', fit: true, zeroX: true, zeroY: true,
      curve: (p) => { const tf = phys.fall(p, p.h, p.obj); return Array.from({ length: 41 }, (_, i) => [(tf * i) / 40, phys.v(p, (tf * i) / 40, p.obj)]); },
      marker: (p, s, t) => [Math.min(t, phys.fall(p, p.h, p.obj)), s[p.obj].v],
    },
  ],
  predict: {
    prompt: '<p>Bỏ qua sức cản không khí, thả bi thép từ độ cao <b>h</b> đang chọn. Hãy dự đoán <b>thời gian rơi</b> và <b>tốc độ khi chạm đáy ống</b> (lấy g = 9,8 m/s²).</p>',
    fields: [{ k: 't', label: 'Thời gian rơi', unit: 's', dec: 3 }, { k: 'v', label: 'Tốc độ khi chạm đáy', unit: 'm/s' }],
    expected: (p) => ({ t: Math.sqrt((2 * p.h) / G), v: Math.sqrt(2 * G * p.h) }), tol: 0.02, absTol: 0.01,
    explain: (p) => `h = ½gt² nên t = √(2h/g) = ${fmt(Math.sqrt((2 * p.h) / G), 3)} s; v = gt = √(2gh) = ${fmt(Math.sqrt(2 * G * p.h))} m/s.`,
  },
  tasks: [
    {
      title: 'Xử lí số liệu: g từ quãng đường và thời gian',
      prompt: '<p>Với mỗi lần đo, tính g<sub>i</sub> = 2s/t². Lấy <b>giá trị trung bình</b> của g<sub>i</sub> trên tất cả các lần đo trong bảng (ghi ít nhất 5 lần).</p>',
      fields: [{ k: 'g', label: 'g trung bình', unit: 'm/s²' }],
      minRows: 5, tol: 0.03, absTol: 0.05,
      expected: (p, rows) => ({ g: mean(rows.map((r) => (2 * r.s) / (r.t * r.t))) }),
      explain: () => 'Từ s = ½gt² suy ra g = 2s/t². Các lần đo có t nhỏ cho g<sub>i</sub> kém chính xác hơn vì sai số tương đối lớn.',
      reference: (p) => `Giá trị cài đặt trong mô phỏng: g = 9,8 m/s². ${p.air === 'air' && p.obj !== 'ball' ? 'Vật nhẹ trong không khí không rơi tự do nên g đo được nhỏ hơn 9,8.' : ''}`,
    },
    {
      title: 'Xử lí số liệu: g từ đồ thị v – t',
      prompt: '<p>Đồ thị v – t của sự rơi tự do là đường thẳng đi qua gốc toạ độ. <b>Gia tốc g bằng độ dốc</b> của đường khớp. Đọc độ dốc ở chú thích dưới đồ thị v – t.</p>',
      fields: [{ k: 'g', label: 'g (độ dốc)', unit: 'm/s²' }],
      minRows: 5, tol: 0.03, absTol: 0.05,
      expected: (p, rows) => ({ g: linearFit(rows.map((r) => [r.t, r.v])).slope }),
      reference: (p) => `Giá trị cài đặt trong mô phỏng: g = 9,8 m/s².`,
    },
  ],
  quiz: [
    { q: 'Khi hút hết không khí trong ống Newton rồi lật ống, hiện tượng nào xảy ra?', o: ['Bi thép chạm đáy trước', 'Lông vũ và bi thép chạm đáy cùng lúc', 'Lông vũ chạm đáy trước'], a: 1, why: 'Không còn sức cản không khí, mọi vật rơi với cùng gia tốc g.' },
    { q: 'Trong không khí, lông vũ rơi chậm hơn bi thép chủ yếu vì:', o: ['lông vũ có gia tốc rơi tự do nhỏ hơn', 'sức cản không khí lên lông vũ lớn so với trọng lượng của nó', 'Trái Đất hút lông vũ yếu hơn'], a: 1, why: 'Sức cản không khí đáng kể so với trọng lượng của vật nhẹ nên vật không rơi tự do.' },
    { q: 'Vật rơi tự do không vận tốc đầu. Sau 3 s tốc độ của vật là (g = 9,8 m/s²):', o: ['29,4 m/s', '14,7 m/s', '44,1 m/s'], a: 0, why: 'v = gt = 9,8·3 = 29,4 m/s.' },
    { q: 'Vật rơi tự do từ độ cao 19,6 m. Thời gian rơi là:', o: ['4 s', '2 s', '1 s'], a: 1, why: 't = √(2h/g) = √(2·19,6/9,8) = √4 = 2 s.' },
    { q: 'Trong 2 s đầu, quãng đường vật rơi tự do đi được gấp mấy lần quãng đường trong 1 s đầu?', o: ['2 lần', '3 lần', '4 lần'], a: 2, why: 's = ½gt² tỉ lệ với t² nên s(2)/s(1) = 4.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

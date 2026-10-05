// Vật lí 10 – Bài 15: Định luật 2 Newton (khảo sát a theo F và m trên đệm khí).
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, ruler, ground, rect, circle, line } from '../../core/draw.js';

const L = 2, TCAP = 3, MIN_T = 0.5;

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
// Đệm khí: bỏ qua ma sát; lực kéo F không đổi theo phương ngang (đo bằng cảm biến lực).
export const phys = {
  a: (p) => p.F / p.m,
  v: (p, t) => (p.F / p.m) * t,
  x: (p, t) => 0.5 * (p.F / p.m) * t * t,
  duration: (p) => Math.min(TCAP, Math.sqrt((2 * L) / (p.F / p.m))),     // dừng khi xe đi hết đường ray dài L
  // Độ dốc của đường thẳng qua gốc y = k·x (bình phương tối thiểu)
  slopeOrigin(pts) { let sxy = 0, sxx = 0; for (const [x, y] of pts) { sxy += x * y; sxx += x * x; } return sxy / sxx; },
};
const serRows = (rows, s) => rows.filter((r) => r.ser === s);

export const spec = {
  seed: 1515,
  intro: 'Xe trượt trên đệm khí (ma sát gần bằng 0) được kéo bằng lực F không đổi. Em đo gia tốc a bằng cách đo quãng đường x và thời gian t, thay đổi F hoặc khối lượng m để tìm quy luật.',
  goals: [
    'Khảo sát sự phụ thuộc của gia tốc a vào lực F (khi m không đổi) và vào khối lượng m (khi F không đổi).',
    'Rút ra định luật 2 Newton: a = F/m.',
    'Xác định m hoặc F từ độ dốc của đồ thị.',
  ],
  theory: 'a = F/m &nbsp;&nbsp; (F = m·a) &nbsp;&nbsp; Xe xuất phát từ nghỉ: x = ½at² ⇒ a = 2x/t² &nbsp;&nbsp; Đồ thị a – F là đường thẳng qua gốc, độ dốc 1/m; đồ thị a – 1/m là đường thẳng qua gốc, độ dốc F.',
  setup: 'Bước 1: chọn <b>Khảo sát a theo F</b> (m không đổi), đặt vài giá trị F, mỗi giá trị bấm Chạy hoặc kéo thanh t rồi ghi số liệu (t ≥ 0,5 s). Bước 2: chọn <b>Khảo sát a theo m</b> (F không đổi) và làm tương tự. Số liệu của hai bước đều được giữ lại.',
  choices: [{ k: 'mode', label: 'Khảo sát', options: [['F', 'a theo F (m không đổi)'], ['m', 'a theo m (F không đổi)']], def: 'F', string: true, keepRows: true }],
  params: [
    { k: 'F', label: 'Lực kéo F', unit: 'N', min: 0.1, max: 0.8, step: 0.1, def: 0.4, dec: 1, show: (p) => p.mode === 'F' },
    { k: 'm', label: 'Khối lượng xe m (xe và gia trọng)', unit: 'kg', min: 0.3, max: 1.0, step: 0.1, def: 0.5, dec: 1, show: (p) => p.mode === 'm' },
  ],
  onChoice: (p) => { p.F = 0.4; p.m = 0.5; },
  toggles: [{ k: 'vec', label: 'Hiện vectơ lực và gia tốc', def: true }, { k: 'strobe', label: 'Dấu vết mỗi 0,25 s', def: true }],
  stageHeight: 230,
  ariaLabel: 'Xe trên đệm khí được kéo bằng lực F, có thước đo và vectơ gia tốc',
  duration: (p) => phys.duration(p),
  state: (p, t) => ({ x: phys.x(p, t), v: phys.v(p, t), a: phys.a(p) }),
  readouts: (p, s) => [['x', fmt(s.x, 3) + ' m'], ['v', fmt(s.v, 2) + ' m/s'], ['F', fmt(p.F, 1) + ' N'], ['m', fmt(p.m, 1) + ' kg']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const x0 = 24, ppm = (w - 48 - 40) / (L + 0.2), yg = h - 52, X = (m) => x0 + (0.1 + m) * ppm;
    ground(ctx, 10, w - 10, yg + 4, th);
    rect(ctx, 10, yg - 2, w - 20, 6, th.road, th.axis, 2);
    ruler(ctx, x0 + 0.1 * ppm, yg + 14, ppm, 0, L, 0.1, th, { unit: 'm', labelEvery: 5 });
    if (tg.strobe) for (let u = 0; u <= t + 1e-9; u += 0.25) circle(ctx, X(phys.x(p, u)), yg - 12, 3, th.muted);
    const cx = X(s.x), cw = 36 + p.m * 24, lift = 5, ch = 18 + p.m * 14;
    for (let k = -2; k <= 2; k++) line(ctx, cx + k * cw / 5, yg - 1, cx + k * cw / 5 + (k ? Math.sign(k) * 3 : 0), yg - 5, th.s2, 1.5);
    rect(ctx, cx - cw / 2, yg - lift - ch, cw, ch, th.car, null, 5);
    text(ctx, `${fmt(p.m, 1)} kg`, cx, yg - lift - ch / 2 + 4, { color: '#fff', size: 12, align: 'center', bold: true });
    if (tg.vec) {
      const yf = yg - lift - ch / 2, fl = p.F * 90;
      arrow(ctx, cx + cw / 2, yf, cx + cw / 2 + fl, yf, th.s3, 3.5);
      text(ctx, `F = ${fmt(p.F, 1)} N`, cx + cw / 2 + fl + 6, yf - 12, { color: th.s3, size: 12, bold: true });
      const ya = yg - lift - ch - 34, al = s.a * 24;
      arrow(ctx, cx, ya, cx + al, ya, th.accent, 3.5);
      text(ctx, `a = ${fmt(s.a, 2)} m/s²`, cx, ya - 10, { color: th.accent, size: 12, align: 'left', bold: true });
    }
  },
  columns: [
    { k: 'F', label: 'F', unit: 'N', dec: 2 }, { k: 'm', label: 'm', unit: 'kg', dec: 3 }, { k: 'inv', label: '1/m', unit: 'kg⁻¹', dec: 3 },
    { k: 't', label: 't', unit: 's', dec: 3 }, { k: 'x', label: 'x', unit: 'm', dec: 3 }, { k: 'a', label: 'a = 2x/t²', unit: 'm/s²', dec: 3 },
  ],
  recordLabel: 'Ghi số liệu (F, m, t, x → a)',
  note: 'Mỗi lần ghi: cảm biến lực chia 0,01 N, cân chia 1 g, cổng quang đo t (sai số khoảng 0,005 s), thước đo x chia 1 mm. Gia tốc tính từ a = 2x/t² nên kết quả có sai số nhỏ.',
  record: (p, s, t, n) => {
    if (t < MIN_T) return { error: `Hãy để xe chạy ít nhất ${fmt(MIN_T, 1)} s rồi mới ghi (t quá nhỏ thì sai số lớn).` };
    const tt = n.round(t + n.noise(0.005), 0.001), x = n.round(s.x + n.noise(0.002), 0.001), m = n.round(p.m + n.noise(0.0005), 0.001);
    const a = n.round((2 * x) / (tt * tt), 0.001), inv = n.round(1 / m, 0.001), F = n.round(p.F + n.noise(0.005), 0.01);
    return { F, m, inv, t: tt, x, a, ser: p.mode, Fx: p.mode === 'F' ? F : NaN, invx: p.mode === 'm' ? inv : NaN };
  },
  demo: async (api) => {
    api.p.mode = 'F'; api.p.F = 0.4; api.p.m = 0.5;
    for (const F of [0.1, 0.2, 0.3, 0.5, 0.6, 0.8]) { api.setParam('F', F); api.setT(Math.min(api.duration(), 1.0)); api.record(); }
    api.p.mode = 'm'; api.p.F = 0.4; api.p.m = 0.5;
    for (const m of [0.3, 0.4, 0.6, 0.7, 0.8, 1.0]) { api.setParam('m', m); api.setT(Math.min(api.duration(), 1.0)); api.record(); }
  },
  graphs: [
    { title: 'Đồ thị a – F (m không đổi)', xlabel: 'F (N)', ylabel: 'a (m/s²)', x: 'Fx', y: 'a', fit: 'origin', dec: 3, zeroX: true, zeroY: true,
      curve: (p) => (p.mode === 'F' ? [[0, 0], [0.8, 0.8 / p.m]] : null), marker: (p, s) => (p.mode === 'F' ? [p.F, s.a] : null) },
    { title: 'Đồ thị a – 1/m (F không đổi)', xlabel: '1/m (kg⁻¹)', ylabel: 'a (m/s²)', x: 'invx', y: 'a', fit: 'origin', dec: 3, zeroX: true, zeroY: true,
      curve: (p) => (p.mode === 'm' ? [[0, 0], [3.4, 3.4 * p.F]] : null), marker: (p, s) => (p.mode === 'm' ? [1 / p.m, s.a] : null) },
  ],
  predict: {
    prompt: '<p>Với F và m đang chọn, hãy dự đoán gia tốc của xe.</p>',
    fields: [{ k: 'a', label: 'a', unit: 'm/s²' }],
    expected: (p) => ({ a: phys.a(p) }), tol: 0.02, absTol: 0.02,
    explain: (p) => `a = F/m = ${fmt(p.F, 1)} : ${fmt(p.m, 1)} = ${fmt(phys.a(p), 2)} m/s².`,
  },
  tasks: [
    {
      title: 'Xử lí số liệu: a theo F, tính khối lượng xe',
      prompt: '<p>Ghi ít nhất 4 lần đo ở chế độ “a theo F”. Đường khớp qua gốc của đồ thị a – F có độ dốc k = 1/m. Đọc độ dốc k rồi tính <b>m = 1/k</b>.</p>',
      fields: [{ k: 'k', label: 'Độ dốc k', unit: 'kg⁻¹', dec: 3, absTol: 0.03 }, { k: 'm', label: 'Khối lượng m = 1/k', unit: 'kg', dec: 3, absTol: 0.02 }],
      need: (rows) => (serRows(rows, 'F').length < 4 ? 'Cần ít nhất 4 lần đo ở chế độ “a theo F” (m không đổi).' : null), tol: 0.03,
      expected: (p, rows) => { const k = phys.slopeOrigin(serRows(rows, 'F').map((r) => [r.F, r.a])); return { k, m: 1 / k }; },
      explain: () => 'Độ dốc của đồ thị a – F bằng 1/m, nên m = 1/k: a tỉ lệ thuận với F.',
      reference: (p, rows) => { const r = serRows(rows, 'F')[0]; return r ? `Khối lượng xe đã đặt (cân đọc): m = ${fmt(r.m, 3)} kg.` : ''; },
    },
    {
      title: 'Xử lí số liệu: a theo 1/m, tính lực kéo',
      prompt: '<p>Ghi ít nhất 4 lần đo ở chế độ “a theo m”. Đường khớp qua gốc của đồ thị a – 1/m có độ dốc bằng lực F. Đọc độ dốc để tính <b>F</b>, rồi tính a khi m = 0,50 kg (a = F/m).</p>',
      fields: [{ k: 'F', label: 'Lực F (độ dốc)', unit: 'N', dec: 3, absTol: 0.02 }, { k: 'a5', label: 'a khi m = 0,50 kg', unit: 'm/s²', dec: 3, absTol: 0.03 }],
      need: (rows) => (serRows(rows, 'm').length < 4 ? 'Cần ít nhất 4 lần đo ở chế độ “a theo m” (F không đổi).' : null), tol: 0.03,
      expected: (p, rows) => { const F = phys.slopeOrigin(serRows(rows, 'm').map((r) => [r.inv, r.a])); return { F, a5: F / 0.5 }; },
      explain: () => 'Độ dốc của đồ thị a – 1/m bằng F: a tỉ lệ nghịch với m.',
      reference: (p, rows) => { const r = serRows(rows, 'm')[0]; return r ? `Lực kéo cảm biến đọc: F = ${fmt(r.F, 2)} N.` : ''; },
    },
  ],
  quiz: [
    { q: 'Khi khối lượng xe không đổi, nếu lực kéo tăng gấp đôi thì gia tốc:', o: ['tăng gấp đôi', 'giảm một nửa', 'không đổi'], a: 0, why: 'a = F/m: a tỉ lệ thuận với F.' },
    { q: 'Khi lực kéo không đổi, nếu khối lượng tăng gấp đôi thì gia tốc:', o: ['tăng gấp đôi', 'giảm một nửa', 'không đổi'], a: 1, why: 'a = F/m: a tỉ lệ nghịch với m.' },
    { q: 'Lực 2 N tác dụng lên xe 0,5 kg trên đệm khí. Gia tốc của xe là:', o: ['1 m/s²', '4 m/s²', '0,25 m/s²'], a: 1, why: 'a = F/m = 2/0,5 = 4 m/s².' },
    { q: 'Vật 2 kg chuyển động với gia tốc 3 m/s². Hợp lực tác dụng lên vật là:', o: ['6 N', '1,5 N', '0,67 N'], a: 0, why: 'F = m·a = 2·3 = 6 N.' },
    { q: 'Đồ thị a theo F (m không đổi) là đường thẳng qua gốc có độ dốc 2 kg⁻¹. Khối lượng của xe là:', o: ['2 kg', '0,5 kg', '4 kg'], a: 1, why: 'Độ dốc = 1/m = 2 ⇒ m = 0,5 kg.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

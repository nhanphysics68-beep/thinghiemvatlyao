// Vật lí 10 – Bài 24: Công suất.
// Thí nghiệm: hai động cơ A, B cùng nâng vật khối lượng m đều lên cao; đo công A theo thời gian t, P = A/t.
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { niceTicks } from '../../core/plot.js';
import { arrow, text, rect, line, circle } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
export const G = 9.8;
const TMAX = 8;
export const phys = {
  G, TMAX,
  v: (p, P) => P / (p.m * G),                       // nâng đều: lực nâng F = mg, P = F·v  =>  v = P/(mg)
  h: (p, P, t) => phys.v(p, P) * t,                 // độ cao sau t
  A: (p, P, t) => P * t,                            // công động cơ thực hiện (= mgh vì nâng đều, bỏ qua hao phí)
  time: (P, A) => A / P,                            // thời gian để thực hiện công A
};
const slopeOrigin = (pts) => { let sxy = 0, sxx = 0; for (const [x, y] of pts) { sxy += x * y; sxx += x * x; } return sxx ? sxy / sxx : 0; };

export const spec = {
  seed: 2424,
  intro: 'Hai động cơ A và B nâng cùng một vật lên cao với tốc độ không đổi. Em đo công mà mỗi động cơ thực hiện sau từng khoảng thời gian để so sánh “động cơ nào làm việc mạnh hơn”.',
  goals: [
    'Nêu được ý nghĩa của công suất: công thực hiện trong một đơn vị thời gian.',
    'Xác định công suất P = A/t từ đồ thị công – thời gian.',
    'Vận dụng P = A/t và P = F·v; so sánh hai động cơ theo công suất.',
  ],
  theory: 'Công suất: <b>P = A/t</b> (đơn vị W = J/s; 1 kW = 1000 W; 1 mã lực ≈ 746 W)<br>' +
    'Khi lực không đổi kéo vật chuyển động đều: <b>P = F·v</b><br>' +
    'Nâng vật khối lượng m lên cao h: A = m·g·h với g = 9,8 m/s². 1 kW·h = 3,6·10⁶ J.',
  setup: 'Động cơ kéo dây nâng vật đều, bỏ qua hao phí (hiệu suất sẽ học ở Bài 27). “Công kế” đọc công mà từng động cơ đã thực hiện, đồng hồ bấm giờ đo thời gian t.',
  params: [
    { k: 'm', label: 'Khối lượng vật m', unit: 'kg', min: 20, max: 100, step: 5, def: 50, dec: 0 },
    { k: 'PA', label: 'Công suất động cơ A', unit: 'W', min: 100, max: 800, step: 50, def: 500, dec: 0 },
    { k: 'PB', label: 'Công suất động cơ B', unit: 'W', min: 100, max: 800, step: 50, def: 300, dec: 0 },
  ],
  toggles: [{ k: 'plate', label: 'Hiện công suất ghi trên nhãn động cơ', def: false }],
  stageHeight: 290,
  ariaLabel: 'Hai động cơ A và B cùng nâng vật lên cao, có thước đo độ cao bên trái và công kế dưới mỗi động cơ',
  duration: () => TMAX,
  state: (p, t) => ({
    hA: phys.h(p, p.PA, t), hB: phys.h(p, p.PB, t), AA: phys.A(p, p.PA, t), AB: phys.A(p, p.PB, t),
  }),
  readouts: (p, s) => [['h_A', fmt(s.hA, 2) + ' m'], ['h_B', fmt(s.hB, 2) + ' m'], ['A_A', fmt(s.AA, 0) + ' J'], ['A_B', fmt(s.AB, 0) + ' J']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const yg = h - 48, yTop = 62;
    const hmax = Math.max(phys.h(p, p.PA, TMAX), phys.h(p, p.PB, TMAX), 1);
    const lh = 26;                                         // chiều cao hộp tải
    const ppm = (yg - lh - 8 - yTop - 16) / hmax;          // px / m
    // thước độ cao bên trái
    const rx = 38;
    line(ctx, rx, yg, rx, yg - hmax * ppm, th.axis, 1);
    const { ticks } = niceTicks(0, hmax, 5);
    for (const v of ticks) {
      const y = yg - v * ppm;
      line(ctx, rx - 4, y, rx + 4, y, th.axis, 1);
      text(ctx, String(v).replace('.', ','), rx - 7, y + 4, { color: th.muted, size: 11, align: 'right' });
    }
    text(ctx, 'h (m)', rx + 6, yTop - 6, { color: th.muted, size: 11, align: 'left' });
    // mặt đất
    line(ctx, 46, yg, w - 8, yg, th.axis, 2);
    const colW = (w - 60) / 2;
    [['A', p.PA, s.hA, s.AA, th.accent, 60 + colW * 0.5], ['B', p.PB, s.hB, s.AB, th.s3, 60 + colW * 1.5]].forEach(([nm, P, hh, AA, col, cx]) => {
      // động cơ
      rect(ctx, cx - 26, 30, 52, 22, col, null, 5);
      text(ctx, nm, cx, 46, { color: '#fff', size: 13, align: 'center', bold: true });
      text(ctx, tg.plate ? `Động cơ ${nm}: ${fmt(P, 0)} W` : `Động cơ ${nm}`, cx, 20, { color: th.ink, size: 12, align: 'center', bold: true });
      // vật nặng
      const ly = yg - hh * ppm - lh;
      line(ctx, cx, 52, cx, ly, th.ink, 1.5);
      rect(ctx, cx - 20, ly, 40, lh, th.car, null, 4);
      text(ctx, fmt(p.m, 0) + ' kg', cx, ly + lh / 2 + 4, { color: '#fff', size: 11, align: 'center', bold: true });
      // vạch độ cao đã đạt
      if (hh > 0.02) { line(ctx, cx - 30, ly + lh, cx + 30, ly + lh, col, 1, [3, 3]); }
      // số liệu
      text(ctx, `h = ${fmt(hh, 2)} m`, cx, yg + 18, { color: th.ink, size: 12, align: 'center' });
      text(ctx, `A = ${fmt(AA, 0)} J`, cx, yg + 35, { color: col, size: 12, align: 'center', bold: true });
    });
  },
  columns: [
    { k: 't', label: 't', unit: 's', dec: 2 }, { k: 'AA', label: 'A (động cơ A)', unit: 'J', dec: 0 }, { k: 'AB', label: 'A (động cơ B)', unit: 'J', dec: 0 },
  ],
  recordLabel: 'Ghi số liệu (t, A_A, A_B)',
  note: 'Mỗi lần ghi: đồng hồ bấm giờ sai số khoảng 0,02 s; công kế sai số khoảng 1% (cộng thêm vài J).',
  record: (p, s, t, n) => ({
    t: n.round(t + n.noise(0.02), 0.01),
    AA: n.round(s.AA + n.noise(0.01 * s.AA + 1.5), 1),
    AB: n.round(s.AB + n.noise(0.01 * s.AB + 1.5), 1),
  }),
  graphs: [
    { title: 'Đồ thị A – t (động cơ A)', xlabel: 't (s)', ylabel: 'A (J)', x: 't', y: 'AA', fit: 'origin', dec: 1,
      curve: (p) => [[0, 0], [TMAX, p.PA * TMAX]], marker: (p, s, t) => [t, s.AA], zeroX: true, zeroY: true },
    { title: 'Đồ thị A – t (động cơ B)', xlabel: 't (s)', ylabel: 'A (J)', x: 't', y: 'AB', fit: 'origin', dec: 1,
      curve: (p) => [[0, 0], [TMAX, p.PB * TMAX]], marker: (p, s, t) => [t, s.AB], zeroX: true, zeroY: true },
  ],
  predict: {
    prompt: '<p>Động cơ A nâng vật (khối lượng m đang chọn) lên cao <b>6 m</b>. Hãy dự đoán công động cơ phải thực hiện và thời gian nâng (lấy g = 9,8 m/s²).</p>',
    fields: [{ k: 'A', label: 'Công A', unit: 'J', dec: 0 }, { k: 't', label: 'Thời gian t', unit: 's' }],
    expected: (p) => { const A = p.m * G * 6; return { A, t: A / p.PA }; }, tol: 0.02, absTol: 0.05,
    explain: (p) => `A = m·g·h = ${fmt(p.m, 0)}·9,8·6 = ${fmt(p.m * G * 6, 0)} J; t = A/P = ${fmt(p.m * G * 6 / p.PA, 2)} s.`,
  },
  tasks: [{
    title: 'Xử lí số liệu: công suất của hai động cơ',
    prompt: '<p>Ghi ít nhất 5 lần đo ở các thời điểm khác nhau. Hai đồ thị A – t là đường thẳng qua gốc toạ độ, <b>hệ số góc chính là công suất P</b>. Đọc hệ số góc ở chú thích dưới mỗi đồ thị, tính tỉ số P_A/P_B và tốc độ nâng v_A = P_A/(m·g).</p>',
    fields: [
      { k: 'PA', label: 'Công suất P_A', unit: 'W', dec: 0, absTol: 3 }, { k: 'PB', label: 'Công suất P_B', unit: 'W', dec: 0, absTol: 3 },
      { k: 'r', label: 'Tỉ số P_A/P_B', unit: '', dec: 2, absTol: 0.05 }, { k: 'v', label: 'Tốc độ nâng v_A', unit: 'm/s', dec: 2, absTol: 0.02 },
    ],
    minRows: 5, tol: 0.03,
    expected: (p, rows) => {
      const a = slopeOrigin(rows.map((r) => [r.t, r.AA])), b = slopeOrigin(rows.map((r) => [r.t, r.AB]));
      return { PA: a, PB: b, r: a / b, v: a / (p.m * G) };
    },
    explain: (p, rows, e) => `Động cơ ${e.PA >= e.PB ? 'A' : 'B'} có công suất lớn hơn: cùng thời gian thì thực hiện công nhiều hơn. v_A = P_A/(m·g) = ${fmt(e.v, 2)} m/s.`,
    reference: (p) => `Giá trị cài đặt: P_A = ${fmt(p.PA, 0)} W, P_B = ${fmt(p.PB, 0)} W.`,
  }],
  quiz: [
    { q: 'Động cơ có công suất 200 W có nghĩa là:', o: ['mỗi giây thực hiện công 200 J', 'thực hiện công 200 J trong 1 giờ', 'lực kéo bằng 200 N'], a: 0, why: '1 W = 1 J/s nên 200 W là 200 J mỗi giây.' },
    { q: 'Nâng vật 20 kg lên cao 5 m trong 10 s (g = 9,8 m/s²). Công suất trung bình là:', o: ['98 W', '980 W', '9,8 W'], a: 0, why: 'A = 20·9,8·5 = 980 J; P = A/t = 980/10 = 98 W.' },
    { q: 'Lực kéo 500 N kéo vật chuyển động đều với tốc độ 2 m/s. Công suất của lực là:', o: ['250 W', '1000 W', '2500 W'], a: 1, why: 'P = F·v = 500·2 = 1000 W.' },
    { q: 'Hai động cơ nâng cùng một vật lên cùng độ cao. Động cơ có công suất gấp đôi thì thời gian nâng:', o: ['gấp đôi', 'bằng một nửa', 'như nhau'], a: 1, why: 'Công như nhau (A = mgh); t = A/P nên P gấp đôi thì t giảm một nửa.' },
    { q: '1 kW·h bằng bao nhiêu jun?', o: ['3 600 J', '3,6·10⁶ J', '360 J'], a: 1, why: '1 kW·h = 1000 W·3600 s = 3,6·10⁶ J.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

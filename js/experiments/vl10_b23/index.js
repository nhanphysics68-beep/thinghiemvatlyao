// Vật lí 10 – Bài 23: Năng lượng. Công cơ học.
// Thí nghiệm: kéo vật bằng lực F hợp góc α với phương chuyển dời, đo công A = F·s·cosα.
import { mountLab } from '../../core/lab.js';
import { fmt } from '../../core/stats.js';
import { arrow, text, ruler, ground, rect, line } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
const TMAX = 4;                      // thời gian vật đi hết quãng đường d (chuyển động đều)
const rad = (a) => (a * Math.PI) / 180;
export const phys = {
  TMAX,
  cosd: (a) => (Math.abs(a - 90) < 1e-9 ? 0 : Math.cos(rad(a))),
  s: (p, t) => p.d * Math.min(1, Math.max(0, t / TMAX)),            // quãng đường đã đi (vật chuyển động đều)
  work: (p, s) => p.F * s * phys.cosd(p.alpha),                      // A = F·s·cosα
  fx: (p) => p.F * phys.cosd(p.alpha),                               // thành phần của F theo phương chuyển dời
  fy: (p) => p.F * Math.sin(rad(p.alpha)),
  sign: (p) => { const c = phys.cosd(p.alpha); return Math.abs(c) < 1e-9 ? 0 : c > 0 ? 1 : -1; },
};

const SIGN_TXT = { 1: 'A > 0: lực sinh công dương (phát động)', 0: 'A = 0: lực vuông góc với chuyển dời', '-1': 'A < 0: lực sinh công âm (cản trở)' };

// Hệ số góc đường thẳng qua gốc toạ độ: A = k·s
const slopeOrigin = (pts) => { let sxy = 0, sxx = 0; for (const [x, y] of pts) { sxy += x * y; sxx += x * x; } return sxx ? sxy / sxx : 0; };
const meanOf = (a) => a.reduce((s, v) => s + v, 0) / a.length;

export const spec = {
  seed: 2323,
  intro: 'Một chiếc hộp được kéo trên mặt sàn bằng lực F hợp với phương chuyển dời một góc α. Em thay đổi F, α, quãng đường d rồi đo công của lực để tìm quy luật của công cơ học.',
  goals: [
    'Nêu được: năng lượng có nhiều dạng và có thể chuyển hoá, truyền từ vật này sang vật khác; công là số đo năng lượng được truyền.',
    'Vận dụng công thức A = F·s·cosα cho các trường hợp α nhỏ hơn, bằng và lớn hơn 90°.',
    'Xác định thành phần F·cosα của lực từ đồ thị công – quãng đường.',
  ],
  theory: 'Công của lực không đổi: <b>A = F·s·cosα</b> (đơn vị J = N·m)<br>' +
    'α &lt; 90°: A &gt; 0 (công phát động) &nbsp;|&nbsp; α = 90°: A = 0 &nbsp;|&nbsp; α &gt; 90°: A &lt; 0 (công cản)<br>' +
    'Các dạng năng lượng: cơ năng, nhiệt năng, điện năng, quang năng, hoá năng, năng lượng hạt nhân… Khi lực thực hiện công, năng lượng được truyền hoặc chuyển hoá từ dạng này sang dạng khác.',
  setup: 'Giả sử các lực khác (ma sát, trọng lực, phản lực) cân bằng nhau nên hộp trượt <b>đều</b> trong 4 s. Lực kế đo F, thước đo s, thước đo góc đo α, “công kế” đọc công A của lực F. Em hãy giữ nguyên F, α và ghi số liệu ở nhiều vị trí khác nhau.',
  params: [
    { k: 'F', label: 'Độ lớn lực F', unit: 'N', min: 5, max: 50, step: 1, def: 20, dec: 0 },
    { k: 'alpha', label: 'Góc α giữa F và phương chuyển dời', unit: '°', min: 0, max: 180, step: 5, def: 30, dec: 0 },
    { k: 'd', label: 'Quãng đường chuyển dời d', unit: 'm', min: 1, max: 8, step: 0.5, def: 5, dec: 1 },
  ],
  toggles: [{ k: 'comp', label: 'Hiện thành phần F·cosα và F·sinα', def: true }],
  stageHeight: 250,
  ariaLabel: 'Chiếc hộp trượt trên sàn chịu lực kéo hợp góc alpha với phương chuyển dời, có thước đo quãng đường',
  duration: () => TMAX,
  state: (p, t) => { const s = phys.s(p, t); return { s, A: phys.work(p, s) }; },
  readouts: (p, s) => [['s', fmt(s.s, 2) + ' m'], ['A', fmt(s.A, 1) + ' J']],
  draw(ctx, { w, h }, s, p, t, th, tg) {
    const x0 = 22, yg = 168;
    const ppm = Math.max(14, (w - x0 - 22 - 52 - 80) / 8);         // 8 m là quãng đường lớn nhất
    const bw = Math.min(72, Math.max(46, ppm * 1.1)), bh = Math.round(bw * 0.72);
    const bx = x0 + s.s * ppm, by = yg - bh;                       // góc trái hộp
    ground(ctx, 8, w - 8, yg, th);
    ruler(ctx, x0, yg + 14, ppm, 0, 8, 0.5, th, { unit: 'm', labelEvery: 2 });
    line(ctx, x0, yg - 70, x0, yg, th.muted, 1, [4, 3]);
    text(ctx, 'xuất phát', x0, yg - 74, { color: th.muted, size: 11, align: 'left' });
    rect(ctx, bx, by, bw, bh, th.car, null, 5);
    // quãng đường s (mũi tên dưới thước)
    const ys = yg + 58;
    if (s.s > 0.02) {
      arrow(ctx, x0, ys, x0 + s.s * ppm, ys, th.s2, 2.5);
      text(ctx, 's = ' + fmt(s.s, 2) + ' m', x0 + Math.max(30, (s.s * ppm) / 2), ys + 16, { color: th.s2, size: 12, align: 'center', bold: true });
    }
    // lực F: gốc đặt ở mép trên, giữa hộp (điểm đặt của dây kéo)
    const cx = bx + bw / 2, cy = by, L = Math.min(100, 1.7 * p.F + 18);
    const ca = Math.cos(rad(p.alpha)), sa = Math.sin(rad(p.alpha));
    const tx = cx + L * ca, ty = cy - L * sa;
    if (tg.comp && p.alpha > 1 && p.alpha < 179) {
      line(ctx, cx, cy, tx, cy, th.ok, 2, [5, 3]);
      line(ctx, tx, cy, tx, ty, th.muted, 1.4, [3, 3]);
      if (p.alpha >= 40 && p.alpha <= 140) text(ctx, 'F·cosα', (cx + tx) / 2, cy - 5, { color: th.ok, size: 11, align: 'center', bold: true });
    }
    // cung góc α và nhãn
    if (p.alpha > 1) {
      ctx.save(); ctx.strokeStyle = th.s3; ctx.lineWidth = 1.8; ctx.beginPath();
      ctx.arc(cx, cy, 26, -rad(p.alpha), 0); ctx.stroke(); ctx.restore();
      const am = rad(p.alpha / 2), rr = 40;
      text(ctx, 'α', cx + rr * Math.cos(am), cy - rr * Math.sin(am) + 4, { color: th.s3, size: 13, align: 'center', bold: true });
    }
    arrow(ctx, cx, cy, tx, ty, th.accent, 3.5, 11);
    const fx = Math.min(w - 40, Math.max(40, tx + (ca >= 0 ? 4 : -4))), fyy = Math.max(30, ty - 8);
    text(ctx, 'F = ' + fmt(p.F, 0) + ' N', fx, fyy, { color: th.accent, size: 12, align: ca >= 0 ? 'left' : 'right', bold: true });
    // dấu của công
    const sg = phys.sign(p);
    text(ctx, SIGN_TXT[sg], w / 2, 16, { color: sg > 0 ? th.ok : sg < 0 ? th.bad : th.muted, size: 12, align: 'center', bold: true });
  },
  columns: [
    { k: 'F', label: 'F', unit: 'N', dec: 1 }, { k: 'alpha', label: 'α', unit: '°', dec: 0 },
    { k: 's', label: 's', unit: 'm', dec: 2 }, { k: 'A', label: 'A đo', unit: 'J', dec: 2 },
  ],
  recordLabel: 'Ghi số liệu (F, α, s, A)',
  note: 'Mỗi lần ghi: lực kế chia 0,1 N; thước đo góc chia 1°; thước chia 1 cm; công kế có sai số khoảng 0,5%. Khi α đổi, nhớ xoá bảng trước khi đo mới để đồ thị không bị lẫn.',
  record: (p, s, t, n) => ({
    F: n.round(p.F + n.noise(0.15), 0.1),
    alpha: n.round(p.alpha + n.noise(0.7), 1),
    s: n.round(s.s + n.noise(0.004), 0.01),
    A: n.round(s.A + n.noise(0.005 * Math.abs(s.A) + 0.03), 0.01),
  }),
  graphs: [
    { title: 'Đồ thị A – s', xlabel: 's (m)', ylabel: 'A (J)', x: 's', y: 'A', fit: 'origin', dec: 2,
      curve: (p) => [[0, 0], [p.d, phys.work(p, p.d)]], marker: (p, s) => [s.s, s.A], zeroX: true, zeroY: true },
    { title: 'Đồ thị A – α (tại s hiện tại)', xlabel: 'α (độ)', ylabel: 'A (J)', x: 'alpha', y: 'A',
      curve: (p, s) => Array.from({ length: 37 }, (_, i) => [i * 5, p.F * s.s * phys.cosd(i * 5)]), marker: (p, s) => [p.alpha, s.A], zeroX: true,
      range: () => ({ xmin: 0, xmax: 180 }) },
  ],
  predict: {
    prompt: '<p>Với F, α, d đang chọn, hãy dự đoán công của lực F khi hộp đi hết quãng đường d. (Công âm thì ghi dấu trừ.)</p>',
    fields: [{ k: 'A', label: 'Công A', unit: 'J' }],
    expected: (p) => ({ A: phys.work(p, p.d) }), tol: 0.02, absTol: 0.1,
    explain: (p) => `A = F·d·cosα = ${fmt(p.F, 0)}·${fmt(p.d, 1)}·cos${fmt(p.alpha, 0)}° = ${fmt(phys.work(p, p.d), 2)} J.`,
  },
  tasks: [
    {
      title: 'Tính công từ số liệu đo',
      prompt: '<p>Lấy <b>lần ghi cuối cùng</b> trong bảng số liệu (F, α, s). Tính công A = F·s·cosα rồi so với cột “A đo”.</p>',
      fields: [{ k: 'A', label: 'Công A tính được', unit: 'J' }],
      minRows: 1, tol: 0.03, absTol: 0.15,
      expected: (p, rows) => { const r = rows[rows.length - 1]; return { A: r.F * r.s * phys.cosd(r.alpha) }; },
      explain: (p, rows) => { const r = rows[rows.length - 1]; return `A = ${fmt(r.F, 1)}·${fmt(r.s, 2)}·cos${fmt(r.alpha, 0)}° = ${fmt(r.F * r.s * phys.cosd(r.alpha), 2)} J (công kế đọc ${fmt(r.A, 2)} J, chênh lệch do sai số đo).`; },
    },
    {
      title: 'Xử lí số liệu: thành phần lực sinh công',
      prompt: '<p>Giữ nguyên F và α, ghi ít nhất 5 lần đo ở các vị trí khác nhau (kéo thanh t). Đồ thị A – s là đường thẳng qua gốc toạ độ, <b>hệ số góc bằng F·cosα</b>. Đọc hệ số góc ở dưới đồ thị, rồi tính cosα = (F·cosα)/F với F là giá trị trung bình cột F.</p>',
      fields: [{ k: 'fx', label: 'F·cosα (hệ số góc)', unit: 'N', dec: 2, absTol: 0.3 }, { k: 'cos', label: 'cosα', unit: '', dec: 2, absTol: 0.03 }],
      minRows: 5, tol: 0.03,
      need: (rows) => {
        if (rows.length < 5) return 'Cần ghi ít nhất 5 lần đo ở phần thí nghiệm.';
        const al = rows.map((r) => r.alpha), F = rows.map((r) => r.F);
        if (Math.max(...al) - Math.min(...al) > 4 || Math.max(...F) - Math.min(...F) > 1.2) return 'Các lần đo phải có cùng F và α. Hãy bấm “Xóa bảng” rồi đo lại, chỉ thay đổi vị trí (kéo thanh t).';
        return null;
      },
      expected: (p, rows) => { const k = slopeOrigin(rows.map((r) => [r.s, r.A])); return { fx: k, cos: k / meanOf(rows.map((r) => r.F)) }; },
      explain: (p, rows, e) => `Hệ số góc = F·cosα ≈ ${fmt(e.fx, 2)} N; cosα ≈ ${fmt(e.cos, 2)}.` + (e.cos < -0.02 ? ' cosα &lt; 0 nên α &gt; 90°: công âm.' : ''),
      reference: (p) => `Giá trị cài đặt: F = ${fmt(p.F, 0)} N, α = ${fmt(p.alpha, 0)}°, F·cosα = ${fmt(phys.fx(p), 2)} N.`,
    },
  ],
  quiz: [
    { q: 'Lực F = 10 N hợp với phương chuyển dời góc 60°, vật đi được 4 m. Công của lực là:', o: ['40 J', '20 J', '34,6 J'], a: 1, why: 'A = F·s·cosα = 10·4·cos60° = 10·4·0,5 = 20 J.' },
    { q: 'Lực vuông góc với phương chuyển dời (α = 90°) thì công của lực:', o: ['dương', 'bằng 0', 'âm'], a: 1, why: 'cos90° = 0 nên A = 0 (ví dụ trọng lực khi vật chuyển động ngang).' },
    { q: 'Lực ma sát trượt 5 N cản vật trượt 3 m (α = 180°). Công của lực ma sát là:', o: ['15 J', '−15 J', '0'], a: 1, why: 'A = 5·3·cos180° = −15 J: công cản.' },
    { q: 'Xe đang chạy phanh gấp rồi dừng lại. Năng lượng chuyển động của xe chủ yếu chuyển hoá thành:', o: ['điện năng', 'nhiệt năng (làm nóng phanh, lốp, mặt đường)', 'quang năng'], a: 1, why: 'Lực ma sát sinh công cản; cơ năng của xe chuyển hoá thành nhiệt năng.' },
    { q: 'Công cơ học là số đo của:', o: ['độ lớn lực tác dụng', 'năng lượng được truyền hoặc chuyển hoá khi lực làm vật dịch chuyển', 'quãng đường vật đi được'], a: 1, why: 'Lực thực hiện công thì năng lượng được truyền từ vật này sang vật khác hoặc chuyển hoá dạng.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

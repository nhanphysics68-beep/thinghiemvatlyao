// Vật lí 10 – Bài 11: Thực hành đo gia tốc rơi tự do (nam châm điện, cổng quang, đồng hồ hiện số).
import { mountLab } from '../../core/lab.js';
import { linearFit, mean, fmt } from '../../core/stats.js';
import { text, circle, rect, line } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
export const G = 9.8;       // giá trị cài đặt trong mô phỏng
export const T0 = 0.3;      // bi được giữ bởi nam châm đến t = 0,3 s rồi thả
export const phys = {
  fall: (h) => Math.sqrt((2 * h) / G),          // thời gian rơi từ độ cao h tới cổng quang
  drop: (t) => 0.5 * G * t * t,                  // quãng đường rơi sau t
  gOf: (h, t) => (2 * h) / (t * t),              // g = 2h/t²
};
const SIG_T = 0.003, SIG_H = 0.001;              // dao động thời điểm nhả của nam châm; sai số đọc thước

export const spec = {
  seed: 1111,
  intro: 'Bi thép được giữ bởi nam châm điện, rồi rơi qua cổng quang điện nối với đồng hồ đo thời gian hiện số. Em đo thời gian rơi t ở nhiều độ cao h để tìm gia tốc rơi tự do g.',
  goals: [
    'Biết bố trí và sử dụng nam châm điện, cổng quang điện, đồng hồ đo thời gian hiện số.',
    'Từ h = ½gt², vẽ đồ thị h theo t² và xác định g từ độ dốc của đồ thị.',
    'Tính giá trị trung bình, sai số tuyệt đối và sai số tương đối của phép đo g.',
  ],
  theory: 'h = ½·g·t² &nbsp;&nbsp; g = 2h/t² &nbsp;&nbsp; Đồ thị h – t² là đường thẳng đi qua gốc, độ dốc k = g/2 &nbsp;&nbsp; Δg = trung bình của |g<sub>i</sub> − ḡ|',
  setup: 'Thước bên trái chia theo mét, gốc 0 tại cổng quang. Chọn độ cao h (khoảng cách từ bi đến cổng quang), bấm “Chạy” để thả bi và đợi bi qua cổng quang, rồi ghi số liệu. Lặp lại ở ít nhất 5 độ cao khác nhau, mỗi độ cao nên đo 2 – 3 lần.',
  params: [{ k: 'h', label: 'Độ cao rơi h', unit: 'm', min: 0.2, max: 1, step: 0.05, def: 0.5, dec: 2 }],
  toggles: [],
  stageHeight: 330,
  ariaLabel: 'Giá đỡ có nam châm điện giữ viên bi, cổng quang điện phía dưới và đồng hồ hiện số',
  duration: (p) => T0 + phys.fall(p.h) + 0.5,
  state(p, t) {
    const u = Math.max(0, t - T0), tf = phys.fall(p.h), uu = Math.min(u, tf);
    return { u: uu, y: phys.drop(uu), passed: u >= tf - 1e-9, released: u > 0 };
  },
  readouts: (p, s) => [['Đồng hồ', fmt(s.u, 3) + ' s'], ['bi đã rơi', fmt(s.y, 3) + ' m']],
  draw(ctx, { w, h }, s, p, t, th) {
    const yG = h - 46, ppm = (yG - 66) / 1.0, xr = 40, xb = Math.min(xr + 90, w * 0.42);
    const yM = yG - p.h * ppm;                                  // vị trí tâm bi lúc đầu
    const y = yM + s.y * ppm, r = 7;
    // thân giá đỡ, đế
    rect(ctx, xr - 26, yG + 24, 150, 10, th.ink, null, 3);
    rect(ctx, xr - 3, 40, 6, yG - 16, th.axis, null, 2);
    // thước (gốc 0 tại cổng quang, hướng lên)
    ctx.save(); ctx.strokeStyle = th.axis; ctx.fillStyle = th.muted; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (let m = 0; m <= 100; m += 5) { const yy = yG - (m / 100) * ppm, big = m % 10 === 0; ctx.beginPath(); ctx.moveTo(xr + 3, yy); ctx.lineTo(xr + (big ? 12 : 7), yy); ctx.stroke(); if (m % 20 === 0) ctx.fillText(String(m / 100).replace('.', ','), xr + 15, yy); }
    ctx.restore();
    // nam châm điện (cánh tay + cuộn), giữ bi bên dưới
    rect(ctx, xr + 3, yM - r - 14, xb - xr - 3 + 14, 7, th.axis, null, 2);
    rect(ctx, xb - 12, yM - r - 8, 24, 8, th.s3, null, 2);
    text(ctx, 'Nam châm điện', xr + 34, yM - r - 17, { color: th.muted, size: 11 });
    // cổng quang điện: hai nhánh + tia
    rect(ctx, xb - 28, yG - 10, 6, 24, th.ink, null, 2); rect(ctx, xb + 22, yG - 10, 6, 24, th.ink, null, 2);
    line(ctx, xb - 22, yG, xb + 22, yG, s.passed ? th.muted : th.bad, 1.5, [3, 3]);
    line(ctx, xb - 28, yG + 14, xb + 28, yG + 14, th.ink, 4);
    text(ctx, 'Cổng quang điện', xb + 34, yG + 4, { color: th.muted, size: 11 });
    // bi
    circle(ctx, xb, y, r, th.car, th.ink);
    // đồng hồ hiện số
    const bw = 118, bx = Math.max(xb + 40, w - bw - 10), by = 52;
    rect(ctx, bx, by, bw, 62, th.ink, null, 8);
    rect(ctx, bx + 8, by + 8, bw - 16, 30, '#10261b', null, 4);
    text(ctx, fmt(s.u, 3).replace('−', ''), bx + bw - 14, by + 31, { color: '#5CFF8A', size: 20, align: 'right', bold: true });
    text(ctx, 'Đồng hồ (s)', bx + bw / 2, by + 54, { color: th.card, size: 11, align: 'center' });
    line(ctx, xb + 28, yG + 2, bx + bw / 2, by + 62, th.line, 1, [3, 3]);
    text(ctx, s.passed ? 'Bi đã qua cổng quang' : s.released ? 'Bi đang rơi…' : 'Bi được nam châm giữ', 12, 18, { color: th.ink, size: 13, bold: true });
    text(ctx, 'h = ' + fmt(p.h, 2) + ' m', bx + bw / 2, by + 82, { color: th.ink, size: 12, align: 'center', bold: true });
  },
  columns: [
    { k: 'h', label: 'h', unit: 'm', dec: 3 }, { k: 't', label: 't', unit: 's', dec: 3 }, { k: 't2', label: 't²', unit: 's²', dec: 4 },
  ],
  recordLabel: 'Ghi số liệu (h, t)',
  note: 'Mỗi lần thả, đồng hồ cho số chỉ hơi khác nhau (nam châm nhả chậm nhanh không đều, khoảng 3 ms); thước đọc h chia đến 1 mm. Chỉ ghi được khi bi đã qua cổng quang.',
  record(p, s, t, n) {
    if (!s.passed) return { error: 'Hãy bấm “Chạy” và đợi bi rơi qua cổng quang rồi mới ghi số liệu.' };
    const hm = n.round(p.h + n.noise(SIG_H), 0.001), tm = n.round(phys.fall(p.h) + n.noise(SIG_T), 0.001);
    return { h: hm, t: tm, t2: n.round(tm * tm, 0.0001) };
  },
  demo: async (api) => {
    for (const h of [0.2, 0.35, 0.5, 0.65, 0.8, 0.95]) {
      api.setParam('h', h);
      for (let j = 0; j < 2; j++) { api.setT(api.duration()); api.record(); }
    }
  },
  graphs: [{
    title: 'Đồ thị h – t²', xlabel: 't² (s²)', ylabel: 'h (m)', x: 't2', y: 'h', fit: true, dec: 3, zeroX: true, zeroY: true,
    curve: () => [[0, 0], [0.21, 0.5 * G * 0.21]],
    marker: (p, s) => [s.u * s.u, s.y],
    range: () => ({ xmin: 0, xmax: 0.22, ymin: 0, ymax: 1.1 }),
  }],
  predict: {
    prompt: '<p>Bi thép rơi tự do không vận tốc đầu từ độ cao <b>h</b> đang chọn tới cổng quang. Hãy dự đoán số chỉ của đồng hồ (thời gian rơi) và tính t² (lấy g = 9,8 m/s²).</p>',
    fields: [{ k: 't', label: 'Thời gian rơi t', unit: 's', dec: 3 }, { k: 't2', label: 't²', unit: 's²', dec: 4 }],
    expected: (p) => ({ t: phys.fall(p.h), t2: (2 * p.h) / G }), tol: 0.02, absTol: 0.002,
    explain: (p) => `t = √(2h/g) = ${fmt(phys.fall(p.h), 3)} s; t² = 2h/g = ${fmt((2 * p.h) / G, 4)} s².`,
  },
  tasks: [
    {
      title: 'Xử lí số liệu: g từ đồ thị h – t²',
      prompt: '<p>Đọc <b>độ dốc k</b> của đường khớp ở chú thích dưới đồ thị h – t² (hệ số trước x). Vì h = ½·g·t² nên g = 2k. (Cần ít nhất 5 lần đo ở ít nhất 3 độ cao khác nhau.)</p>',
      fields: [{ k: 'k', label: 'Độ dốc k', unit: 'm/s²', dec: 3 }, { k: 'g', label: 'g = 2k', unit: 'm/s²' }],
      tol: 0.03, absTol: 0.03,
      need: (rows) => {
        if (rows.length < 5) return 'Cần ghi ít nhất 5 lần đo ở phần thí nghiệm.';
        return new Set(rows.map((r) => r.h.toFixed(2))).size < 3 ? 'Hãy đo ở ít nhất 3 độ cao h khác nhau (đổi thanh trượt h).' : null;
      },
      expected: (p, rows) => { const f = linearFit(rows.map((r) => [r.t2, r.h])); return { k: f.slope, g: 2 * f.slope }; },
      reference: () => 'Giá trị cài đặt trong mô phỏng: g = 9,8 m/s² (k = 4,9 m/s²).',
    },
    {
      title: 'Xử lí số liệu: g trung bình và sai số',
      prompt: '<p>Với mỗi lần đo tính g<sub>i</sub> = 2h/t². Tính <b>ḡ</b> (trung bình các g<sub>i</sub>), <b>Δg</b> = trung bình của |g<sub>i</sub> − ḡ| (sai số tuyệt đối trung bình) và <b>sai số tương đối</b> δ = Δg/ḡ·100%.</p>',
      fields: [{ k: 'g', label: 'ḡ', unit: 'm/s²' }, { k: 'dg', label: 'Δg', unit: 'm/s²' }, { k: 'rel', label: 'δ', unit: '%', dec: 1, absTol: 0.2 }],
      minRows: 5, tol: 0.03, absTol: 0.03,
      expected: (p, rows) => {
        const gs = rows.map((r) => phys.gOf(r.h, r.t)), g = mean(gs), dg = mean(gs.map((x) => Math.abs(x - g)));
        return { g, dg, rel: (dg / g) * 100 };
      },
      explain: (p, rows, e) => `Kết quả: g = ${fmt(e.g)} ± ${fmt(e.dg)} m/s².`,
      reference: () => 'Giá trị cài đặt trong mô phỏng: g = 9,8 m/s². Nếu 9,8 nằm trong khoảng ḡ ± Δg thì phép đo phù hợp.',
    },
  ],
  quiz: [
    { q: 'Vì sao đồ thị h theo t² là đường thẳng đi qua gốc toạ độ?', o: ['Vì h = ½g·t² là hàm bậc nhất của t²', 'Vì vận tốc rơi không đổi', 'Vì bi rơi với gia tốc bằng 0'], a: 0, why: 'h = (g/2)·t²: h tỉ lệ thuận với t², hệ số tỉ lệ là g/2.' },
    { q: 'Đồ thị h – t² có độ dốc 4,9 m/s². Gia tốc rơi tự do đo được là:', o: ['4,9 m/s²', '9,8 m/s²', '2,45 m/s²'], a: 1, why: 'g = 2k = 2·4,9 = 9,8 m/s².' },
    { q: 'Bi rơi 0,45 m mất 0,303 s. Giá trị g = 2h/t² gần nhất là:', o: ['9,8 m/s²', '14,9 m/s²', '4,9 m/s²'], a: 0, why: 'g = 2·0,45/0,303² = 0,9/0,0918 ≈ 9,8 m/s².' },
    { q: 'Để giảm sai số ngẫu nhiên của phép đo g, nên:', o: ['chỉ đo một lần ở độ cao lớn nhất', 'đo nhiều lần, lấy giá trị trung bình', 'bỏ qua đồng hồ, dùng đồng hồ bấm tay'], a: 1, why: 'Lấy trung bình của nhiều lần đo làm giảm ảnh hưởng của sai số ngẫu nhiên.' },
    { q: 'Cổng quang điện trong thí nghiệm có nhiệm vụ:', o: ['giữ bi trước khi thả', 'đo độ cao h', 'báo hiệu lúc bi đi qua để đồng hồ dừng'], a: 2, why: 'Khi bi che tia sáng, cổng quang gửi tín hiệu làm đồng hồ dừng đếm.' },
  ],
};

export const mount = (root, entry) => mountLab(root, entry, spec);

// Vật lí 10 – Bài 1: Làm quen với Vật lí (quy trình nghiên cứu: giả thuyết – thí nghiệm – kết luận).
import { mountLab } from '../../core/lab.js';
import { linearFit, mean, fmt } from '../../core/stats.js';
import { text, line, rect, circle } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
// Vật rơi tự do trong ống đã hút hết không khí (bỏ qua lực cản): h = ½gt², không phụ thuộc khối lượng.
export const G = 9.8, H0 = 2, M0 = 1;           // g = 9,8 m/s²; độ cao cố định H0 khi đổi m; khối lượng cố định M0 khi đổi h
export const phys = {
  g: G,
  fallTime: (h) => Math.sqrt((2 * h) / G),
  y: (p, t) => Math.max(0, p.h - 0.5 * G * t * t),                      // độ cao so với đáy ống tại t
  v: (p, t) => G * Math.min(t, phys.fallTime(p.h)),
};
const isA = (r) => Math.abs(r.h - H0) < 1e-9;       // nhóm thí nghiệm 1: đổi m, giữ h = 2 m
const isB = (r) => Math.abs(r.m - M0) < 1e-9;       // nhóm thí nghiệm 2: đổi h, giữ m = 1 kg
const groupA = (rows) => rows.filter(isA), groupB = (rows) => rows.filter(isB);

export const spec = {
  seed: 1001,
  intro: 'Em đóng vai nhà nghiên cứu: đặt giả thuyết về chuyển động rơi của vật, làm thí nghiệm bằng cách chỉ đổi một đại lượng mỗi lần, đo thời gian rơi rồi rút ra kết luận từ số liệu.',
  goals: [
    'Nêu được các bước của quy trình nghiên cứu: quan sát – giả thuyết – thí nghiệm – xử lí số liệu – kết luận.',
    'Biết cách kiểm tra giả thuyết: chỉ thay đổi một đại lượng, giữ nguyên các đại lượng còn lại.',
    'Dùng số liệu đo để bác bỏ hoặc ủng hộ giả thuyết và tìm quy luật t² = 2h/g.',
  ],
  theory: '<b>Quy trình:</b> quan sát → đặt vấn đề → giả thuyết → thí nghiệm kiểm tra → phân tích số liệu → kết luận.<br>Giả thuyết 1: “vật nặng rơi nhanh hơn” (t phụ thuộc m). Giả thuyết 2: “thả càng cao, thời gian rơi càng dài” (t phụ thuộc h).<br>Với rơi tự do: h = ½gt² nên t² = (2/g)·h (g = 9,8 m/s²).',
  setup: 'Quả cầu được thả từ đỉnh một ống đã hút hết không khí; đồng hồ điện tử đo thời gian rơi tới đáy. Chọn biến cần đổi: thí nghiệm 1 đổi khối lượng m (giữ h = 2 m); thí nghiệm 2 đổi độ cao h (giữ m = 1 kg). Mỗi thí nghiệm cần ít nhất 4 lần đo ở các giá trị khác nhau; bảng giữ cả hai nhóm số liệu.',
  choices: [{ k: 'var', label: 'Biến em thay đổi', options: [['m', 'Thí nghiệm 1: đổi khối lượng m'], ['h', 'Thí nghiệm 2: đổi độ cao h']], def: 'm', string: true, keepRows: true }],
  params: [
    { k: 'm', label: 'Khối lượng quả cầu m', unit: 'kg', min: 0.1, max: 2, step: 0.1, def: M0, dec: 1, show: (p) => p.var === 'm' },
    { k: 'h', label: 'Độ cao thả h', unit: 'm', min: 0.5, max: 5, step: 0.5, def: H0, dec: 1, show: (p) => p.var === 'h' },
  ],
  onChoice(p) { if (p.var === 'm') p.h = H0; else p.m = M0; },
  stageHeight: 270,
  ariaLabel: 'Quả cầu rơi trong ống thẳng đứng có thước đo độ cao, các chấm cách nhau 0,1 giây cho thấy quãng đường rơi tăng dần',
  duration: (p) => phys.fallTime(p.h) + 0.4,
  state: (p, t) => ({ y: phys.y(p, t), v: phys.v(p, t), fell: t >= phys.fallTime(p.h) }),
  readouts: (p, s) => [['độ cao', fmt(s.y, 2) + ' m'], ['v', fmt(s.v, 2) + ' m/s']],
  draw(ctx, { w, h }, s, p, t, th) {
    const top = 22, yb = h - 26, ppm = (yb - top) / 5.4, Y = (m) => yb - m * ppm, cx = Math.min(w * 0.32, 130);
    // thước đo độ cao
    line(ctx, 46, Y(0), 46, Y(5.2), th.axis, 1.5);
    for (let m = 0; m <= 5; m += 0.5) { line(ctx, 46, Y(m), 46 + (m % 1 === 0 ? 9 : 5), Y(m), th.axis, 1); if (m % 1 === 0) text(ctx, String(m), 40, Y(m) + 4, { color: th.muted, size: 11, align: 'right' }); }
    text(ctx, 'h (m)', 46, 12, { color: th.muted, size: 11, align: 'center' });
    // ống thủy tinh đã hút khí
    rect(ctx, cx - 26, Y(5.3), 52, Y(0) - Y(5.3) + 6, th.soft, th.axis, 10);
    rect(ctx, cx - 30, yb + 6, 60, 8, th.road, th.axis, 2);
    text(ctx, 'ống đã hút khí', cx + 38, Y(4.9), { color: th.muted, size: 11 });
    // vạch độ cao thả và các vị trí cách nhau 0,1 s
    line(ctx, cx - 38, Y(p.h), cx + 26, Y(p.h), th.bad, 1.5, [4, 3]); text(ctx, `h = ${fmt(p.h, 1)} m`, cx + 38, Y(p.h) + 4, { color: th.bad, size: 12 });
    const r = 7 + 5 * Math.cbrt(p.m);
    for (let k = 1; k * 0.1 <= t + 1e-9 && k * 0.1 < phys.fallTime(p.h); k++) circle(ctx, cx, Y(phys.y(p, k * 0.1)), 2.5, th.s2);
    circle(ctx, cx, Y(s.y) - r, r, th.car, th.ink);
    text(ctx, `m = ${fmt(p.m, 1)} kg`, cx + 38, Y(s.y) - r + 4, { color: th.ink, size: 12 });
    // bảng kết quả nhỏ bên phải: biến đang đổi và biến giữ nguyên
    const bx = Math.max(cx + 150, w * 0.58);
    if (bx + 100 < w) {
      rect(ctx, bx, 30, w - bx - 14, 98, th.card, th.line, 8);
      text(ctx, 'Thí nghiệm đang làm', bx + 10, 50, { color: th.ink, size: 12, bold: true });
      text(ctx, p.var === 'm' ? 'Đổi: khối lượng m' : 'Đổi: độ cao h', bx + 10, 72, { color: th.accent, size: 12 });
      text(ctx, p.var === 'm' ? 'Giữ nguyên: h = 2 m' : 'Giữ nguyên: m = 1 kg', bx + 10, 92, { color: th.muted, size: 12 });
      text(ctx, 'Đo: thời gian rơi t', bx + 10, 112, { color: th.muted, size: 12 });
    }
  },
  columns: [
    { k: 'm', label: 'm', unit: 'kg', dec: 1 }, { k: 'h', label: 'h', unit: 'm', dec: 1 },
    { k: 't', label: 't', unit: 's', dec: 3 }, { k: 't2', label: 't²', unit: 's²', dec: 3 },
  ],
  recordLabel: 'Đo thời gian rơi (m, h, t)',
  note: 'Đồng hồ điện tử đo thời gian rơi, chia 0,001 s, sai số ngẫu nhiên khoảng 0,004 s. Dùng g = 9,8 m/s².',
  record(p, s, t, n) {
    const tm = n.round(phys.fallTime(p.h) + n.noise(0.004), 0.001);
    const row = { m: p.m, h: p.h, t: tm, t2: tm * tm };
    row.mA = isA(row) ? row.m : NaN; row.tA = isA(row) ? tm : NaN;           // nhóm 1 dùng cho đồ thị t – m
    row.hB = isB(row) ? row.h : NaN; row.t2B = isB(row) ? tm * tm : NaN;      // nhóm 2 dùng cho đồ thị t² – h
    return row;
  },
  graphs: [
    { title: 'Thí nghiệm 1: t theo m (h = 2 m)', xlabel: 'm (kg)', ylabel: 't (s)', x: 'mA', y: 'tA', fit: true, dec: 3, zeroX: true, zeroY: true, range: () => ({ xmin: 0, xmax: 2.1, ymin: 0, ymax: 1 }) },
    { title: 'Thí nghiệm 2: t² theo h (m = 1 kg)', xlabel: 'h (m)', ylabel: 't² (s²)', x: 'hB', y: 't2B', fit: 'origin', dec: 4, zeroX: true, zeroY: true, range: () => ({ xmin: 0, xmax: 5.2, ymin: 0, ymax: 1.1 }) },
  ],
  predict: {
    prompt: '<p><b>Giả thuyết của em:</b> thả quả cầu có khối lượng gấp <b>4 lần</b> từ cùng độ cao thì thời gian rơi t′ gấp bao nhiêu lần thời gian rơi t ban đầu? (Điền tỉ số t′/t, rồi dùng thí nghiệm 1 để kiểm tra.)</p>',
    fields: [{ k: 'ratio', label: 't′/t', unit: '', dec: 2 }],
    expected: () => ({ ratio: 1 }), tol: 0.03, absTol: 0.03,
    explain: () => 'Trong ống đã hút khí, mọi vật rơi như nhau: t = √(2h/g) không phụ thuộc khối lượng nên t′/t = 1. Nhiều người dự đoán “nặng rơi nhanh hơn” — số liệu thí nghiệm sẽ bác bỏ điều đó.',
  },
  tasks: [
    {
      title: 'Kiểm tra giả thuyết 1: thời gian rơi có phụ thuộc khối lượng?',
      prompt: '<p>Chọn thí nghiệm 1 (h = 2 m), đổi m và ghi ít nhất 4 lần đo với ít nhất 3 khối lượng khác nhau. Tính thời gian rơi trung bình <b>t̄</b> và đọc <b>hệ số góc</b> của đường khớp t theo m (chú thích dưới đồ thị 1). Nếu hệ số góc gần 0 thì t không phụ thuộc m.</p>',
      fields: [{ k: 'tbar', label: 't̄ (nhóm 1)', unit: 's', dec: 3 }, { k: 'slope', label: 'Hệ số góc của t theo m', unit: 's/kg', dec: 3 }],
      need: (rows) => { const a = groupA(rows); return a.length >= 4 && new Set(a.map((r) => Math.round(r.m * 10))).size >= 3 ? null : 'Cần ít nhất 4 lần đo ở thí nghiệm 1 (h = 2 m) với ít nhất 3 khối lượng m khác nhau.'; },
      tol: 0.03, absTol: 0.004,
      expected: (p, rows) => { const a = groupA(rows); return { tbar: mean(a.map((r) => r.t)), slope: linearFit(a.map((r) => [r.m, r.t])).slope }; },
      explain: () => 'Hệ số góc ≈ 0 (chỉ khác 0 do sai số đo): thời gian rơi không phụ thuộc khối lượng. Giả thuyết “vật nặng rơi nhanh hơn” bị bác bỏ.',
      reference: () => `Lí thuyết: t = √(2·2/9,8) = ${fmt(phys.fallTime(2), 3)} s với mọi khối lượng.`,
    },
    {
      title: 'Kiểm tra giả thuyết 2: quy luật giữa t và độ cao h',
      prompt: '<p>Chọn thí nghiệm 2 (m = 1 kg), đổi h và ghi ít nhất 4 lần đo với ít nhất 3 độ cao khác nhau. Đồ thị t² theo h là đường thẳng qua gốc: đọc <b>hệ số góc k</b> trong chú thích đồ thị 2 rồi tính <b>g = 2/k</b>.</p>',
      fields: [{ k: 'k', label: 'Hệ số góc k', unit: 's²/m', dec: 4 }, { k: 'g', label: 'g = 2/k', unit: 'm/s²', dec: 2 }],
      need: (rows) => { const b = groupB(rows); return b.length >= 4 && new Set(b.map((r) => Math.round(r.h * 10))).size >= 3 ? null : 'Cần ít nhất 4 lần đo ở thí nghiệm 2 (m = 1 kg) với ít nhất 3 độ cao h khác nhau.'; },
      tol: 0.03, absTol: 0.002,
      expected: (p, rows) => { const b = groupB(rows); let sxy = 0, sxx = 0; for (const r of b) { sxy += r.h * r.t2; sxx += r.h * r.h; } return { k: sxy / sxx, g: 2 / (sxy / sxx) }; },
      explain: () => 'Đồ thị t² – h là đường thẳng qua gốc nên t² tỉ lệ thuận với h: h = ½gt². Kết luận: thả càng cao thì rơi càng lâu, nhưng không theo tỉ lệ thuận với h mà theo t ∝ √h.',
      reference: () => `Giá trị chuẩn: k = 2/g = ${fmt(2 / G, 4)} s²/m ứng với g = 9,8 m/s².`,
    },
  ],
  quiz: [
    { q: 'Trong quy trình nghiên cứu, bước nào thực hiện ngay sau khi đặt ra giả thuyết?', o: ['Rút ra kết luận', 'Làm thí nghiệm để kiểm tra giả thuyết', 'Quan sát hiện tượng'], a: 1, why: 'Giả thuyết cần được kiểm tra bằng thí nghiệm; sau đó phân tích số liệu mới rút ra kết luận.' },
    { q: 'Để kiểm tra ảnh hưởng của khối lượng đến thời gian rơi, ta phải:', o: ['thay đổi cả m và h cùng lúc', 'chỉ đo đúng một lần', 'chỉ đổi m, giữ nguyên độ cao h'], a: 2, why: 'Chỉ thay đổi một đại lượng, giữ nguyên các đại lượng khác thì mới biết kết quả do đại lượng nào gây ra.' },
    { q: 'Thả vật từ độ cao 1,25 m trong chân không (g = 9,8 m/s²). Thời gian rơi gần bằng:', o: ['0,25 s', '0,51 s', '1,0 s'], a: 1, why: 't = √(2h/g) = √(2·1,25/9,8) ≈ 0,51 s.' },
    { q: 'Số liệu thí nghiệm cho thấy giả thuyết “vật nặng rơi nhanh hơn” sai. Em cần:', o: ['bỏ số liệu không phù hợp', 'sửa hoặc loại bỏ giả thuyết', 'lặp thí nghiệm cho tới khi được kết quả mong muốn'], a: 1, why: 'Kết luận khoa học phải dựa trên số liệu; giả thuyết không phù hợp thì phải điều chỉnh hoặc bác bỏ.' },
    { q: 'Đồ thị t² theo h là đường thẳng qua gốc có hệ số góc k = 0,204 s²/m. Gia tốc rơi g = 2/k bằng:', o: ['4,9 m/s²', '9,8 m/s²', '19,6 m/s²'], a: 1, why: 'g = 2/0,204 ≈ 9,8 m/s².' },
  ],
  async demo(api) {
    api.setParam('h', 2);
    for (const m of [0.2, 0.5, 1, 1.5, 2]) { api.setParam('m', m); api.record(); }
    api.setParam('m', 1);
    for (const h of [0.5, 1, 3, 4, 5]) { api.setParam('h', h); api.record(); }
  },
};

export const mount = (root, entry) => mountLab(root, entry, spec);

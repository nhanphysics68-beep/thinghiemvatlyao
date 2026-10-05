// Vật lí 10 – Bài 3: Thực hành tính sai số trong phép đo. Ghi kết quả đo.
import { mountLab } from '../../core/lab.js';
import { mean, fmt } from '../../core/stats.js';
import { text, line, rect, circle } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
// Mỗi chế độ: đại lượng thật, độ chia nhỏ nhất (ĐCNN), độ lệch chuẩn của sai số ngẫu nhiên (đọc số, thao tác).
export const MODES = {
  L1: { kind: 'L', name: 'Chiều dài – thước thẳng 1 mm', truth: 128.37, step: 1, sigma: 0.35, unit: 'mm' },
  L2: { kind: 'L', name: 'Chiều dài – thước kẹp 0,1 mm', truth: 128.37, step: 0.1, sigma: 0.07, unit: 'mm' },
  L3: { kind: 'L', name: 'Chiều dài – thước kẹp 0,02 mm', truth: 128.37, step: 0.02, sigma: 0.015, unit: 'mm' },
  T1: { kind: 'T', name: 'Thời gian – đồng hồ cơ 0,1 s', truth: 20.07, step: 0.1, sigma: 0.15, unit: 's' },
  T2: { kind: 'T', name: 'Thời gian – đồng hồ điện tử 0,01 s', truth: 20.07, step: 0.01, sigma: 0.12, unit: 's' },
  T3: { kind: 'T', name: 'Thời gian – cổng quang 0,001 s', truth: 20.07, step: 0.001, sigma: 0.003, unit: 's' },
};
const decOf = (step) => Math.max(0, Math.round(-Math.log10(step)));
export const phys = {
  MODES, decOf,
  // Một lần đo: giá trị thật + sai số ngẫu nhiên, rồi làm tròn theo ĐCNN (đọc số trên dụng cụ).
  measure: (m, noise, round) => round(m.truth + noise(m.sigma), m.step),
  // Xử lí số liệu theo SGK: Ā; ΔA_i = |A_i − Ā|; ΔĀ = trung bình các ΔA_i; ΔA′ = ĐCNN/2; ΔA = ΔĀ + ΔA′; δ = ΔA/Ā.
  analyze(vals, step) {
    const m = mean(vals), dm = mean(vals.map((v) => Math.abs(v - m))), dI = step / 2, dA = dm + dI;
    return { mean: m, dMean: dm, dInst: dI, dAbs: dA, dRel: (dA / m) * 100 };
  },
};

export const spec = {
  seed: 3003,
  intro: 'Em đo nhiều lần cùng một đại lượng (chiều dài bút chì, hoặc thời gian 10 dao động của con lắc đơn dài 1 m) bằng các dụng cụ có độ chia nhỏ nhất khác nhau rồi tính sai số.',
  goals: [
    'Phân biệt sai số ngẫu nhiên (các lần đo khác nhau) với sai số dụng cụ (do độ chia nhỏ nhất).',
    'Tính giá trị trung bình Ā, sai số tuyệt đối trung bình ΔĀ, sai số dụng cụ ΔA′ và sai số tuyệt đối ΔA.',
    'Tính sai số tương đối δ và viết kết quả đo A = Ā ± ΔA.',
  ],
  theory: 'Ā = (A₁ + A₂ + … + Aₙ)/n &nbsp;&nbsp; ΔAᵢ = |Aᵢ − Ā| &nbsp;&nbsp; ΔĀ = (ΔA₁ + … + ΔAₙ)/n<br>ΔA′ = ĐCNN/2 (sai số dụng cụ) &nbsp;&nbsp; ΔA = ΔĀ + ΔA′ &nbsp;&nbsp; δ = (ΔA/Ā)·100%<br>Kết quả: A = Ā ± ΔA',
  setup: 'Chọn phép đo (chiều dài cây bút chì bằng thước thẳng hoặc thước kẹp; thời gian 10 dao động của con lắc đơn dài 1 m bằng đồng hồ cơ, đồng hồ điện tử hoặc cổng quang điện; số cuối là ĐCNN) rồi bấm “Đo” nhiều lần (ít nhất 5). Khung phóng đại cho thấy vùng đầu mút của vật trên thang chia; mũi tên đỏ là số đọc của lần đo gần nhất. Đổi dụng cụ sẽ xóa bảng.',
  choices: [{ k: 'mode', label: 'Phép đo và dụng cụ', options: Object.entries(MODES).map(([k, v]) => [k, v.name]), def: 'L1', string: true }],
  init(p) { p.last = null; },
  onChoice(p) { p.last = null; },
  stageHeight: 212,
  ariaLabel: 'Thang đo phóng đại vùng đầu mút của vật hoặc đồng hồ bấm giây hiển thị kết quả lần đo gần nhất',
  state: (p) => ({ last: p.last }),
  readouts: (p) => { const m = MODES[p.mode]; return [['Đại lượng', m.kind === 'L' ? 'chiều dài (mm)' : 'thời gian 10 dao động (s)'], ['ĐCNN', fmt(m.step, decOf(m.step)) + ' ' + m.unit]]; },
  draw(ctx, { w, h }, s, p, t, th) {
    const m = MODES[p.mode], dec = decOf(m.step), x0 = 20, bw = w - 40;
    if (m.kind === 'L') {
      // hàng trên: bút chì đặt cạnh thước 0–150 mm (tỉ lệ thật)
      const ppm = bw / 150, yr = 62;
      rect(ctx, x0, yr, bw, 16, th.soft, th.axis, 2);
      for (let mm = 0; mm <= 150; mm += 10) { line(ctx, x0 + mm * ppm, yr, x0 + mm * ppm, yr + (mm % 50 === 0 ? 11 : 7), th.axis, 1); if (mm % 50 === 0 && mm < 150) text(ctx, String(mm), x0 + mm * ppm, yr + 28, { color: th.muted, size: 11, align: 'center' }); }
      text(ctx, 'mm', x0 + bw, yr + 28, { color: th.muted, size: 11, align: 'right' });
      const pl = m.truth * ppm; rect(ctx, x0, yr - 24, pl - 10, 16, th.car, null, 2);
      ctx.beginPath(); ctx.moveTo(x0 + pl - 10, yr - 24); ctx.lineTo(x0 + pl, yr - 16); ctx.lineTo(x0 + pl - 10, yr - 8); ctx.closePath(); ctx.fillStyle = th.ink; ctx.fill();
      text(ctx, 'Bút chì', x0 + 4, yr - 30, { color: th.ink, size: 12 });
      // khung phóng đại quanh đầu mút
      const zy = 142, half = 6 * m.step, a = m.truth - half, X = (v) => x0 + ((v - a) / (2 * half)) * bw;
      line(ctx, x0 + pl, yr - 6, x0 + bw / 2, zy - 42, th.axis, 1, [3, 3]);
      rect(ctx, x0 - 6, zy - 44, bw + 12, 88, th.card, th.line, 6);
      text(ctx, 'Phóng đại vùng đầu mút', x0, zy - 28, { color: th.muted, size: 11 });
      line(ctx, x0, zy, x0 + bw, zy, th.axis, 1.5);
      const k0 = Math.ceil(a / m.step - 1e-9);
      for (let k = k0, i = 0; k * m.step <= a + 2 * half + 1e-9; k++, i++) {
        const v = k * m.step, X0 = X(v), lab = i % 2 === 0;
        line(ctx, X0, zy, X0, zy + (lab ? 12 : 7), th.axis, 1);
        if (lab) text(ctx, fmt(v, dec), X0, zy + 25, { color: th.muted, size: 11, align: 'center' });
      }
      rect(ctx, X(m.truth) - 60, zy - 14, 60, 12, th.car, null, 2);                 // đầu mút bút chì
      line(ctx, X(m.truth), zy - 18, X(m.truth), zy + 2, th.ink, 2);
      if (s.last != null) {
        const lx = Math.max(x0 + 4, Math.min(x0 + bw - 4, X(s.last)));
        ctx.beginPath(); ctx.moveTo(lx, zy + 3); ctx.lineTo(lx - 6, zy + 15); ctx.lineTo(lx + 6, zy + 15); ctx.closePath(); ctx.fillStyle = th.bad; ctx.fill();
        text(ctx, 'Đọc: ' + fmt(s.last, dec) + ' mm', x0 + bw - 2, zy - 28, { color: th.bad, size: 12, align: 'right', bold: true });
      }
    } else {
      // con lắc đơn và đồng hồ bấm giây
      const cx = Math.min(70, w * 0.22), top = 24, L = h - 70, ang = 0.28;
      line(ctx, cx - 28, top, cx + 28, top, th.ink, 4);
      const bx = cx + Math.sin(ang) * L * 0.8, by = top + Math.cos(ang) * L * 0.8;
      line(ctx, cx, top, bx, by, th.ink, 1.5); circle(ctx, bx, by, 11, th.car, th.ink);
      line(ctx, cx, top, cx, top + L * 0.8, th.axis, 1, [3, 3]);
      text(ctx, 'l = 1 m, 10 dao động', cx - 20, h - 12, { color: th.muted, size: 11 });
      const dx = Math.max(cx + 80, w * 0.42), dw = w - dx - 14, dh = 74, dy = 44;
      rect(ctx, dx, dy, dw, dh, th.ink, null, 10); rect(ctx, dx + 8, dy + 8, dw - 16, dh - 16, '#10231a', null, 6);
      ctx.save(); ctx.fillStyle = '#4cf08a'; ctx.font = `600 ${Math.min(30, dw / 7)}px ui-monospace, Menlo, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.last == null ? '--,' + '-'.repeat(Math.max(1, dec)) : fmt(s.last, dec), dx + dw / 2, dy + dh / 2 - 2); ctx.restore();
      text(ctx, 'giây', dx + dw - 14, dy + dh - 12, { color: '#4cf08a', size: 11, align: 'right' });
      text(ctx, `ĐCNN ${fmt(m.step, dec)} s`, dx + dw / 2, dy + dh + 22, { color: th.muted, size: 12, align: 'center' });
      text(ctx, m.step <= 0.001 ? 'Cổng quang: không phụ thuộc phản xạ người đo' : 'Người bấm có độ trễ khi bấm/ngắt', dx + dw / 2, dy + dh + 40, { color: th.muted, size: 11, align: 'center' });
    }
  },
  columns: [{ k: 'A', label: 'A', unit: '', dec: 3 }, { k: 'm', label: 'Ā (đến lần này)', unit: '', dec: 3 }],
  recordLabel: 'Đo một lần',
  note: 'Số liệu là mm (chiều dài) hoặc s (thời gian). Khi tắt “sai số đo”, mọi lần đo cho cùng số đọc nên ΔĀ = 0 — nhưng vẫn còn sai số dụng cụ ΔA′.',
  record(p, s, t, n, rows) {
    const A = phys.measure(MODES[p.mode], n.noise, n.round);
    p.last = A;
    return { n: rows.length + 1, A, m: mean([...rows.map((r) => r.A), A]) };
  },
  graphs: [
    { title: 'Giá trị từng lần đo Aᵢ', xlabel: 'Lần đo', ylabel: 'A', x: 'n', y: 'A', dec: 3 },
    { title: 'Giá trị trung bình Ā theo số lần đo', xlabel: 'Số lần đo', ylabel: 'Ā', x: 'n', y: 'm', dec: 3 },
  ],
  predict: {
    prompt: '<p>Dụng cụ em đang chọn có độ chia nhỏ nhất (ĐCNN) ghi ở khung số liệu phía trên. Hãy dự đoán <b>sai số dụng cụ ΔA′</b> (lấy bằng nửa ĐCNN), cùng đơn vị với ĐCNN.</p>',
    fields: [{ k: 'dI', label: 'ΔA′', unit: 'mm hoặc s', dec: 4 }],
    expected: (p) => ({ dI: MODES[p.mode].step / 2 }), tol: 0.02, absTol: 1e-6,
    explain: (p) => `ΔA′ = ĐCNN/2 = ${fmt(MODES[p.mode].step, decOf(MODES[p.mode].step))}/2 = ${fmt(MODES[p.mode].step / 2, decOf(MODES[p.mode].step) + 1)} ${MODES[p.mode].unit}.`,
  },
  tasks: [{
    title: 'Xử lí số liệu: sai số và kết quả đo',
    prompt: '<p>Ghi ít nhất 5 lần đo. Tính <b>Ā</b>, <b>ΔĀ</b> (trung bình của |Aᵢ − Ā|), sai số tuyệt đối <b>ΔA = ΔĀ + ΔA′</b> (ΔA′ = ĐCNN/2) và sai số tương đối <b>δ</b> (%). Viết kết quả A = Ā ± ΔA.</p>',
    fields: [
      { k: 'mean', label: 'Ā', unit: '', dec: 3 }, { k: 'dMean', label: 'ΔĀ', unit: '', dec: 4 },
      { k: 'dAbs', label: 'ΔA', unit: '', dec: 4 }, { k: 'dRel', label: 'δ', unit: '%', dec: 3 },
    ],
    minRows: 5, tol: 0.03, absTol: 2e-4,
    expected: (p, rows) => phys.analyze(rows.map((r) => r.A), MODES[p.mode].step),
    explain: (p, rows, e) => { const d = decOf(MODES[p.mode].step) + 1; return `Kết quả: A = ${fmt(e.mean, d)} ± ${fmt(e.dAbs, d)} ${MODES[p.mode].unit}, δ = ${fmt(e.dRel, 3)} %.`; },
    reference: (p, rows) => {
      const m = MODES[p.mode], e = phys.analyze(rows.map((r) => r.A), m.step), inside = Math.abs(m.truth - e.mean) <= e.dAbs + 1e-9;
      return `Giá trị chuẩn cài trong mô phỏng: ${fmt(m.truth, 2)} ${m.unit}. Khoảng Ā ± ΔA ${inside ? 'chứa' : 'không chứa'} giá trị chuẩn.`;
    },
  }],
  quiz: [
    { q: 'Dụng cụ có độ chia nhỏ nhất 1 mm. Sai số dụng cụ ΔA′ thường lấy là:', o: ['0,5 mm', '1 cm', '0,1 mm'], a: 0, why: 'ΔA′ lấy bằng một nửa độ chia nhỏ nhất: 1 mm / 2 = 0,5 mm.' },
    { q: 'Đo bề dày vật năm lần được 2,0; 2,1; 2,0; 1,9; 2,0 (mm). Giá trị trung bình và ΔĀ là:', o: ['2,0 mm và 0,04 mm', '2,0 mm và 0,10 mm', '2,0 mm và 0,20 mm'], a: 0, why: 'Ā = 10,0/5 = 2,0 mm; |ΔAᵢ| = 0; 0,1; 0; 0,1; 0 nên ΔĀ = 0,2/5 = 0,04 mm.' },
    { q: 'Kết quả đo A = 50,0 ± 0,5 cm. Sai số tương đối δ bằng:', o: ['0,5 %', '1 %', '10 %'], a: 1, why: 'δ = 0,5/50,0 × 100 % = 1 %.' },
    { q: 'Để giảm ảnh hưởng của sai số ngẫu nhiên ta nên:', o: ['chỉ đo một lần thật cẩn thận', 'đo nhiều lần rồi lấy giá trị trung bình', 'chọn dụng cụ cũ hơn'], a: 1, why: 'Các sai số ngẫu nhiên lệch hai phía, lấy trung bình nhiều lần sẽ bù trừ phần lớn.' },
    { q: 'Đồng hồ bấm giây có ĐCNN 0,01 s nhưng người bấm chậm khoảng 0,1 s. Sai số của phép đo chủ yếu do:', o: ['ĐCNN của đồng hồ', 'dây treo con lắc', 'thao tác của người đo (sai số ngẫu nhiên)'], a: 2, why: 'Độ trễ khi bấm lớn hơn ĐCNN nhiều lần nên dùng đồng hồ chia nhỏ hơn cũng không cải thiện đáng kể.' },
  ],
  async demo(api) { for (let i = 0; i < 8; i++) api.record(); },
};

export const mount = (root, entry) => mountLab(root, entry, spec);

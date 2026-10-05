// Vật lí 10 – Bài 2: Các quy tắc an toàn trong phòng thực hành Vật lí (an toàn điện: công suất, cầu chì, dây dẫn, dòng điện qua người).
import { mountLab } from '../../core/lab.js';
import { mean, fmt } from '../../core/stats.js';
import { text, line, rect, circle } from '../../core/draw.js';

// ---- Vật lí (hàm thuần, kiểm thử bằng Node) ----
export const U = 220;                                        // hiệu điện thế mạng điện (V)
export const FUSES = [1, 2, 3, 5, 10, 16, 20, 32];           // dòng định mức chuẩn của cầu chì (A)
// Tiết diện dây đồng (mm²) và dòng cho phép gần đúng (A) – giá trị dùng cho học tập, không thay thế quy chuẩn.
export const WIRES = [[0.5, 3], [0.75, 6], [1, 10], [1.5, 16], [2.5, 25]];
export const R_BODY = { dry: 100000, wet: 1000 };            // điện trở cơ thể (Ω): tay khô ~100 kΩ, tay ướt ~1 kΩ (mô hình đơn giản)
export const LIMIT_MA = 30;                                  // ngưỡng dòng điện qua người bắt đầu nguy hiểm tới tính mạng (mA)
export const phys = {
  U, FUSES, WIRES,
  current: (P) => P / U,                                                         // I = P/U
  wireCap: (s) => WIRES.find((w) => w[0] === s)[1],
  nextFuse: (I) => FUSES.find((f) => f >= I - 1e-9) ?? FUSES[FUSES.length - 1],  // cầu chì chuẩn nhỏ nhất có dòng định mức ≥ I
  nextWire: (I) => WIRES.find((w) => w[1] >= I - 1e-9)?.[0] ?? WIRES[WIRES.length - 1][0],  // tiết diện nhỏ nhất chịu được I
  // 0: an toàn; 1: cầu chì đứt (ngắt mạch); 2: dây quá tải mà cầu chì không đứt (nguy hiểm); 3: dây chịu được nhưng cầu chì lớn hơn khả năng của dây (chưa đạt)
  status(P, F, s) {
    const I = P / U, cap = phys.wireCap(s);
    if (I > F + 1e-12) return 1;
    if (I > cap + 1e-12) return 2;
    if (F > cap + 1e-12) return 3;
    return 0;
  },
  // Dòng điện qua người chạm vào chỗ dây hở: I = U/R (mA); mạch đã ngắt thì bằng 0.
  bodyCurrent(P, F, s, hand, insul) { return insul === 'bad' && phys.status(P, F, s) !== 1 ? (U / R_BODY[hand]) * 1000 : 0; },
  bodyLevel: (mA) => (mA <= 0 ? 'không có dòng' : mA < 10 ? 'tê, giật nhẹ' : mA < LIMIT_MA ? 'co giật, nguy hiểm' : 'có thể tử vong!'),
};
const STATUS_TXT = ['AN TOÀN: cầu chì, dây phù hợp', 'Cầu chì nóng chảy, mạch bị ngắt', 'NGUY HIỂM: dây quá tải, nóng đỏ', 'CHƯA ĐẠT: cầu chì lớn hơn dây chịu'];
const rowsWithBody = (rows) => rows.filter((r) => r.Ib > 0);

export const spec = {
  seed: 2002,
  intro: 'Một ổ cắm trong phòng thực hành cấp điện cho một thiết bị. Em chọn công suất, cầu chì, tiết diện dây và tình trạng cách điện để xem điều gì xảy ra; ghi dòng điện đo được rồi tính để chọn thiết bị bảo vệ đúng.',
  goals: [
    'Nhận biết nguy cơ về điện trong phòng thực hành và biển báo an toàn.',
    'Tính cường độ dòng điện I = P/U để chọn cầu chì và dây dẫn phù hợp.',
    'Hiểu vì sao tay ướt, dây hở nguy hiểm: dòng qua người I = U/R tăng khi điện trở giảm.',
  ],
  theory: 'I = P/U &nbsp;&nbsp; Cầu chì chọn: I<sub>định mức</sub> ≥ I &nbsp;&nbsp; Dây phải chịu được dòng ≥ dòng định mức cầu chì<br>Dòng qua người: I<sub>người</sub> = U/R (R tay khô ≈ 100 kΩ, tay ướt ≈ 1 kΩ). Từ 30 mA có thể nguy hiểm đến tính mạng.',
  setup: 'Quy tắc cần nhớ: đọc nội quy và kiểm tra dụng cụ trước khi làm; không dùng tay ướt hoặc dây hở; ngắt nguồn trước khi nối, sửa mạch; biết vị trí cầu dao, bình chữa cháy, lối thoát hiểm. Hãy thử: đặt cầu chì quá nhỏ, quá lớn, dây quá mảnh, tay ướt chạm dây hở rồi bấm “Ghi số liệu”. Trong bảng: F = dòng định mức cầu chì, Ib = dòng qua người. Kết quả (KQ): 0 = an toàn; 1 = cầu chì đứt; 2 = dây quá tải; 3 = cầu chì lớn hơn dòng dây chịu được.',
  choices: [
    { k: 'fuse', label: 'Cầu chì (dòng định mức)', options: FUSES.map((f) => [f, f + ' A']), def: 10, keepRows: true },
    { k: 'wire', label: 'Tiết diện dây đồng', options: WIRES.map(([s, c]) => [s, `${fmt(s, s % 1 ? 2 : 1)} mm² (≈ ${c} A)`]), def: 1.5, keepRows: true },
    { k: 'insul', label: 'Vỏ cách điện của dây', options: [['good', 'Còn tốt'], ['bad', 'Bị hở một đoạn']], def: 'good', string: true, keepRows: true },
    { k: 'hand', label: 'Tay người chạm vào', options: [['dry', 'Tay khô'], ['wet', 'Tay ướt']], def: 'dry', string: true, keepRows: true, show: (p) => p.insul === 'bad' },
  ],
  params: [{ k: 'P', label: 'Công suất thiết bị P', unit: 'W', min: 100, max: 3000, step: 50, def: 1000, dec: 0 }],
  stageHeight: 250,
  ariaLabel: 'Sơ đồ ổ cắm 220 V, cầu chì, dây dẫn và thiết bị; cầu chì đứt hoặc dây nóng đỏ khi quá tải; bàn tay chạm dây hở khi vỏ cách điện hỏng',
  state(p) {
    const I = phys.current(p.P), cap = phys.wireCap(p.wire), code = phys.status(p.P, p.fuse, p.wire);
    return { I, cap, code, Ib: phys.bodyCurrent(p.P, p.fuse, p.wire, p.hand, p.insul) };
  },
  readouts: (p, s) => [['dây chịu', s.cap + ' A'], ['trạng thái', ['an toàn', 'cầu chì đứt', 'dây quá tải', 'chưa đạt'][s.code]]],
  draw(ctx, { w, h }, s, p, t, th) {
    const ym = 96, sx = w * 0.09, fx = w * 0.34, ax0 = w * 0.64, ax1 = w * 0.93, tw = 2 + p.wire * 1.7;
    const hot = s.code === 2, red = '#e03131';
    // dây từ ổ cắm tới cầu chì (dây nguồn)
    line(ctx, sx + 18, ym, fx - 28, ym, th.ink, 2);
    // ổ cắm 220 V
    rect(ctx, sx - 18, ym - 26, 36, 52, th.card, th.ink, 6); circle(ctx, sx - 5, ym - 8, 3, th.ink); circle(ctx, sx - 5, ym + 8, 3, th.ink);
    text(ctx, '220 V', sx, ym + 44, { color: th.ink, size: 12, align: 'center' });
    // cầu chì
    rect(ctx, fx - 28, ym - 11, 56, 22, th.card, th.ink, 9); rect(ctx, fx - 32, ym - 8, 8, 16, th.axis, null, 2); rect(ctx, fx + 24, ym - 8, 8, 16, th.axis, null, 2);
    if (s.code === 1) { line(ctx, fx - 22, ym, fx - 6, ym, th.ink, 1.5); line(ctx, fx + 6, ym, fx + 22, ym, th.ink, 1.5); text(ctx, '✕', fx, ym + 4, { color: red, size: 13, align: 'center', bold: true }); }
    else line(ctx, fx - 22, ym, fx + 22, ym, th.ink, 1.5);
    text(ctx, `Cầu chì ${p.fuse} A`, fx, ym + 30, { color: s.code === 1 ? red : th.ink, size: 12, align: 'center' });
    // dây từ cầu chì tới thiết bị (độ dày theo tiết diện; nóng đỏ khi quá tải)
    const bad = p.insul === 'bad';
    if (hot) line(ctx, fx + 32, ym, ax0, ym, red, tw + 8, []);
    ctx.save(); ctx.globalAlpha = s.code === 1 ? 0.35 : 1; line(ctx, fx + 32, ym, ax0, ym, hot ? '#ffd8a8' : th.ink, tw); ctx.restore();
    text(ctx, `${String(p.wire).replace('.', ',')} mm²`, (fx + 32 + ax0) / 2, ym - 13, { color: th.muted, size: 11, align: 'center' });
    if (s.code !== 1) text(ctx, `I = ${fmt(s.I, 2)} A`, (fx + 32 + ax0) / 2, ym - 30, { color: hot ? red : th.accent, size: 12, align: 'center', bold: true });
    // chỗ dây hở
    const ex = (fx + 32 + ax0) / 2;
    if (bad) { line(ctx, ex - 14, ym, ex + 14, ym, '#c9772b', tw + 1);  }
    // thiết bị
    rect(ctx, ax0, ym - 30, ax1 - ax0, 60, th.soft, th.ink, 8); text(ctx, 'Thiết bị', (ax0 + ax1) / 2, ym - 6, { color: th.ink, size: 12, align: 'center' });
    text(ctx, `${fmt(p.P, 0)} W`, (ax0 + ax1) / 2, ym + 14, { color: th.ink, size: 13, align: 'center', bold: true });
    // bàn tay chạm chỗ hở
    if (bad) {
      const hy = ym + 74;
      line(ctx, ex, hy - 12, ex, ym + 3, th.muted, 1.5, [3, 3]);
      rect(ctx, ex - 11, hy - 12, 22, 24, '#f2c9a0', th.ink, 6); line(ctx, ex, hy + 12, ex, hy + 30, '#f2c9a0', 9);
      if (p.hand === 'wet') for (const [dx, dy] of [[-17, -6], [17, 0], [-14, 12], [14, 14]]) circle(ctx, ex + dx, hy + dy, 3, '#339af0');
      text(ctx, p.hand === 'wet' ? 'tay ướt chạm dây hở' : 'tay khô chạm dây hở', ex + 22, hy + 4, { color: th.ink, size: 11 });
    }
    // biển báo: nguy hiểm điện (tam giác vàng) và cấm tay ướt (tròn đỏ gạch chéo)
    const bx = w - 28, by = 20;
    ctx.save(); ctx.fillStyle = '#ffd43b'; ctx.strokeStyle = th.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx, by - 11); ctx.lineTo(bx + 13, by + 11); ctx.lineTo(bx - 13, by + 11); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(bx + 2, by - 5); ctx.lineTo(bx - 4, by + 3); ctx.lineTo(bx, by + 3); ctx.lineTo(bx - 2, by + 9); ctx.lineTo(bx + 5, by + 0); ctx.lineTo(bx + 1, by + 0); ctx.closePath(); ctx.fill(); ctx.restore();
    circle(ctx, bx - 42, by, 12, th.card, red); ctx.save(); ctx.strokeStyle = red; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(bx - 42, by, 11, 0, 7); ctx.moveTo(bx - 50, by - 8); ctx.lineTo(bx - 34, by + 8); ctx.stroke(); ctx.restore();
    circle(ctx, bx - 42, by + 1, 3.5, '#339af0');
    // dòng chữ trạng thái
    const small = w < 420;
    text(ctx, STATUS_TXT[s.code], w / 2, h - (bad ? 34 : 16), { color: s.code === 0 ? th.ok : s.code === 1 ? th.accent : th.bad, size: small ? 11 : 13, align: 'center', bold: true });
    if (bad) text(ctx, s.Ib > 0 ? `Qua người ${fmt(s.Ib, s.Ib < 10 ? 1 : 0)} mA: ${phys.bodyLevel(s.Ib)}` : 'Mạch đã ngắt: không có dòng qua người', w / 2, h - 14, { color: s.Ib >= LIMIT_MA ? th.bad : th.muted, size: small ? 11 : 12, align: 'center', bold: s.Ib >= LIMIT_MA });
  },
  columns: [
    { k: 'P', label: 'P', unit: 'W', dec: 0 }, { k: 'I', label: 'I', unit: 'A', dec: 2 }, { k: 'F', label: 'F', unit: 'A', dec: 0 },
    { k: 'Ib', label: 'Ib', unit: 'mA', dec: 1 }, { k: 'st', label: 'KQ', unit: '', dec: 0 },
  ],
  recordLabel: 'Ghi số liệu',
  note: 'Ampe kế đo dòng điện thiết bị cần khi đóng mạch (sai số khoảng 0,01 A); mA-kế đo dòng qua người (sai số khoảng 2 %). Điện trở cơ thể chỉ là mô hình đơn giản, giá trị thật phụ thuộc nhiều yếu tố.',
  record(p, s, t, n) {
    return { P: p.P, I: n.round(s.I + n.noise(0.01), 0.01), F: p.fuse, W: p.wire, Ib: n.round(s.Ib * (1 + n.noise(0.02)), 0.1), st: s.code };
  },
  predict: {
    prompt: '<p>Thiết bị có công suất P đang chọn, dùng ở hiệu điện thế 220 V. Hãy dự đoán cường độ dòng điện chạy qua thiết bị.</p>',
    fields: [{ k: 'I', label: 'I = P/U', unit: 'A', dec: 2 }],
    expected: (p) => ({ I: p.P / U }), tol: 0.03, absTol: 0.02,
    explain: (p) => `I = P/U = ${fmt(p.P, 0)}/220 = ${fmt(p.P / U, 2)} A.`,
  },
  tasks: [
    {
      title: 'Xử lí số liệu: hiệu điện thế và dòng lớn nhất',
      prompt: '<p>Ghi ít nhất 4 lần đo với các công suất khác nhau. Với mỗi dòng tính U = P/I rồi lấy <b>giá trị trung bình</b>; ghi lại <b>dòng điện lớn nhất</b> đã đo.</p>',
      fields: [{ k: 'U', label: 'U trung bình = P/I', unit: 'V', dec: 1 }, { k: 'Imax', label: 'I lớn nhất', unit: 'A', dec: 2 }],
      minRows: 4, tol: 0.03, absTol: 0.02,
      expected: (p, rows) => ({ U: mean(rows.map((r) => r.P / r.I)), Imax: Math.max(...rows.map((r) => r.I)) }),
      explain: () => 'U tính được gần 220 V, đúng với mạng điện gia đình; sai khác nhỏ do sai số ampe kế.',
    },
    {
      title: 'Chọn cầu chì và dây dẫn an toàn',
      prompt: '<p>Thiết bị có <b>công suất lớn nhất</b> trong bảng của em cần được bảo vệ. Tính I = P<sub>max</sub>/220, chọn <b>cầu chì nhỏ nhất</b> có dòng định mức ≥ I trong dãy 1; 2; 3; 5; 10; 16; 20; 32 (A), và <b>dây có tiết diện nhỏ nhất</b> chịu được dòng ≥ dòng định mức cầu chì: 0,5 mm² (3 A); 0,75 (6 A); 1,0 (10 A); 1,5 (16 A); 2,5 mm² (25 A).</p>',
      fields: [{ k: 'I', label: 'I', unit: 'A', dec: 2 }, { k: 'F', label: 'F', unit: 'A', dec: 0 }, { k: 'S', label: 'Tiết diện dây', unit: 'mm²', dec: 2 }],
      minRows: 4, tol: 0.01, absTol: 0.015,
      expected: (p, rows) => { const I = Math.max(...rows.map((r) => r.P)) / U, F = phys.nextFuse(I); return { I, F, S: phys.nextWire(F) }; },
      explain: (p, rows, e) => `Cầu chì ${e.F} A bảo vệ được dây ${fmt(e.S, 2)} mm² (chịu ${phys.wireCap(e.S)} A ≥ ${e.F} A).`,
    },
    {
      title: 'Dòng điện chạy qua người',
      prompt: '<p>Chọn “vỏ cách điện bị hở”, đặt cầu chì đủ lớn để không đứt, rồi ghi số liệu cho cả tay khô và tay ướt. Lấy <b>dòng ghi cuối cùng có Ib khác 0</b>: tính điện trở R = U/I<sub>b</sub> (mA → kΩ: R(kΩ) = 220/Ib(mA)) và cho biết dòng đó gấp bao nhiêu lần ngưỡng nguy hiểm 30 mA.</p>',
      fields: [{ k: 'R', label: 'R = 220/Ib', unit: 'kΩ', dec: 2 }, { k: 'x', label: 'Ib / 30 mA', unit: 'lần', dec: 2 }],
      need: (rows) => (rowsWithBody(rows).length ? null : 'Cần ít nhất một lần ghi với vỏ dây bị hở và cầu chì không đứt (cầu chì đủ lớn).'),
      tol: 0.03, absTol: 0.02,
      expected: (p, rows) => { const b = rowsWithBody(rows), r = b[b.length - 1]; return { R: U / r.Ib, x: r.Ib / LIMIT_MA }; },
      explain: () => 'Tay ướt: R ≈ 1 kΩ nên dòng qua người ≈ 220 mA, gấp hơn 7 lần ngưỡng 30 mA. Tay khô: R ≈ 100 kΩ nên chỉ khoảng 2 mA. Cầu chì không bảo vệ được người vì dòng này nhỏ hơn nhiều dòng định mức; cần dùng thiết bị chống giật và tránh chạm vào dây hở.',
    },
  ],
  quiz: [
    { q: 'Máy sưởi 1650 W dùng ở 220 V. Dòng điện và cầu chì phù hợp (dãy 5; 10; 32 A) là:', o: ['7,5 A; cầu chì 5 A', '7,5 A; cầu chì 10 A', '7,5 A; cầu chì 32 A'], a: 1, why: 'I = 1650/220 = 7,5 A; cần cầu chì nhỏ nhất có dòng định mức lớn hơn 7,5 A, tức 10 A.' },
    { q: 'Dây dẫn chỉ chịu được 6 A nhưng dùng cầu chì 20 A cho thiết bị cần 10 A. Điều gì xảy ra?', o: ['Dây nóng lên, có thể cháy mà cầu chì vẫn không đứt', 'Cầu chì đứt ngay lập tức', 'Không có nguy hiểm vì dòng nhỏ hơn 20 A'], a: 0, why: 'Dòng 10 A vượt khả năng của dây (6 A) nhưng nhỏ hơn 20 A nên cầu chì không đứt.' },
    { q: 'Biển báo tam giác nền vàng có hình tia sét cho biết:', o: ['cấm dùng lửa', 'nguy hiểm về điện', 'lối thoát hiểm'], a: 1, why: 'Tam giác vàng là biển cảnh báo; tia sét báo nguy hiểm về điện.' },
    { q: 'Vì sao tay ướt chạm vào dây điện hở nguy hiểm hơn tay khô?', o: ['hiệu điện thế của ổ cắm tăng lên', 'điện trở cơ thể giảm nhiều nên dòng qua người lớn hơn', 'nước làm dây dẫn nóng hơn'], a: 1, why: 'I = U/R: R giảm (từ cỡ 100 kΩ xuống cỡ 1 kΩ) thì I tăng nhiều lần.' },
    { q: 'Khi thấy bạn bị điện giật, việc cần làm đầu tiên là:', o: ['dùng tay kéo bạn ra khỏi dây điện', 'đổ nước lên người bạn', 'ngắt nguồn điện (cầu dao, rút phích) rồi mới sơ cứu và gọi giúp đỡ'], a: 2, why: 'Chạm vào người đang bị giật có thể khiến mình bị giật theo; phải ngắt điện trước.' },
  ],
  async demo(api) {
    for (const P of [100, 400, 800, 1200, 1650, 2000, 2400, 3000]) { api.setParam('P', P); api.record(); }
    api.p.fuse = 20; api.p.insul = 'bad'; api.p.hand = 'dry'; api.setParam('P', 1000); api.record();
    api.p.hand = 'wet'; api.setParam('P', 1000); api.record();
  },
};

export const mount = (root, entry) => mountLab(root, entry, spec);

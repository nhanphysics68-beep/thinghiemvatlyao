// Vật lí 10 – Bài 5: Tốc độ và vận tốc. Lớp giao diện + điều khiển của thí nghiệm.
// Toàn bộ tính toán vật lí nằm trong physics.js.
import { SCENARIOS, defaultParams, buildMotion, averages, xRange, describe, NOISE } from './physics.js';
import { Plot } from '../../core/plot.js';
import { mulberry32, gaussian } from '../../core/rng.js';
import { fmt, parseNum, roundTo } from '../../core/stats.js';

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

const QUIZ = [
  { q: 'Tốc độ trung bình của vật được tính bằng:', o: ['độ dịch chuyển chia cho thời gian', 'quãng đường đi được chia cho thời gian', 'tích của vận tốc và thời gian'], a: 1,
    why: 'Tốc độ trung bình = quãng đường s / thời gian. Quãng đường là đại lượng vô hướng, không âm.' },
  { q: 'Vận tốc trung bình của vật được tính bằng:', o: ['độ dịch chuyển chia cho thời gian', 'quãng đường đi được chia cho thời gian', 'tổng các tốc độ chia cho số lần đo'], a: 0,
    why: 'Vận tốc trung bình = độ dịch chuyển d / thời gian, là đại lượng có hướng, có thể âm hoặc dương.' },
  { q: 'Một người đi 3 km về phía Đông rồi quay lại 1 km về phía Tây trong 0,5 h. Tốc độ trung bình là:', o: ['4 km/h', '8 km/h', '2 km/h'], a: 1,
    why: 's = 3 + 1 = 4 km nên tốc độ trung bình = 4 / 0,5 = 8 km/h. (Vận tốc trung bình = 2 / 0,5 = 4 km/h hướng Đông.)' },
  { q: 'Khi nào độ lớn vận tốc trung bình bằng tốc độ trung bình?', o: ['Khi vật chuyển động thẳng và không đổi chiều', 'Luôn luôn bằng nhau', 'Khi vật chuyển động có đổi chiều'], a: 0,
    why: 'Nếu vật không đổi chiều thì độ dịch chuyển có độ lớn bằng quãng đường, nên hai đại lượng có độ lớn bằng nhau.' },
  { q: 'Số chỉ của tốc kế trên xe máy cho biết:', o: ['tốc độ trung bình cả chuyến đi', 'tốc độ tức thời tại thời điểm đang xét', 'vận tốc trung bình cả chuyến đi'], a: 1,
    why: 'Tốc kế cho biết tốc độ tức thời, là độ lớn của vận tốc tức thời tại thời điểm xét.' },
];

export function mount(root, entry) {
  // ---------- trạng thái ----------
  const S = {
    scn: 'turn', params: defaultParams('turn'), m: null,
    t: 0, playing: false, speed: 1, rows: [],
    timer: 'hand', noise: true, trace: true, vec: true, secant: false, dtInst: 1,
    rng: mulberry32(20261005),
  };
  S.m = buildMotion(S.scn, S.params);
  let raf = 0, last = 0, dirty = true;

  // ---------- giao diện ----------
  root.innerHTML = `
  <h1>${entry.lesson}. ${entry.title}</h1>
  <p class="muted">Vật lí 10 · Kết nối tri thức. Em sẽ dự đoán, làm thí nghiệm, ghi số liệu rồi tự tính tốc độ và vận tốc.</p>

  <section class="card" id="s1">
    <h2><span class="step">1</span>Dự đoán</h2>
    <p id="desc"></p>
    <p>Hãy dự đoán trên <b>cả quá trình chuyển động</b> (từ t = 0 đến hết):</p>
    <div class="row">
      <label>Tốc độ trung bình (m/s)<br><input type="text" inputmode="decimal" id="p-sp" size="8" autocomplete="off"></label>
      <label>Vận tốc trung bình (m/s)<br><input type="text" inputmode="decimal" id="p-vel" size="8" autocomplete="off"></label>
      <button class="primary" id="p-check" style="align-self:end">Kiểm tra dự đoán</button>
    </div>
    <div class="fb" id="p-fb" role="status"></div>
  </section>

  <section class="card" id="s2">
    <h2><span class="step">2</span>Thí nghiệm</h2>
    <div class="row">
      <label>Kịch bản<br><select id="scn">${Object.entries(SCENARIOS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></label>
      <label>Dụng cụ đo thời gian<br><select id="timer">${['hand', 'sensor'].map((k) => `<option value="${k}">${NOISE[k].label}</option>`).join('')}</select></label>
    </div>
    <div class="sliders" id="sliders"></div>
    <div class="row" style="margin-top:8px">
      <label class="chk"><input type="checkbox" id="noise" checked> Bật sai số đo</label>
      <label class="chk"><input type="checkbox" id="trace" checked> Hiện vết mỗi 1 s</label>
      <label class="chk"><input type="checkbox" id="vec" checked> Hiện vector vận tốc</label>
    </div>
    <canvas class="stage" id="stage" role="img" aria-label="Chiếc xe chạy trên đường thẳng có thước đo"></canvas>
    <div class="row" style="margin-top:10px">
      <button class="primary" id="play">▶ Chạy</button>
      <button id="reset">⟲ Về đầu</button>
      <button id="back" class="small" aria-label="Lùi 0,1 giây">−0,1 s</button>
      <button id="fwd" class="small" aria-label="Tiến 0,1 giây">+0,1 s</button>
      <label>Tốc độ phát <select id="speed"><option value="0.25">0,25×</option><option value="0.5">0,5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label>
    </div>
    <input type="range" id="scrub" min="0" max="1" step="0.01" value="0" aria-label="Thời điểm t">
    <div class="row" style="margin-top:6px">
      <div class="readout" id="readout"></div>
      <button class="primary" id="rec">● Ghi số liệu (t, x)</button>
    </div>
    <p class="muted" style="margin-top:8px">Mỗi lần ghi, hệ thống đọc thời gian trên đồng hồ và vị trí trên thước, kèm sai số đo như thí nghiệm thật. Hãy ghi cả điểm quay đầu.</p>
    <div class="grid2" style="margin-top:8px">
      <div><h3>Đồ thị x – t</h3><canvas class="graph" id="gx"></canvas></div>
      <div><h3>Đồ thị v – t</h3><canvas class="graph" id="gv"></canvas></div>
    </div>
    <h3>Bảng số liệu</h3>
    <div class="tablewrap"><table><thead><tr><th>Lần</th><th>t (s)</th><th>x (m)</th><th></th></tr></thead><tbody id="tbody"></tbody></table></div>
    <div class="row" style="margin-top:8px"><button class="small" id="clear">Xóa bảng</button><button class="small" id="csv">Tải CSV</button><span class="muted" id="status"></span></div>
  </section>

  <section class="card" id="s3">
    <h2><span class="step">3</span>Xử lí số liệu</h2>
    <p>Chọn hai lần ghi (đầu và cuối) để tính. Quãng đường s là tổng độ dài các đoạn giữa những lần ghi liên tiếp.</p>
    <div class="row">
      <label>Từ lần ghi<br><select id="from"></select></label>
      <label>Đến lần ghi<br><select id="to"></select></label>
    </div>
    <div class="grid3" id="calc" style="margin:10px 0"></div>
    <div class="row">
      <label>Tốc độ trung bình (m/s)<br><input type="text" inputmode="decimal" id="c-sp" size="8" autocomplete="off"></label>
      <label>Vận tốc trung bình (m/s)<br><input type="text" inputmode="decimal" id="c-vel" size="8" autocomplete="off"></label>
      <button class="primary" id="c-check" style="align-self:end">Kiểm tra</button>
    </div>
    <div class="fb" id="c-fb" role="status"></div>
  </section>

  <section class="card" id="s4">
    <h2><span class="step">4</span>Khám phá: tốc độ tức thời</h2>
    <p>Dừng xe ở thời điểm t₀ bằng thanh trượt ở phần 2, rồi thu nhỏ khoảng thời gian Δt. Vận tốc trung bình trên [t₀, t₀ + Δt] tiến về vận tốc tức thời tại t₀. Thử với kịch bản “Xe tăng tốc”.</p>
    <label>Δt = <b id="dtv"></b> s<input type="range" id="dt" min="0.01" max="4" step="0.01" value="1"></label>
    <label class="chk"><input type="checkbox" id="secant"> Vẽ cát tuyến và tiếp tuyến trên đồ thị x – t</label>
    <div class="grid3" id="inst" style="margin-top:8px"></div>
  </section>

  <section class="card" id="s5">
    <h2><span class="step">5</span>Kết luận và củng cố</h2>
    <div id="quiz"></div>
    <button class="primary" id="q-check">Chấm bài</button>
    <div class="fb" id="q-fb" role="status"></div>
  </section>`;

  const $ = (id) => root.querySelector('#' + id);
  const stage = $('stage'), gxC = $('gx'), gvC = $('gv');
  const gx = new Plot(gxC, { xlabel: 't (s)', ylabel: 'x (m)' });
  const gv = new Plot(gvC, { xlabel: 't (s)', ylabel: 'v (m/s)' });
  const sctx = stage.getContext('2d');
  let sw = 0, sh = 0;
  const stageRO = new ResizeObserver(() => {
    const r = stage.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    sw = r.width; sh = r.height; stage.width = Math.round(sw * dpr); stage.height = Math.round(sh * dpr);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0); dirty = true;
  });
  stageRO.observe(stage);

  const feedback = (el, cls, html) => { el.className = 'fb show ' + cls; el.innerHTML = html; };
  const clearFb = (el) => { el.className = 'fb'; el.innerHTML = ''; };

  // ---------- thanh trượt tham số ----------
  function buildSliders() {
    const box = $('sliders'); box.innerHTML = '';
    for (const p of SCENARIOS[S.scn].params) {
      const id = 'sl-' + p.k;
      const wrap = document.createElement('label');
      wrap.innerHTML = `${p.label}<span id="${id}-v">${fmt(S.params[p.k], p.step < 1 ? 1 : 0)}</span><input type="range" id="${id}" min="${p.min}" max="${p.max}" step="${p.step}" value="${S.params[p.k]}">`;
      box.appendChild(wrap);
      wrap.querySelector('input').addEventListener('input', (e) => {
        S.params[p.k] = parseFloat(e.target.value);
        wrap.querySelector('span').textContent = fmt(S.params[p.k], p.step < 1 ? 1 : 0);
        rebuild(false);
      });
    }
  }
  function rebuild(clearRows = true) {
    S.m = buildMotion(S.scn, S.params);
    S.t = 0; S.playing = false;
    $('scrub').max = S.m.T;
    if (clearRows && S.rows.length) { S.rows = []; $('status').textContent = 'Đã xóa bảng số liệu vì đổi thí nghiệm.'; }
    else if (S.rows.length) { S.rows = []; $('status').textContent = 'Đã xóa bảng số liệu vì đổi thông số.'; }
    $('desc').textContent = describe(S.scn, S.params);
    clearFb($('p-fb')); clearFb($('c-fb'));
    refreshRows(); dirty = true; syncUI();
  }

  // ---------- 1. Dự đoán ----------
  $('p-check').addEventListener('click', () => {
    const r = averages(S.m);
    const sp = parseNum($('p-sp').value), vel = parseNum($('p-vel').value);
    if (isNaN(sp) || isNaN(vel)) return feedback($('p-fb'), 'bad', 'Hãy nhập cả hai số (có thể dùng dấu phẩy hoặc dấu chấm).');
    const tol = (b) => Math.max(0.02 * Math.abs(b), 0.03);
    const okSp = Math.abs(sp - r.speedAvg) <= tol(r.speedAvg), okVel = Math.abs(vel - r.velAvg) <= tol(r.velAvg);
    const detail = `Quãng đường s = ${fmt(r.s, 1)} m, độ dịch chuyển d = ${fmt(r.d, 1)} m, thời gian ${fmt(r.dt, 1)} s. Tốc độ trung bình = s/t = ${fmt(r.speedAvg)} m/s; vận tốc trung bình = d/t = ${fmt(r.velAvg)} m/s.`;
    feedback($('p-fb'), okSp && okVel ? 'ok' : 'bad',
      `${okSp ? '✓' : '✗'} Tốc độ trung bình · ${okVel ? '✓' : '✗'} Vận tốc trung bình.<br>${detail}<br>Hãy chạy thí nghiệm ở phần 2 để kiểm chứng bằng số liệu đo.`);
  });

  // ---------- 2. Điều khiển ----------
  $('scn').addEventListener('change', (e) => { S.scn = e.target.value; S.params = defaultParams(S.scn); buildSliders(); rebuild(); });
  $('timer').addEventListener('change', (e) => { S.timer = e.target.value; });
  $('noise').addEventListener('change', (e) => { S.noise = e.target.checked; });
  $('trace').addEventListener('change', (e) => { S.trace = e.target.checked; dirty = true; });
  $('vec').addEventListener('change', (e) => { S.vec = e.target.checked; dirty = true; });
  $('secant').addEventListener('change', (e) => { S.secant = e.target.checked; dirty = true; });
  $('speed').addEventListener('change', (e) => { S.speed = parseFloat(e.target.value); });
  $('play').addEventListener('click', () => {
    if (S.t >= S.m.T - 1e-9) S.t = 0;
    S.playing = !S.playing; syncUI(); dirty = true;
  });
  $('reset').addEventListener('click', () => { S.t = 0; S.playing = false; syncUI(); dirty = true; });
  const nudge = (d) => { S.playing = false; S.t = Math.min(S.m.T, Math.max(0, S.t + d)); syncUI(); dirty = true; };
  $('back').addEventListener('click', () => nudge(-0.1));
  $('fwd').addEventListener('click', () => nudge(0.1));
  $('scrub').addEventListener('input', (e) => { S.playing = false; S.t = parseFloat(e.target.value); syncUI(); dirty = true; });

  function syncUI() {
    $('play').textContent = S.playing ? '⏸ Tạm dừng' : (S.t >= S.m.T - 1e-9 ? '↻ Chạy lại' : '▶ Chạy');
    $('scrub').value = S.t;
    const x = S.m.x(S.t), v = S.m.v(S.t);
    $('readout').textContent = `t = ${fmt(S.t, 2)} s · x = ${fmt(x, 1)} m · v = ${fmt(v, 1)} m/s`;
    renderInstant();
  }

  // ---------- ghi số liệu ----------
  $('rec').addEventListener('click', () => {
    const nz = NOISE[S.timer];
    let t = S.t, x = S.m.x(S.t);
    if (S.noise) { t += nz.sigmaT * gaussian(S.rng); x += NOISE.sigmaX * gaussian(S.rng); }
    t = Math.max(0, roundTo(t, nz.resT)); x = roundTo(x, NOISE.resX);
    S.rows.push({ t, x }); $('status').textContent = '';
    refreshRows(); dirty = true;
  });
  $('clear').addEventListener('click', () => { S.rows = []; $('status').textContent = ''; refreshRows(); dirty = true; });
  $('csv').addEventListener('click', () => {
    if (!S.rows.length) return;
    const csv = 'lan,t_s,x_m\n' + S.rows.map((r, i) => `${i + 1},${r.t},${r.x}`).join('\n');
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'so-lieu-bai5.csv'; a.click();
    } catch (e) { $('status').textContent = 'Trình duyệt chặn tải tệp.'; }
  });
  function refreshRows() {
    const tb = $('tbody'); tb.innerHTML = '';
    S.rows.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${fmt(r.t, S.timer === 'hand' ? 2 : 3)}</td><td>${fmt(r.x, 1)}</td><td><button class="small" aria-label="Xóa lần ${i + 1}">✕</button></td>`;
      tr.querySelector('button').addEventListener('click', () => { S.rows.splice(i, 1); refreshRows(); dirty = true; });
      tb.appendChild(tr);
    });
    const opts = S.rows.map((r, i) => `<option value="${i}">Lần ${i + 1} (t = ${fmt(r.t, 2)} s, x = ${fmt(r.x, 1)} m)</option>`).join('');
    const f = $('from'), t = $('to'); const fv = f.value, tv = t.value;
    f.innerHTML = opts; t.innerHTML = opts;
    f.value = fv !== '' && +fv < S.rows.length ? fv : 0;
    t.value = tv !== '' && +tv < S.rows.length ? tv : Math.max(0, S.rows.length - 1);
    renderCalc();
  }

  // ---------- 3. Xử lí số liệu ----------
  function calcFromRows() {
    const i = +$('from').value, j = +$('to').value;
    if (S.rows.length < 2 || !(j > i)) return null;
    let s = 0;
    for (let k = i; k < j; k++) s += Math.abs(S.rows[k + 1].x - S.rows[k].x);
    const dt = S.rows[j].t - S.rows[i].t, d = S.rows[j].x - S.rows[i].x;
    if (dt <= 0) return null;
    return { dt, d, s, sp: s / dt, vel: d / dt };
  }
  function renderCalc() {
    const c = calcFromRows(), box = $('calc');
    if (!c) { box.innerHTML = '<div class="muted">Cần ít nhất 2 lần ghi; lần cuối phải đứng sau lần đầu.</div>'; return; }
    const cell = (l, v, u) => `<div class="readout">${l}<br><b class="mathline">${v}</b> ${u}</div>`;
    box.innerHTML = cell('Khoảng thời gian Δt', fmt(c.dt, 2), 's') + cell('Độ dịch chuyển d', fmt(c.d, 1), 'm') + cell('Quãng đường s', fmt(c.s, 1), 'm');
  }
  $('from').addEventListener('change', renderCalc); $('to').addEventListener('change', renderCalc);
  $('c-check').addEventListener('click', () => {
    const c = calcFromRows();
    if (!c) return feedback($('c-fb'), 'bad', 'Hãy ghi ít nhất 2 lần số liệu và chọn lần cuối sau lần đầu.');
    const sp = parseNum($('c-sp').value), vel = parseNum($('c-vel').value);
    if (isNaN(sp) || isNaN(vel)) return feedback($('c-fb'), 'bad', 'Hãy nhập cả hai kết quả.');
    const tol = (b) => Math.max(0.02 * Math.abs(b), 0.03);
    const a = Math.abs(sp - c.sp) <= tol(c.sp), b = Math.abs(vel - c.vel) <= tol(c.vel);
    const truth = averages(S.m, 0, S.m.T);
    feedback($('c-fb'), a && b ? 'ok' : 'bad',
      `${a ? '✓' : '✗'} Tốc độ trung bình = s/Δt = ${fmt(c.s, 1)}/${fmt(c.dt, 2)} = ${fmt(c.sp)} m/s.<br>${b ? '✓' : '✗'} Vận tốc trung bình = d/Δt = ${fmt(c.d, 1)}/${fmt(c.dt, 2)} = ${fmt(c.vel)} m/s.` +
      `<br>Nếu bạn chưa ghi điểm quay đầu thì s tính từ số liệu sẽ nhỏ hơn quãng đường thật. Giá trị lí tưởng cả quá trình: ${fmt(truth.speedAvg)} m/s và ${fmt(truth.velAvg)} m/s.`);
  });

  // ---------- 4. Tốc độ tức thời ----------
  $('dt').addEventListener('input', (e) => { S.dtInst = parseFloat(e.target.value); renderInstant(); dirty = true; });
  function instant() {
    const t0 = S.t, t1 = Math.min(S.m.T, t0 + S.dtInst);
    return { t0, t1, dt: t1 - t0, x0: S.m.x(t0), x1: S.m.x(t1), v0: S.m.v(t0) };
  }
  function renderInstant() {
    $('dtv').textContent = fmt(S.dtInst, 2);
    const i = instant(), box = $('inst');
    if (i.dt < 1e-6) { box.innerHTML = '<div class="muted">Đã tới cuối chuyển động. Hãy lùi thời điểm t₀ ở phần 2.</div>'; return; }
    const vtb = (i.x1 - i.x0) / i.dt;
    const cell = (l, v, u) => `<div class="readout">${l}<br><b class="mathline">${v}</b> ${u}</div>`;
    box.innerHTML = cell(`Vận tốc trung bình trên [${fmt(i.t0, 2)} ; ${fmt(i.t1, 2)}] s`, fmt(vtb, 3), 'm/s') +
      cell(`Vận tốc tức thời tại t₀ = ${fmt(i.t0, 2)} s`, fmt(i.v0, 3), 'm/s') + cell('Chênh lệch', fmt(vtb - i.v0, 3), 'm/s');
  }

  // ---------- 5. Câu hỏi ----------
  $('quiz').innerHTML = QUIZ.map((q, n) => `<div class="q"><b>Câu ${n + 1}.</b> ${q.q}${q.o.map((o, k) => `<label><input type="radio" name="q${n}" value="${k}"> ${o}</label>`).join('')}</div>`).join('');
  $('q-check').addEventListener('click', () => {
    let score = 0, html = '';
    QUIZ.forEach((q, n) => {
      const sel = root.querySelector(`input[name=q${n}]:checked`);
      const good = sel && +sel.value === q.a; if (good) score++;
      html += `<div>${good ? '✓' : '✗'} Câu ${n + 1}: ${q.why}</div>`;
    });
    feedback($('q-fb'), score === QUIZ.length ? 'ok' : 'info', `<b>Điểm: ${score}/${QUIZ.length}</b>${html}`);
  });

  // ---------- vẽ ----------
  function niceRange(lo, hi, margin = 0.08) { const span = Math.max(hi - lo, 4); return [lo - span * margin, hi + span * margin]; }
  function draw() {
    const m = S.m, T = m.T, [xlo, xhi] = xRange(m);
    drawStage(m, xlo, xhi);
    // đồ thị x–t
    const N = 200, full = [], upto = [];
    for (let i = 0; i <= N; i++) { const t = (i / N) * T; full.push([t, m.x(t)]); if (t <= S.t) upto.push([t, m.x(t)]); }
    upto.push([S.t, m.x(S.t)]);
    const [ylo, yhi] = niceRange(xlo, xhi);
    const series = [
      { pts: full, color: css('--grid'), width: 4 },
      { pts: upto, color: css('--accent'), width: 2.5 },
      { pts: S.rows.map((r) => [r.t, r.x]), color: css('--car'), mode: 'points', r: 4.5 },
      { pts: [[S.t, m.x(S.t)]], color: css('--accent'), mode: 'points', r: 5.5 },
    ];
    if (S.secant) {
      const i = instant();
      if (i.dt > 1e-6) {
        const k = (i.x1 - i.x0) / i.dt;
        series.push({ pts: [[0, i.x0 - k * i.t0], [T, i.x0 + k * (T - i.t0)]], color: css('--series2'), width: 1.8 });
        series.push({ pts: [[0, i.x0 - i.v0 * i.t0], [T, i.x0 + i.v0 * (T - i.t0)]], color: css('--series3'), width: 1.8, dash: [6, 4] });
        series.push({ pts: [[i.t0, i.x0], [i.t1, i.x1]], color: css('--series2'), mode: 'points', r: 4 });
      }
    }
    gx.draw({ range: { xmin: 0, xmax: T, ymin: ylo, ymax: yhi }, series });
    // đồ thị v–t
    const vt = m.vt(), vs = vt.map((p) => p[1]);
    const [vlo, vhi] = niceRange(Math.min(0, ...vs), Math.max(0, ...vs), 0.15);
    const vupto = []; let prev = null;
    for (const p of vt) { if (p[0] <= S.t) vupto.push(p); else { prev = p; break; } }
    if (S.scn === 'accel') { vupto.length = 0; vupto.push([0, 0], [S.t, m.v(S.t)]); }
    else vupto.push([S.t, m.v(S.t)]);
    gv.draw({
      range: { xmin: 0, xmax: T, ymin: vlo, ymax: vhi },
      series: [
        { pts: vt, color: css('--grid'), width: 4 },
        { pts: vupto, color: css('--accent'), width: 2.5 },
        { pts: [[S.t, m.v(S.t)]], color: css('--accent'), mode: 'points', r: 5.5 },
      ],
    });
  }

  function drawStage(m, xlo, xhi) {
    const c = sctx, W = sw, H = sh; if (!W) return;
    c.clearRect(0, 0, W, H);
    const span = Math.max(xhi - xlo, 10), pad = 30;
    const a = xlo - span * 0.08, b = xhi + span * 0.08;
    const X = (x) => pad + ((x - a) / (b - a)) * (W - 2 * pad);
    const roadY = H * 0.58, ink = css('--ink'), muted = css('--muted');
    // đường
    c.fillStyle = css('--road'); c.fillRect(pad - 10, roadY, W - 2 * pad + 20, 14);
    // thước
    const step = (() => { const raw = (b - a) / Math.max(4, Math.floor(W / 70)); const mg = 10 ** Math.floor(Math.log10(raw)); const r = raw / mg; return (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mg; })();
    c.strokeStyle = muted; c.fillStyle = muted; c.font = '12px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top'; c.lineWidth = 1;
    for (let v = Math.ceil(a / step) * step; v <= b; v += step) {
      c.beginPath(); c.moveTo(X(v), roadY + 14); c.lineTo(X(v), roadY + 22); c.stroke();
      c.fillText(String(+v.toFixed(6)).replace('.', ',').replace('-', '−'), X(v), roadY + 24);
    }
    c.fillText('x (m)', W - 20, roadY + 40);
    // gốc O
    c.strokeStyle = ink; c.lineWidth = 2; c.beginPath(); c.moveTo(X(0), roadY - 34); c.lineTo(X(0), roadY + 14); c.stroke();
    c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText('O', X(0), roadY - 36);
    // vết mỗi 1 s
    if (S.trace) {
      c.fillStyle = css('--accent');
      for (let k = 0; k <= S.t + 1e-9; k += 1) { c.beginPath(); c.arc(X(m.x(k)), roadY + 7, 2.5, 0, 6.3); c.fill(); }
    }
    // cờ các lần ghi
    S.rows.forEach((r, i) => {
      const px = X(r.x);
      c.fillStyle = css('--car'); c.beginPath(); c.moveTo(px, roadY); c.lineTo(px - 5, roadY - 11); c.lineTo(px + 5, roadY - 11); c.closePath(); c.fill();
      c.fillStyle = muted; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.font = '11px system-ui, sans-serif'; c.fillText(String(i + 1), px, roadY - 12);
    });
    c.font = '12px system-ui, sans-serif';
    // xe
    const x = m.x(S.t), v = m.v(S.t), px = X(x), dir = v < 0 ? -1 : 1;
    const bw = 44, bh = 16, by = roadY - bh - 6;
    c.fillStyle = css('--car'); c.beginPath(); c.roundRect(px - bw / 2, by, bw, bh, 4); c.fill();
    c.fillStyle = css('--card'); c.beginPath(); c.roundRect(px - bw / 4 + dir * -2, by - 8, bw / 2, 9, 3); c.fill();
    c.fillStyle = '#f7d046'; c.fillRect(px + dir * (bw / 2) - (dir > 0 ? 4 : 0), by + 4, 4, 5);
    c.fillStyle = ink;
    for (const dx of [-13, 13]) { c.beginPath(); c.arc(px + dx, roadY - 6, 5, 0, 6.3); c.fill(); }
    // vector vận tốc
    if (S.vec && Math.abs(v) > 1e-9) {
      const L = Math.max(-120, Math.min(120, v * 8)), y = by - 18;
      c.strokeStyle = css('--series2'); c.fillStyle = css('--series2'); c.lineWidth = 3;
      c.beginPath(); c.moveTo(px, y); c.lineTo(px + L, y); c.stroke();
      const s = Math.sign(L); c.beginPath(); c.moveTo(px + L, y); c.lineTo(px + L - s * 8, y - 5); c.lineTo(px + L - s * 8, y + 5); c.closePath(); c.fill();
      c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText('v', px + L / 2, y - 4);
    }
  }

  // ---------- vòng lặp ----------
  function frame(ts) {
    if (!last) last = ts;
    const dt = Math.min(0.1, (ts - last) / 1000); last = ts;
    if (S.playing) {
      S.t = Math.min(S.m.T, S.t + dt * S.speed);
      if (S.t >= S.m.T) S.playing = false;
      syncUI(); dirty = true;
    }
    if (dirty) { draw(); dirty = false; }
    raf = requestAnimationFrame(frame);
  }

  // ---------- khởi động ----------
  buildSliders(); $('scn').value = S.scn; rebuild(false);
  raf = requestAnimationFrame(frame);

  return {
    destroy() { cancelAnimationFrame(raf); gx.destroy(); gv.destroy(); stageRO.disconnect(); },
  };
}

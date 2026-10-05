// Bộ khung thí nghiệm dùng chung ("lab kit").
// Mỗi thí nghiệm chỉ cần khai báo một đối tượng `spec` (xem docs/LAB_SPEC.md);
// giao diện, bảng số liệu, đồ thị, kiểm tra đáp án, câu hỏi củng cố do khung này dựng sẵn.
// Phần vật lí (spec.state, spec.record, spec.expected...) là hàm thuần, kiểm thử được bằng Node.
import { Plot } from './plot.js';
import { mulberry32, gaussian } from './rng.js';
import { fmt, parseNum, linearFit } from './stats.js';
import { theme } from './draw.js';

const ESC = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function mountLab(root, entry, spec) {
  // ---------- trạng thái ----------
  const p = {};
  for (const q of spec.params || []) p[q.k] = q.def;
  for (const c of spec.choices || []) p[c.k] = c.def ?? c.options[0][0];
  spec.init?.(p);
  const timed = typeof spec.duration === 'function';
  const S = { t: 0, playing: false, speed: 1, rows: [], noise: true, rng: mulberry32(spec.seed || 20261005) };
  const T = () => (timed ? spec.duration(p) : 0);
  const st = () => spec.state(p, S.t);
  let raf = 0, last = 0, dirty = true, destroyed = false;

  const checks = [...(spec.predict ? [{ ...spec.predict, id: 'predict', where: 'predict' }] : []),
    ...(spec.tasks || []).map((t, i) => ({ ...t, id: 'task' + i, where: 'task' }))];
  const hasData = !!spec.columns;
  let stepNo = 0;
  const step = () => `<span class="step">${++stepNo}</span>`;

  // ---------- khung HTML ----------
  const fieldHtml = (c) => c.fields.map((f) => `<label>${f.label}${f.unit ? ` (${f.unit})` : ''}<br><input type="text" inputmode="decimal" size="9" autocomplete="off" data-chk="${c.id}" data-k="${f.k}"></label>`).join('');
  const checkCard = (c, title) => `
    <section class="card" id="card-${c.id}">
      <h2>${step()}${title}</h2>
      <div>${c.prompt}</div>
      <div class="row" style="margin-top:8px">${fieldHtml(c)}<button class="primary" data-go="${c.id}" style="align-self:end">Kiểm tra</button></div>
      <div class="fb" id="fb-${c.id}" role="status"></div>
    </section>`;

  const sliderHtml = (q) => `<label data-wrap="${q.k}">${q.label}<span id="v-${q.k}"></span><input type="range" id="sl-${q.k}" min="${q.min}" max="${q.max}" step="${q.step}" value="${q.def}"></label>`;
  const choiceHtml = (c) => `<label data-wrap="${c.k}">${c.label}<br><select id="ch-${c.k}">${c.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>`;
  const graphs = spec.graphs || [];

  root.innerHTML = `
  <h1>${entry.lesson}. ${entry.title}</h1>
  <p class="muted">${spec.intro || ''}</p>
  <section class="card">
    <h2>${step()}Mục tiêu và kiến thức cần nhớ</h2>
    <ul>${(spec.goals || []).map((g) => `<li>${g}</li>`).join('')}</ul>
    <div class="mathline">${spec.theory || ''}</div>
  </section>
  ${spec.predict ? checkCard(checks[0], 'Dự đoán') : ''}
  <section class="card" id="card-exp">
    <h2>${step()}Thí nghiệm</h2>
    ${spec.setup ? `<p>${spec.setup}</p>` : ''}
    <div class="row">${(spec.choices || []).map(choiceHtml).join('')}</div>
    <div class="sliders" id="sliders">${(spec.params || []).map(sliderHtml).join('')}</div>
    <div class="row" id="toggles" style="margin-top:8px">
      ${hasData ? '<label class="chk"><input type="checkbox" id="noise" checked> Bật sai số đo</label>' : ''}
      ${(spec.toggles || []).map((g) => `<label class="chk"><input type="checkbox" data-tg="${g.k}" ${g.def ? 'checked' : ''}> ${g.label}</label>`).join('')}
    </div>
    <canvas class="stage" id="stage" style="height:${spec.stageHeight || 230}px" role="img" aria-label="${ESC(spec.ariaLabel || entry.title)}"></canvas>
    ${timed ? `
    <div class="row" style="margin-top:10px">
      <button class="primary" id="play">▶ Chạy</button><button id="reset">⟲ Về đầu</button>
      <button id="back" class="small" aria-label="Lùi">−0,1 s</button><button id="fwd" class="small" aria-label="Tiến">+0,1 s</button>
      <label>Tốc độ phát <select id="speed"><option value="0.25">0,25×</option><option value="0.5">0,5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label>
    </div>
    <input type="range" id="scrub" min="0" max="1" step="0.01" value="0" aria-label="Thời điểm t">` : ''}
    <div class="row" style="margin-top:6px"><div class="readout" id="readout"></div>
      ${hasData ? `<button class="primary" id="rec">● ${spec.recordLabel || 'Ghi số liệu'}</button>` : ''}</div>
    ${spec.note ? `<p class="muted" style="margin-top:8px">${spec.note}</p>` : ''}
    ${graphs.length ? `<div class="${graphs.length > 1 ? 'grid2' : ''}" style="margin-top:8px">${graphs.map((g, i) => `<div><h3>${g.title}</h3><canvas class="graph" id="g${i}"></canvas><div class="muted" id="gcap${i}"></div></div>`).join('')}</div>` : ''}
    ${hasData ? `<h3>Bảng số liệu</h3>
    <div class="tablewrap"><table><thead><tr><th>Lần</th>${spec.columns.map((c) => `<th>${c.label}${c.unit ? ` (${c.unit})` : ''}</th>`).join('')}<th></th></tr></thead><tbody id="tbody"></tbody></table></div>
    <div class="row" style="margin-top:8px"><button class="small" id="clear">Xóa bảng</button><button class="small" id="csv">Tải CSV</button><span class="muted" id="status"></span></div>` : ''}
  </section>
  ${(spec.tasks || []).map((t, i) => checkCard(checks[(spec.predict ? 1 : 0) + i], t.title || 'Xử lí số liệu')).join('')}
  <section class="card"><h2>${step()}Củng cố</h2><div id="quiz"></div>
    <button class="primary" id="q-check">Chấm bài</button><div class="fb" id="q-fb" role="status"></div></section>`;

  const $ = (id) => root.querySelector('#' + id);
  const stage = $('stage'), sctx = stage.getContext('2d');
  let sw = 0, sh = 0;
  const ro = new ResizeObserver(() => {
    const r = stage.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    sw = r.width; sh = r.height; stage.width = Math.round(sw * dpr); stage.height = Math.round(sh * dpr);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0); dirty = true;
  });
  ro.observe(stage);
  const plots = graphs.map((g, i) => new Plot($('g' + i), { xlabel: g.xlabel, ylabel: g.ylabel }));
  const toggles = {};
  for (const g of spec.toggles || []) toggles[g.k] = !!g.def;

  const fb = (el, cls, html) => { el.className = 'fb show ' + cls; el.innerHTML = html; };
  const noiseCtx = () => ({
    noise: (sigma) => (S.noise ? gaussian(S.rng) * sigma : 0),
    round: (v, stp) => (stp ? Math.round(v / stp) * stp : v),
    rng: S.rng, on: S.noise,
  });

  // ---------- tham số ----------
  const paramDef = (k) => (spec.params || []).find((q) => q.k === k);
  function syncParamUI() {
    for (const q of spec.params || []) {
      const wrap = root.querySelector(`[data-wrap="${q.k}"]`);
      wrap.style.display = !q.show || q.show(p) ? '' : 'none';
      $('v-' + q.k).textContent = `${fmt(p[q.k], q.dec ?? (q.step < 1 ? 1 : 0))}${q.unit ? ' ' + q.unit : ''}`;
      $('sl-' + q.k).value = p[q.k];
    }
    for (const c of spec.choices || []) {
      const wrap = root.querySelector(`[data-wrap="${c.k}"]`);
      wrap.style.display = !c.show || c.show(p) ? '' : 'none';
      $('ch-' + c.k).value = p[c.k];
    }
  }
  function afterChange(clear) {
    S.t = Math.min(S.t, T()); S.playing = false;
    if (timed) $('scrub').max = T();
    if (clear && S.rows.length) { S.rows = []; refreshTable(); $('status') && ($('status').textContent = 'Đã xóa bảng vì đổi cách bố trí thí nghiệm.'); }
    for (const c of checks) { const f = $('fb-' + c.id); f.className = 'fb'; f.innerHTML = ''; }
    syncParamUI(); syncReadout(); dirty = true;
  }
  for (const q of spec.params || []) {
    $('sl-' + q.k).addEventListener('input', (e) => {
      p[q.k] = parseFloat(e.target.value);
      spec.onParam?.(p, q.k);
      afterChange(!!spec.clearOnParam?.includes(q.k));
    });
  }
  for (const c of spec.choices || []) {
    $('ch-' + c.k).addEventListener('change', (e) => {
      const v = e.target.value; p[c.k] = isNaN(+v) || c.string ? v : +v;
      spec.onChoice?.(p, c.k);
      afterChange(c.keepRows ? false : true);
    });
  }
  root.querySelectorAll('[data-tg]').forEach((el) => el.addEventListener('change', () => { toggles[el.dataset.tg] = el.checked; dirty = true; }));
  $('noise')?.addEventListener('change', (e) => { S.noise = e.target.checked; });

  // ---------- phát ----------
  if (timed) {
    $('speed').addEventListener('change', (e) => { S.speed = parseFloat(e.target.value); });
    $('play').addEventListener('click', () => { if (S.t >= T() - 1e-9) S.t = 0; S.playing = !S.playing; syncReadout(); dirty = true; });
    $('reset').addEventListener('click', () => { S.t = 0; S.playing = false; syncReadout(); dirty = true; });
    const nudge = (d) => { S.playing = false; S.t = Math.min(T(), Math.max(0, S.t + d)); syncReadout(); dirty = true; };
    $('back').addEventListener('click', () => nudge(-0.1));
    $('fwd').addEventListener('click', () => nudge(0.1));
    $('scrub').addEventListener('input', (e) => { S.playing = false; S.t = parseFloat(e.target.value); syncReadout(); dirty = true; });
    $('scrub').max = T();
  }
  function syncReadout() {
    if (timed) {
      $('play').textContent = S.playing ? '⏸ Tạm dừng' : (S.t >= T() - 1e-9 ? '↻ Chạy lại' : '▶ Chạy');
      $('scrub').value = S.t;
    }
    const items = spec.readouts ? spec.readouts(p, st(), S.t) : [];
    $('readout').textContent = [timed ? `t = ${fmt(S.t, 2)} s` : null, ...items.map(([l, v]) => `${l} = ${v}`)].filter(Boolean).join(' · ');
  }

  // ---------- bảng số liệu ----------
  function refreshTable() {
    if (!hasData) return;
    $('tbody').innerHTML = S.rows.map((r, i) =>
      `<tr><td>${i + 1}</td>${spec.columns.map((c) => `<td>${fmt(r[c.k], c.dec ?? 2)}</td>`).join('')}<td><button class="small" data-del="${i}" aria-label="Xóa lần ${i + 1}">✕</button></td></tr>`).join('');
    $('tbody').querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { S.rows.splice(+b.dataset.del, 1); refreshTable(); dirty = true; }));
    const box = $('tbody').parentElement.parentElement; box.scrollTop = box.scrollHeight;
  }
  function record() {
    const row = spec.record(p, st(), S.t, noiseCtx(), S.rows);
    if (!row) return false;
    if (row.error) { $('status').textContent = row.error; return false; }
    S.rows.push(row); $('status').textContent = ''; refreshTable(); dirty = true; return true;
  }
  $('rec')?.addEventListener('click', record);
  $('clear')?.addEventListener('click', () => { S.rows = []; refreshTable(); dirty = true; });
  $('csv')?.addEventListener('click', () => {
    const head = spec.columns.map((c) => c.k).join(',');
    const body = S.rows.map((r) => spec.columns.map((c) => r[c.k]).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + head + '\n' + body], { type: 'text/csv' }));
    a.download = `${entry.id}.csv`; a.click(); URL.revokeObjectURL(a.href);
  });

  // ---------- kiểm tra đáp án ----------
  function runCheck(c, values) {
    const f = $('fb-' + c.id);
    if (c.where === 'task') {
      const need = c.need ? c.need(S.rows, p) : (S.rows.length < (c.minRows || 2) ? `Cần ghi ít nhất ${c.minRows || 2} lần đo ở phần thí nghiệm.` : null);
      if (need) { fb(f, 'info', need); return null; }
    }
    const given = {};
    for (const fd of c.fields) {
      const raw = values ? values[fd.k] : root.querySelector(`[data-chk="${c.id}"][data-k="${fd.k}"]`).value;
      given[fd.k] = typeof raw === 'number' ? raw : parseNum(raw);
    }
    if (Object.values(given).some((v) => isNaN(v))) { fb(f, 'bad', 'Hãy nhập đủ các số (dùng dấu phẩy hoặc dấu chấm đều được).'); return null; }
    const exp = c.expected(p, S.rows);
    const tol = c.tol ?? 0.03;
    let all = true;
    const marks = c.fields.map((fd) => {
      const e = exp[fd.k], tl = Math.max(tol * Math.abs(e), fd.absTol ?? c.absTol ?? 0);
      const ok = Math.abs(given[fd.k] - e) <= tl + 1e-12; all = all && ok;
      return `${ok ? '✓' : '✗'} ${fd.label}: đáp án ${fmt(e, fd.dec ?? 2)}${fd.unit ? ' ' + fd.unit : ''}`;
    });
    const ref = c.reference ? c.reference(p, S.rows) : '';
    fb(f, all ? 'ok' : 'bad', `${marks.join('<br>')}${c.explain ? '<br>' + c.explain(p, S.rows, exp) : ''}${ref ? '<br>' + ref : ''}`);
    return all;
  }
  root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => runCheck(checks.find((c) => c.id === b.dataset.go))));

  // ---------- câu hỏi củng cố ----------
  const quiz = spec.quiz || [];
  $('quiz').innerHTML = quiz.map((q, i) => `<div class="q"><b>Câu ${i + 1}.</b> ${q.q}${q.o.map((o, j) => `<label><input type="radio" name="q${i}" value="${j}"> ${o}</label>`).join('')}</div>`).join('');
  function gradeQuiz(answers) {
    let score = 0, out = [];
    quiz.forEach((q, i) => {
      const got = answers ? answers[i] : +(root.querySelector(`input[name=q${i}]:checked`)?.value ?? -1);
      const ok = got === q.a; if (ok) score++;
      out.push(`${ok ? '✓' : '✗'} Câu ${i + 1}: ${ok ? '' : `đáp án đúng là “${q.o[q.a]}”. `}${q.why || ''}`);
    });
    fb($('q-fb'), score === quiz.length ? 'ok' : 'info', `<b>Được ${score}/${quiz.length} câu.</b><br>${out.join('<br>')}`);
    return score;
  }
  $('q-check').addEventListener('click', () => gradeQuiz());

  // ---------- đồ thị ----------
  function drawGraphs() {
    const s = timed || spec.state ? st() : {};
    graphs.forEach((g, i) => {
      const series = [];
      const curve = g.curve?.(p, s);
      if (curve) series.push({ pts: curve, color: theme().s2, width: 2, dash: g.curveDash });
      const pts = S.rows.map((r) => [r[g.x], r[g.y]]).filter((q) => isFinite(q[0]) && isFinite(q[1]));
      let cap = '';
      if (g.fit && pts.length >= 2) {
        const fit = g.fit === 'origin'
          ? (() => { let sxy = 0, sxx = 0; for (const [x, y] of pts) { sxy += x * y; sxx += x * x; } return { slope: sxy / sxx, intercept: 0, r2: NaN }; })()
          : linearFit(pts);
        if (fit) {
          const xs = pts.map((q) => q[0]), x0 = Math.min(0, ...xs), x1 = Math.max(...xs);
          series.push({ pts: [[x0, fit.slope * x0 + fit.intercept], [x1, fit.slope * x1 + fit.intercept]], color: theme().car, width: 2, dash: [6, 4] });
          cap = `Đường khớp: y = ${fmt(fit.slope, g.dec ?? 3)}·x ${fit.intercept < 0 ? '−' : '+'} ${fmt(Math.abs(fit.intercept), g.dec ?? 3)}${isNaN(fit.r2) ? '' : ` (R² = ${fmt(fit.r2, 3)})`}`;
        }
      }
      series.push({ pts, color: theme().accent, mode: 'points', r: 5 });
      const mk = g.marker?.(p, s, S.t); if (mk) series.push({ pts: [mk], color: theme().bad, mode: 'points', r: 6 });
      const all = series.flatMap((q) => q.pts);
      const pad = (a, b) => (a === b ? [a - 1, b + 1] : [a - (b - a) * 0.06, b + (b - a) * 0.06]);
      let [xmin, xmax] = all.length ? pad(Math.min(...all.map((q) => q[0])), Math.max(...all.map((q) => q[0]))) : [0, 1];
      let [ymin, ymax] = all.length ? pad(Math.min(...all.map((q) => q[1])), Math.max(...all.map((q) => q[1]))) : [0, 1];
      if (g.zeroX) xmin = Math.min(xmin, 0); if (g.zeroY) ymin = Math.min(ymin, 0);
      const rg = g.range?.(p, S.rows); if (rg) ({ xmin, xmax, ymin, ymax } = { xmin, xmax, ymin, ymax, ...rg });
      plots[i].draw({ range: { xmin, xmax, ymin, ymax }, series });
      $('gcap' + i).textContent = cap;
    });
  }

  // ---------- vòng lặp ----------
  function frame(ts) {
    if (destroyed) return;
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts;
    if (timed && S.playing) {
      S.t += dt * S.speed;
      if (S.t >= T()) { S.t = T(); S.playing = false; }
      syncReadout(); dirty = true;
    }
    if (dirty && sw > 0) {
      dirty = false;
      sctx.clearRect(0, 0, sw, sh);
      spec.draw(sctx, { w: sw, h: sh }, st(), p, S.t, theme(), toggles);
      drawGraphs();
    }
    raf = requestAnimationFrame(frame);
  }
  syncParamUI(); syncReadout(); refreshTable();
  raf = requestAnimationFrame(frame);

  // ---------- giao diện lập trình cho kiểm thử tự động ----------
  const api = {
    p, S, spec,
    setT: (t) => { S.t = Math.min(Math.max(0, t), T()); syncReadout(); dirty = true; },
    setParam: (k, v) => { p[k] = v; spec.onParam?.(p, k); afterChange(!!spec.clearOnParam?.includes(k)); },
    setChoice: (k, v) => { p[k] = v; spec.onChoice?.(p, k); afterChange(!(spec.choices || []).find((c) => c.k === k)?.keepRows); },
    record, rows: () => S.rows, duration: T,
    checkAll() { return checks.filter((c) => c.where === 'task' || c.where === 'predict').map((c) => {
      const exp = c.expected(p, S.rows); return { id: c.id, ok: runCheck(c, exp) }; }); },
    quizAllCorrect: () => gradeQuiz(quiz.map((q) => q.a)) === quiz.length,
    quizLength: quiz.length,
  };
  return {
    destroy() { destroyed = true; cancelAnimationFrame(raf); ro.disconnect(); plots.forEach((pl) => pl.destroy()); },
    api,
  };
}

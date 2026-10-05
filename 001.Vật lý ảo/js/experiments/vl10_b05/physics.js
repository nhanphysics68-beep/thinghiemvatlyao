// Vật lí 10 – Bài 5: Tốc độ và vận tốc.
// BỘ MÁY VẬT LÍ THUẦN TÚY: không phụ thuộc giao diện, kiểm thử được bằng Node.
// Mô hình: chất điểm chuyển động trên trục Ox, x(0) = 0.
//  - uniform, turn: chuyển động thẳng đều theo từng giai đoạn (có thể đổi chiều)
//  - accel: nhanh dần đều từ nghỉ, x = a·t²/2 (dùng khảo sát tốc độ tức thời)

export const SCENARIOS = {
  uniform: {
    name: 'Chuyển động thẳng đều (một chiều)',
    params: [
      { k: 'v1', label: 'Vận tốc v₁ (m/s)', min: -10, max: 10, step: 0.5, def: 4 },
      { k: 'T1', label: 'Thời gian t₁ (s)', min: 2, max: 30, step: 1, def: 15 },
    ],
  },
  turn: {
    name: 'Đi rồi quay lại (đổi chiều)',
    params: [
      { k: 'v1', label: 'Giai đoạn 1: vận tốc v₁ (m/s)', min: -10, max: 10, step: 0.5, def: 5 },
      { k: 'T1', label: 'Giai đoạn 1: thời gian t₁ (s)', min: 2, max: 30, step: 1, def: 20 },
      { k: 'v2', label: 'Giai đoạn 2: vận tốc v₂ (m/s)', min: -10, max: 10, step: 0.5, def: -4 },
      { k: 'T2', label: 'Giai đoạn 2: thời gian t₂ (s)', min: 2, max: 30, step: 1, def: 10 },
    ],
  },
  accel: {
    name: 'Xe tăng tốc (khảo sát tốc độ tức thời)',
    params: [
      { k: 'a', label: 'Gia tốc a (m/s²)', min: 0.2, max: 3, step: 0.1, def: 1 },
      { k: 'T', label: 'Thời gian chuyển động (s)', min: 4, max: 20, step: 1, def: 12 },
    ],
  },
};

export const defaultParams = (id) => Object.fromEntries(SCENARIOS[id].params.map((p) => [p.k, p.def]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function buildMotion(id, p) {
  if (id === 'accel') {
    const { a, T } = p;
    return {
      T,
      x: (t) => 0.5 * a * clamp(t, 0, T) ** 2,
      v: (t) => a * clamp(t, 0, T),
      path: (t0, t1) => Math.abs(0.5 * a * (clamp(t1, 0, T) ** 2 - clamp(t0, 0, T) ** 2)),
      vt: () => [[0, 0], [T, a * T]],
    };
  }
  const segs = id === 'uniform' ? [{ v: p.v1, T: p.T1 }] : [{ v: p.v1, T: p.T1 }, { v: p.v2, T: p.T2 }];
  const T = segs.reduce((s, g) => s + g.T, 0);
  return {
    T,
    x(t) {
      t = clamp(t, 0, T);
      let acc = 0, s0 = 0;
      for (const g of segs) { acc += g.v * Math.min(Math.max(t - s0, 0), g.T); s0 += g.T; }
      return acc;
    },
    v(t) {
      t = clamp(t, 0, T);
      let s0 = 0;
      for (let i = 0; i < segs.length; i++) {
        if (t < s0 + segs[i].T || i === segs.length - 1) return segs[i].v;
        s0 += segs[i].T;
      }
    },
    // quãng đường = tích phân của |v| theo thời gian
    path(t0, t1) {
      let s = 0, s0 = 0;
      for (const g of segs) {
        const lo = Math.max(t0, s0), hi = Math.min(t1, s0 + g.T);
        if (hi > lo) s += Math.abs(g.v) * (hi - lo);
        s0 += g.T;
      }
      return s;
    },
    // điểm vẽ đồ thị v–t (có bậc thang ở chỗ đổi vận tốc)
    vt() {
      const pts = []; let s0 = 0;
      for (const g of segs) { pts.push([s0, g.v], [s0 + g.T, g.v]); s0 += g.T; }
      return pts;
    },
  };
}

// Đại lượng trung bình trong khoảng [t0, t1].
export function averages(m, t0 = 0, t1 = m.T) {
  const dt = t1 - t0;
  const d = m.x(t1) - m.x(t0);
  const s = m.path(t0, t1);
  return { dt, d, s, speedAvg: s / dt, velAvg: d / dt };
}

export function xRange(m) {
  let lo = 0, hi = 0;
  for (let i = 0; i <= 400; i++) { const x = m.x((i / 400) * m.T); lo = Math.min(lo, x); hi = Math.max(hi, x); }
  return [lo, hi];
}

export function describe(id, p) {
  const f = (n) => String(n).replace('.', ',').replace('-', '−');
  if (id === 'uniform') return `Xe chuyển động thẳng với vận tốc v₁ = ${f(p.v1)} m/s trong ${f(p.T1)} s${p.v1 < 0 ? ' (ngược chiều dương của trục Ox)' : ''}.`;
  if (id === 'turn') return `Giai đoạn 1: vận tốc ${f(p.v1)} m/s trong ${f(p.T1)} s. Giai đoạn 2: vận tốc ${f(p.v2)} m/s trong ${f(p.T2)} s (chiều dương là chiều của trục Ox).`;
  return `Xe xuất phát từ trạng thái nghỉ, tăng tốc đều với gia tốc a = ${f(p.a)} m/s² trong ${f(p.T)} s.`;
}

// Sai số đo được giả lập: đồng hồ bấm tay (thời gian phản xạ) và cảm biến + đồng hồ hiện số.
export const NOISE = {
  hand: { sigmaT: 0.1, resT: 0.01, label: 'Đồng hồ bấm tay' },
  sensor: { sigmaT: 0.002, resT: 0.001, label: 'Cảm biến + đồng hồ hiện số' },
  sigmaX: 0.05, // m, sai số đọc vạch
  resX: 0.1,    // m, độ chia nhỏ nhất của thước
};

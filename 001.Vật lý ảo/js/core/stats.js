// Các hàm thống kê và xử lí số liệu dùng chung.
export const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

export function std(a) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
}

// Hồi quy tuyến tính y = slope·x + intercept (bình phương tối thiểu), kèm R².
export function linearFit(pts) {
  const n = pts.length;
  if (n < 2) return null;
  const mx = mean(pts.map((p) => p[0]));
  const my = mean(pts.map((p) => p[1]));
  let sxx = 0, sxy = 0, syy = 0;
  for (const [x, y] of pts) {
    sxx += (x - mx) ** 2;
    sxy += (x - mx) * (y - my);
    syy += (y - my) ** 2;
  }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx, r2: syy === 0 ? 1 : (sxy * sxy) / (sxx * syy) };
}

export const roundTo = (v, step) => Math.round(v / step) * step;

// Định dạng số theo kiểu Việt Nam (dấu phẩy thập phân).
export function fmt(v, d = 2) {
  if (!isFinite(v)) return '—';
  const s = (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
  return s.replace('.', ',').replace('-', '−');
}

// Đọc số học sinh nhập (chấp nhận cả dấu phẩy và dấu chấm).
export function parseNum(str) {
  const s = String(str).trim().replace(/−/g, '-').replace(',', '.');
  if (s === '' || !/^[-+]?\d*\.?\d+$/.test(s)) return NaN;
  return parseFloat(s);
}

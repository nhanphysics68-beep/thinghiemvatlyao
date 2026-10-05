// Bộ sinh số ngẫu nhiên có hạt giống (tái lập được) và nhiễu Gauss.
// Dùng để giả lập sai số đo có kiểm soát trong mọi thí nghiệm.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Biến ngẫu nhiên chuẩn N(0,1) theo phương pháp Box–Muller.
export function gaussian(rand) {
  let u = 0;
  while (u === 0) u = rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Kiểm chứng bộ máy vật lí Bài 5 với nghiệm giải tích. Chạy: node tests/verify_b05.mjs
import { buildMotion, averages, defaultParams, NOISE } from '../js/experiments/vl10_b05/physics.js';
import { mulberry32, gaussian } from '../js/core/rng.js';
import { mean, std, linearFit } from '../js/core/stats.js';
let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

// 1. Đi 100 m rồi quay lại 40 m (v1=5 trong 20 s, v2=-4 trong 10 s)
let m = buildMotion('turn', { v1: 5, T1: 20, v2: -4, T2: 10 });
let r = averages(m);
ok(near(m.T, 30), 'turn: tổng thời gian 30 s');
ok(near(r.d, 60), 'turn: độ dịch chuyển 60 m');
ok(near(r.s, 140), 'turn: quãng đường 140 m');
ok(near(r.speedAvg, 140 / 30), 'turn: tốc độ trung bình = 14/3 m/s');
ok(near(r.velAvg, 2), 'turn: vận tốc trung bình = 2 m/s');
ok(near(m.x(20), 100) && near(m.x(30), 60), 'turn: liên tục tại điểm quay đầu');

// 2. Chuyển động một chiều: tốc độ tb = |vận tốc tb|
m = buildMotion('uniform', { v1: -3, T1: 10 }); r = averages(m);
ok(near(r.speedAvg, 3) && near(r.velAvg, -3), 'uniform: v âm, tốc độ tb = |v tb|');

// 3. Nhanh dần đều: x = a t²/2, v tức thời = a t, v tb trên [0,T] = aT/2
m = buildMotion('accel', defaultParams('accel')); r = averages(m);
ok(near(m.x(12), 72) && near(r.velAvg, 6) && near(r.speedAvg, 6), 'accel: x(12)=72 m, v tb = 6 m/s');
const t0 = 5; let prev = Infinity;
for (const dt of [2, 1, 0.5, 0.1, 0.01]) {
  const e = Math.abs(averages(m, t0, t0 + dt).velAvg - m.v(t0));
  ok(e < prev || e < 1e-12, `accel: v tb trên Δt=${dt} s tiến về v tức thời (sai lệch ${e.toFixed(4)})`); prev = e;
}

// 4. Sai số đo: trung bình nhiều lần đo tiệm cận giá trị thật; độ lệch chuẩn đúng giá trị đặt
const rng = mulberry32(2026); const N = 20000;
const ts = Array.from({ length: N }, () => 7 + NOISE.hand.sigmaT * gaussian(rng));
ok(Math.abs(mean(ts) - 7) < 0.005, 'nhiễu: trung bình 20000 lần đo ≈ giá trị thật (7 s)');
ok(Math.abs(std(ts) - NOISE.hand.sigmaT) < 0.003, 'nhiễu: độ lệch chuẩn ≈ 0,10 s');

// 5. Hồi quy: x–t của chuyển động đều có độ dốc = vận tốc
m = buildMotion('uniform', { v1: 4, T1: 15 });
const fit = linearFit(Array.from({ length: 16 }, (_, i) => [i, m.x(i)]));
ok(near(fit.slope, 4, 1e-9) && near(fit.r2, 1, 1e-12), 'hồi quy: độ dốc = 4 m/s, R² = 1');

console.log(fail ? `\n${fail} kiểm thử thất bại` : '\nTất cả kiểm thử đạt');
process.exit(fail ? 1 : 0);

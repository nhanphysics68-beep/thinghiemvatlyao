# Cách viết một thí nghiệm bằng khung lab.js

Mỗi thí nghiệm nằm ở `js/experiments/vl10_bNN/index.js` (NN hai chữ số, ví dụ vl10_b09), gồm:

```js
import { mountLab } from '../../core/lab.js';
export const phys = {...};   // hàm vật lí thuần (không đụng DOM) -> kiểm thử bằng Node
export const spec = {...};   // khai báo thí nghiệm (xem dưới)
export const mount = (root, entry) => mountLab(root, entry, spec);
```
Mẫu hoàn chỉnh: `js/experiments/vl10_b09/index.js` (đọc kĩ trước khi viết). Tiện ích vẽ: `js/core/draw.js` (arrow, text, ruler, ground, circle, rect, line, spring, theme). Thống kê: `js/core/stats.js` (mean, std, linearFit, fmt, parseNum, roundTo).

## Các trường của spec
- `seed`, `intro` (1–2 câu), `goals` (mảng 2–4 mục tiêu), `theory` (HTML công thức, dùng ký tự Unicode: v₀, ½, ², ω, Δ…), `setup` (mô tả cách bố trí, tùy chọn), `note`.
- `params`: thanh trượt `{k,label,unit,min,max,step,def,dec,show?(p)}`. `choices`: danh sách chọn `{k,label,options:[[giá_trị,nhãn]],def,string?,keepRows?,show?}`. Đổi `choices` sẽ xóa bảng số liệu (trừ khi keepRows). `clearOnParam:[k...]` = các tham số khi đổi cũng xóa bảng. `onParam(p,k)`/`onChoice(p,k)`: sửa p khi đổi (ví dụ đặt lại giá trị mặc định). `init(p)`.
- `toggles`: ô tích `{k,label,def}`; trạng thái đưa vào `draw` qua đối số cuối.
- `duration(p)`: nếu có hàm này thì thí nghiệm có thời gian (nút Chạy/Tạm dừng/thanh trượt t); trả về tổng thời gian (s). Nếu không có thì là thí nghiệm tĩnh (t = 0).
- `state(p,t)` → đối tượng trạng thái (hàm thuần). `draw(ctx,{w,h},state,p,t,th,toggles)` vẽ cảnh (th = màu từ `theme()`). Cảnh phải vẽ vừa mọi kích thước (w từ ~330 đến 1000 px, h = `stageHeight`), tự tính tỉ lệ pixel/mét.
- `readouts(p,state,t)` → `[[nhãn, chuỗi],…]` hiển thị số liệu tức thời.
- `columns`: `[{k,label,unit,dec}]` các cột bảng số liệu; `record(p,state,t,n,rows)` → đối tượng `{k:giá_trị}` (hoặc `{error:'thông báo'}`), thêm sai số đo bằng `n.noise(sigma)` và làm tròn theo độ chia nhỏ nhất của dụng cụ `n.round(v, độ_chia)`. Nếu không khai báo `columns` thì không có bảng/ghi số liệu (dùng cho bài chỉ quan sát).
- `graphs`: `[{title,xlabel,ylabel,x:'cột',y:'cột',fit?:true|'origin',curve?:(p,state)=>[[x,y]…],marker?:(p,state,t)=>[x,y],zeroX?,zeroY?,dec?,range?}]`. `fit:true` vẽ đường khớp bình phương tối thiểu và hiện phương trình; `fit:'origin'` khớp qua gốc. `curve` là đường lí thuyết (đồ thị chạy theo trạng thái), `marker` là điểm hiện tại.
- `predict` (tùy chọn) và `tasks` (mảng): khối kiểm tra đáp án `{title,prompt(HTML),fields:[{k,label,unit,dec?,absTol?}],expected(p,rows)→{k:giá trị đúng},tol (sai số tương đối, mặc định 0,03),absTol,minRows,need?(rows,p)→thông báo hoặc null,explain?(p,rows,exp)→HTML,reference?(p,rows)→HTML}`. **`expected` của `tasks` phải tính từ số liệu học sinh đã ghi (rows)** (ví dụ độ dốc đường khớp, giá trị trung bình), còn `reference` hiển thị giá trị chuẩn cài trong mô phỏng để so sánh. `predict` tính từ p, không từ rows.
- `quiz`: `[{q,o:[3 phương án],a:chỉ_số_đúng,why}]`, 4–5 câu, câu tính toán phải kiểm tra lại bằng tay.
- `demo(api)` (tùy chọn, async): kịch bản ghi số liệu cho kiểm thử khi cách mặc định không hợp. Mặc định: thí nghiệm có thời gian thì đặt t ở 8 thời điểm và ghi; thí nghiệm tĩnh thì quét tham số đầu tiên của `params` 8 giá trị và ghi. `api` có `setT, setParam(k,v), setChoice(k,v), record(), rows(), p`.

## Quy tắc nội dung (bắt buộc)
- Tiếng Việt chuẩn SGK Kết nối tri thức với cuộc sống; dùng ký hiệu và đơn vị SI; dấu phẩy thập phân (`fmt` đã xử lí).
- Mỗi thí nghiệm phải: (1) cho học sinh quan sát hiện tượng, (2) lấy được số liệu đo (có sai số mô phỏng) để tính, (3) có kiểm tra tính toán với đáp án và giải thích, (4) liên hệ công thức SGK. Vật lí phải đúng; `phys` có kiểm thử số học bằng Node trong `tests/verify_bNN.mjs` (so với nghiệm giải tích, bảo toàn năng lượng/động lượng… nếu có).
- Dùng g = 9,8 m/s² (SGK lớp 10 dùng 9,8 hoặc 9,81; chọn 9,8 và ghi rõ).
- Không dùng thư viện ngoài, không dùng localStorage, không build. Mọi cảnh chạy tốt trên điện thoại (390 px) và máy tính; vùng bấm ≥ 44 px do khung lo sẵn.
- Không sửa `js/core/*`, `js/catalog.js`, `css/*`, `index.html`. Nếu cần thay đổi khung, ghi rõ trong báo cáo cuối.
- Bài lí thuyết/định tính (Bài 1, 2, 20) vẫn phải tương tác: có thao tác thật của học sinh và kiểm tra kết quả.

## Kiểm thử
- `node tests/smoke.mjs vl10-b09 vl10-b10` — mở trang bằng Chromium (PC và điện thoại), ghi số liệu, nhập đáp án đúng vào từng khối kiểm tra, chấm quiz với đáp án đúng, kiểm tra canvas không trống, không lỗi console, không tràn ngang. Phải “Tất cả đạt”.
- `node tests/verify_bNN.mjs` — kiểm thử vật lí của riêng bài.
- Xem thử bằng ảnh chụp: `node tests/shot.mjs vl10-bNN` (cần đúng thanh trượt #scrub và nút #rec; với bài tĩnh thì tự viết đoạn chụp riêng) rồi đọc `/tmp/shot_vl10-bNN.png` để kiểm tra bố cục.

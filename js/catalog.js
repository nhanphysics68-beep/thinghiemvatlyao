// Danh mục thí nghiệm theo sách giáo khoa Kết nối tri thức với cuộc sống.
// Thêm thí nghiệm mới = đổi status 'soon' thành 'ready' và thêm hàm load trỏ tới thư mục trong js/experiments/.
// wave: đợt xây dựng (1 = ưu tiên, 2 = mở rộng, 3 = quan sát/nhận biết), xem tài liệu thiết kế.
export const GRADES = [
  { id: 'vl10', label: 'Vật lí 10' },
  { id: 'khtn9', label: 'KHTN 9' },
  { id: 'khtn6', label: 'KHTN 6' },
];

// Mỗi bài: [số bài, tên bài theo SGK, gợi ý thí nghiệm, đợt]
const make = (grade, chapter, rows) =>
  rows.map(([n, title, topic, wave]) => ({
    id: `${grade}-b${String(n).padStart(2, '0')}`,
    grade, chapter, lesson: `Bài ${n}`, title, topic, wave, status: 'soon',
  }));

const VL10 = [
  ...make('vl10', 'Chương 1. Mở đầu', [
    [1, 'Làm quen với Vật lí', 'Quy trình nghiên cứu: giả thuyết, thí nghiệm, kết luận', 3],
    [2, 'Các quy tắc an toàn trong phòng thực hành Vật lí', 'Tình huống an toàn (điện, dụng cụ) dạng tương tác', 3],
    [3, 'Thực hành tính sai số trong phép đo. Ghi kết quả đo', 'Sai số tuyệt đối, sai số tương đối', 1],
  ]),
  ...make('vl10', 'Chương 2. Động học', [
    [4, 'Độ dịch chuyển và quãng đường đi được', 'Phân biệt độ dịch chuyển d và quãng đường s', 1],
    [5, 'Tốc độ và vận tốc', 'Tốc độ trung bình, vận tốc trung bình, tốc độ tức thời', 1],
    [6, 'Thực hành đo tốc độ của vật chuyển động', 'Cổng quang điện, đồng hồ hiện số', 1],
    [7, 'Đồ thị độ dịch chuyển – thời gian', 'Độ dốc đồ thị là vận tốc', 1],
    [8, 'Chuyển động biến đổi. Gia tốc', 'Đồ thị v – t, gia tốc', 1],
    [9, 'Chuyển động thẳng biến đổi đều', 'Xe trên máng nghiêng', 1],
    [10, 'Sự rơi tự do', 'Ống Newton ảo', 1],
    [11, 'Thực hành đo gia tốc rơi tự do', 'Đồ thị h – t²', 1],
    [12, 'Chuyển động ném', 'Quỹ đạo, tầm xa, độ cao cực đại', 1],
  ]),
  ...make('vl10', 'Chương 3. Động lực học', [
    [13, 'Tổng hợp và phân tích lực. Cân bằng lực', 'Hình bình hành lực', 2],
    [14, 'Định luật 1 Newton', 'Xe trên đệm khí, quán tính', 2],
    [15, 'Định luật 2 Newton', 'Khảo sát F, m, a trên đệm khí', 2],
    [16, 'Định luật 3 Newton', 'Cặp lực tương tác giữa hai xe', 2],
    [17, 'Trọng lực và lực căng', 'Hệ ròng rọc, lực căng dây', 2],
    [18, 'Lực ma sát', 'Mặt phẳng nghiêng, hệ số ma sát', 2],
    [19, 'Lực cản và lực nâng', 'Vật rơi trong chất lưu, vận tốc giới hạn', 2],
    [20, 'Một số ví dụ về cách giải các bài toán thuộc phần động lực học', 'Bài toán nhiều lực, mô phỏng và đối chiếu lời giải', 3],
    [21, 'Moment lực. Cân bằng của vật rắn', 'Thanh cân bằng, quy tắc moment', 2],
    [22, 'Thực hành: Tổng hợp lực', 'Tổng hợp hai lực đồng quy bằng lực kế', 2],
  ]),
  ...make('vl10', 'Chương 4. Năng lượng, công, công suất', [
    [23, 'Năng lượng. Công cơ học', 'Công của lực kéo trên mặt phẳng', 2],
    [24, 'Công suất', 'Công suất P = A/t', 2],
    [25, 'Động năng, thế năng', 'Vật rơi, lò xo nén', 2],
    [26, 'Cơ năng và định luật bảo toàn cơ năng', 'Con lắc, trượt dốc, đồ thị năng lượng', 2],
    [27, 'Hiệu suất', 'Năng lượng có ích và hao phí', 2],
  ]),
  ...make('vl10', 'Chương 5. Động lượng', [
    [28, 'Động lượng', 'Động lượng p = mv, xung của lực', 2],
    [29, 'Định luật bảo toàn động lượng', 'Hai xe va chạm trên đệm khí', 2],
    [30, 'Thực hành: Xác định động lượng của vật trước và sau va chạm', 'Đệm khí, cổng quang điện', 2],
  ]),
  ...make('vl10', 'Chương 6. Chuyển động tròn đều', [
    [31, 'Động học của chuyển động tròn đều', 'Tốc độ góc, chu kì, tần số', 2],
    [32, 'Lực hướng tâm và gia tốc hướng tâm', 'Thay đổi r, ω, m và đo lực hướng tâm', 2],
  ]),
  ...make('vl10', 'Chương 7. Biến dạng của vật rắn. Áp suất chất lỏng', [
    [33, 'Biến dạng của vật rắn', 'Định luật Hooke, độ cứng lò xo', 2],
    [34, 'Khối lượng riêng. Áp suất chất lỏng', 'Áp suất theo độ sâu, bình thông nhau', 2],
  ]),
];

const KHTN9 = [
  ...make('khtn9', 'Chương 1. Năng lượng cơ học', [
    [2, 'Động năng. Thế năng', 'Vật rơi, trượt, lò xo nén', 2],
    [3, 'Cơ năng', 'Con lắc, trượt dốc, đồ thị năng lượng', 2],
    [4, 'Công và công suất', 'Kéo vật lên cao, đo thời gian thực hiện công', 2],
  ]),
  ...make('khtn9', 'Chương 2. Ánh sáng', [
    [5, 'Khúc xạ ánh sáng', 'Định luật Snell, chiết suất', 1],
    [6, 'Phản xạ toàn phần', 'Góc tới hạn, sợi quang', 2],
    [7, 'Lăng kính', 'Tán sắc ánh sáng trắng, góc lệch', 2],
    [8, 'Thấu kính', 'Vật, ảnh, tiêu cự, số phóng đại', 1],
    [9, 'Thực hành đo tiêu cự của thấu kính hội tụ', 'Băng quang học ảo', 1],
    [10, 'Kính lúp. Bài tập thấu kính', 'Số bội giác, dựng ảnh bằng ba tia đặc biệt', 3],
  ]),
  ...make('khtn9', 'Chương 3. Điện', [
    [11, 'Điện trở. Định luật Ohm', 'Đường đặc trưng U – I', 1],
    [12, 'Đoạn mạch nối tiếp, song song', 'Điện trở tương đương', 1],
    [13, 'Năng lượng của dòng điện và công suất điện', 'Nhiệt lượng Q = I²Rt, công suất điện', 2],
  ]),
  ...make('khtn9', 'Chương 4. Điện từ', [
    [14, 'Cảm ứng điện từ. Nguyên tắc tạo ra dòng điện xoay chiều', 'Nam châm chuyển động trong cuộn dây, khung dây quay', 2],
    [15, 'Tác dụng của dòng điện xoay chiều', 'Dạng sóng xoay chiều, các tác dụng của dòng điện', 3],
  ]),
  ...make('khtn9', 'Chương 5. Năng lượng với cuộc sống', [
    [16, 'Vòng năng lượng trên Trái Đất. Năng lượng hoá thạch', 'Sơ đồ vòng năng lượng, nguồn năng lượng hóa thạch', 3],
    [17, 'Một số dạng năng lượng tái tạo', 'Pin mặt trời, tuabin gió, thủy điện', 3],
  ]),
];

const KHTN6 = [
  ...make('khtn6', 'Chương 1. Mở đầu (các phép đo)', [
    [5, 'Đo chiều dài', 'Thước ảo, giới hạn đo, độ chia nhỏ nhất', 2],
    [6, 'Đo khối lượng', 'Cân đĩa và cân điện tử ảo', 2],
    [7, 'Đo thời gian', 'Đồng hồ bấm giây, chu kì con lắc', 2],
    [8, 'Đo nhiệt độ', 'Nhiệt kế ảo, thang nhiệt độ Celsius', 3],
  ]),
  ...make('khtn6', 'Chương 8. Lực trong đời sống', [
    [40, 'Lực là gì', 'Đẩy, kéo vật; tác dụng của lực', 3],
    [41, 'Biểu diễn lực', 'Mũi tên lực: điểm đặt, phương, chiều, độ lớn', 3],
    [42, 'Biến dạng của lò xo', 'Đồ thị lực – độ giãn, độ cứng', 1],
    [43, 'Trọng lượng, lực hấp dẫn', 'Lực kế ở các nơi có g khác nhau', 3],
    [44, 'Lực ma sát', 'Kéo khối gỗ trên các bề mặt', 1],
    [45, 'Lực cản của nước', 'Vật hình dạng khác nhau rơi trong nước', 3],
  ]),
  ...make('khtn6', 'Chương 9. Năng lượng', [
    [46, 'Năng lượng và sự truyền năng lượng', 'Sơ đồ truyền năng lượng', 3],
    [47, 'Một số dạng năng lượng', 'Nhận biết các dạng năng lượng', 3],
    [48, 'Sự chuyển hóa năng lượng', 'Con lắc, tàu lượn: động năng và thế năng', 2],
    [49, 'Năng lượng hao phí', 'Có và không có ma sát', 3],
    [50, 'Năng lượng tái tạo', 'Pin mặt trời, tuabin gió', 3],
    [51, 'Tiết kiệm năng lượng', 'Điện năng tiêu thụ của hộ gia đình', 3],
  ]),
  ...make('khtn6', 'Chương 10. Trái Đất và bầu trời', [
    [52, 'Chuyển động nhìn thấy của Mặt Trời. Thiên thể', 'Bóng gậy theo giờ, thiên cầu', 3],
    [53, 'Mặt Trăng', 'Các pha Mặt Trăng', 3],
    [54, 'Hệ Mặt Trời', 'Quỹ đạo các hành tinh theo tỉ lệ', 3],
    [55, 'Ngân Hà', 'Mô hình thiên hà tương tác', 3],
  ]),
];

// Các bài đã có thí nghiệm. Thư mục: js/experiments/vl10_b09/index.js ứng với id 'vl10-b09'.
export const READY = [
  'vl10-b01', 'vl10-b02', 'vl10-b03', 'vl10-b04', 'vl10-b05', 'vl10-b06', 'vl10-b07', 'vl10-b08', 'vl10-b09', 'vl10-b10', 'vl10-b11', 'vl10-b12',
  'vl10-b13', 'vl10-b14', 'vl10-b15', 'vl10-b16', 'vl10-b17', 'vl10-b18', 'vl10-b19', 'vl10-b20', 'vl10-b21', 'vl10-b22', 'vl10-b23', 'vl10-b24',
  'vl10-b25', 'vl10-b26', 'vl10-b27', 'vl10-b28', 'vl10-b29', 'vl10-b30', 'vl10-b31', 'vl10-b32', 'vl10-b33', 'vl10-b34',
];
export const CATALOG = [...VL10, ...KHTN9, ...KHTN6].map((e) => READY.includes(e.id)
  ? { ...e, status: 'ready', load: () => import(`./experiments/${e.id.replace('-b', '_b')}/index.js`) } : e);

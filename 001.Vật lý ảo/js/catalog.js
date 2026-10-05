// Danh mục thí nghiệm. Thêm thí nghiệm mới = thêm một dòng ở đây + một thư mục trong js/experiments/.
// status: 'ready' (đã có) | 'soon' (đang lên kế hoạch). wave: đợt xây dựng (xem tài liệu thiết kế).
export const GRADES = [
  { id: 'vl10', label: 'Vật lí 10' },
  { id: 'khtn9', label: 'KHTN 9' },
  { id: 'khtn6', label: 'KHTN 6' },
];

const soon = (id, grade, lesson, title, topic) => ({ id, grade, lesson, title, topic, wave: 1, status: 'soon' });

export const CATALOG = [
  { id: 'vl10-b05', grade: 'vl10', lesson: 'Bài 5', title: 'Tốc độ và vận tốc', topic: 'Tốc độ trung bình, vận tốc trung bình, tốc độ tức thời', wave: 1, status: 'ready',
    load: () => import('./experiments/vl10_b05/index.js') },
  soon('vl10-b03', 'vl10', 'Bài 3', 'Thực hành tính sai số trong phép đo', 'Sai số tuyệt đối, sai số tương đối'),
  soon('vl10-b04', 'vl10', 'Bài 4', 'Độ dịch chuyển và quãng đường đi được', 'Phân biệt d và s'),
  soon('vl10-b06', 'vl10', 'Bài 6', 'Thực hành đo tốc độ của vật chuyển động', 'Cổng quang điện, đồng hồ hiện số'),
  soon('vl10-b07', 'vl10', 'Bài 7', 'Đồ thị độ dịch chuyển – thời gian', 'Độ dốc đồ thị là vận tốc'),
  soon('vl10-b08', 'vl10', 'Bài 8', 'Chuyển động biến đổi. Gia tốc', 'Đồ thị v – t'),
  soon('vl10-b09', 'vl10', 'Bài 9', 'Chuyển động thẳng biến đổi đều', 'Xe trên máng nghiêng'),
  soon('vl10-b10', 'vl10', 'Bài 10', 'Sự rơi tự do', 'Ống Newton ảo'),
  soon('vl10-b11', 'vl10', 'Bài 11', 'Thực hành đo gia tốc rơi tự do', 'Đồ thị h – t²'),
  soon('vl10-b12', 'vl10', 'Bài 12', 'Chuyển động ném', 'Quỹ đạo, tầm xa'),
  soon('khtn9-b05', 'khtn9', 'Bài 5', 'Khúc xạ ánh sáng', 'Định luật Snell, chiết suất'),
  soon('khtn9-b08', 'khtn9', 'Bài 8', 'Thấu kính', 'Vật, ảnh, tiêu cự'),
  soon('khtn9-b09', 'khtn9', 'Bài 9', 'Thực hành đo tiêu cự thấu kính hội tụ', 'Băng quang học ảo'),
  soon('khtn9-b11', 'khtn9', 'Bài 11', 'Điện trở. Định luật Ohm', 'Đường đặc trưng U – I'),
  soon('khtn9-b12', 'khtn9', 'Bài 12', 'Đoạn mạch nối tiếp, song song', 'Điện trở tương đương'),
  soon('khtn6-b42', 'khtn6', 'Bài 42', 'Biến dạng của lò xo', 'Đồ thị lực – độ giãn'),
  soon('khtn6-b44', 'khtn6', 'Bài 44', 'Lực ma sát', 'Kéo vật trên các bề mặt'),
];

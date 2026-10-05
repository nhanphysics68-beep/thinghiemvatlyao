import { CATALOG, GRADES } from './catalog.js';

const app = document.getElementById('app');
const crumb = document.getElementById('crumb');
let current = null;      // thí nghiệm đang mở (có hàm destroy)
let gradeFilter = 'vl10';

function home() {
  if (current) { current.destroy?.(); current = null; }
  crumb.textContent = 'Danh mục thí nghiệm';
  document.title = 'Phòng thí nghiệm Vật lí ảo';
  const items = CATALOG.filter((e) => e.grade === gradeFilter);
  app.innerHTML = `
    <h1>Phòng thí nghiệm Vật lí ảo</h1>
    <p class="muted">Mô phỏng tương tác cho KHTN 6, KHTN 9 và Vật lí 10 (sách Kết nối tri thức). Chạy trên máy tính và điện thoại.</p>
    <div class="chips" role="group" aria-label="Chọn lớp">
      ${GRADES.map((g) => `<button class="chip" data-g="${g.id}" aria-pressed="${g.id === gradeFilter}">${g.label}</button>`).join('')}
    </div>
    <div class="cards">
      ${items.map((e) => `
        <a class="exp ${e.status}" ${e.status === 'ready' ? `href="#${e.id}"` : 'aria-disabled="true"'}>
          <div><span class="tag ${e.status}">${e.status === 'ready' ? 'Sẵn sàng' : 'Sắp có'}</span><span class="tag">${e.lesson}</span></div>
          <h3 style="margin:8px 0 4px">${e.title}</h3>
          <div class="muted">${e.topic}</div>
        </a>`).join('')}
    </div>`;
  app.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { gradeFilter = b.dataset.g; home(); }));
}

async function open(id) {
  const entry = CATALOG.find((e) => e.id === id && e.status === 'ready');
  if (!entry) return home();
  if (current) { current.destroy?.(); current = null; }
  crumb.innerHTML = `<a href="#" style="color:inherit">Danh mục</a> › ${GRADES.find((g) => g.id === entry.grade).label} › ${entry.lesson}`;
  app.innerHTML = '<p class="muted">Đang tải thí nghiệm…</p>';
  try {
    const mod = await entry.load();
    app.innerHTML = '';
    document.title = `${entry.lesson}. ${entry.title} – Vật lí ảo`;
    current = mod.mount(app, entry);
  } catch (err) {
    app.innerHTML = `<div class="card"><b>Không tải được thí nghiệm.</b><div class="muted">${String(err.message || err)}</div></div>`;
    console.error(err);
  }
}

function route() {
  const id = location.hash.replace(/^#/, '');
  id ? open(id) : home();
}
window.addEventListener('hashchange', route);
route();

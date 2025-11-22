// interviewer.js
(async function() {
    
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev';
    
    let currentFullname = '';
    let currentDob = '';
    let currentManagingInterview = ''; // Biến lưu tên phỏng vấn đang thao tác

    try {
        // 1. Check Login
        const response = await fetch(`${NGROK_BASE_URL}/interviewer.php`, { method: 'GET', credentials: 'include', headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await response.json();

        if (data.success === true) {
            currentFullname = data.fullname || '';
            currentDob = data.dob || '';
            
            // Gọi các hàm setup (theo đúng cấu trúc cũ của bạn)
            setupProfileSidebar(data);
            setupLogoutButton();
            setupInterviewLogic();
            setupIntervieweeModalLogic();
            setupContentModalLogic(); // <-- Hàm mới thêm
        } else {
            window.location.href = 'login.html';
        }

    } catch (error) { console.error(error); window.location.href = 'login.html'; }

    // --- CÁC HÀM CŨ CỦA BẠN (GIỮ NGUYÊN) ---

    function setupProfileSidebar(data) {
        // (Code cũ xử lý profile sidebar - Giữ nguyên)
        document.getElementById('username-display').textContent = data.username;
        document.getElementById('info-username').textContent = data.username;
        document.getElementById('info-fullname').textContent = currentFullname;
        document.getElementById('info-dob').textContent = currentDob;
        
        const sidebar = document.getElementById('sidebar-profile');
        document.getElementById('edit-profile-btn').onclick = () => sidebar.classList.add('is-editing');
        document.getElementById('cancel-profile-btn').onclick = () => sidebar.classList.remove('is-editing');
        
        document.getElementById('save-profile-btn').onclick = async () => {
            // Logic lưu profile (như cũ)
            const newFullname = document.getElementById('edit-fullname').value;
            const newDob = document.getElementById('edit-dob').value;
            await fetch(`${NGROK_BASE_URL}/editInterviewerInfo.php`, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                body: new URLSearchParams({ 'fullname': newFullname, 'dob': newDob })
            });
            document.getElementById('info-fullname').textContent = newFullname;
            document.getElementById('info-dob').textContent = newDob;
            sidebar.classList.remove('is-editing');
        };
    }

    function setupLogoutButton() {
        document.getElementById('logout-button').onclick = async () => {
            await fetch(`${NGROK_BASE_URL}/logout.php`, { method:'GET', credentials:'include', headers:{'ngrok-skip-browser-warning':'true'} });
            window.location.href = 'login.html';
        };
    }

    // --- HÀM QUẢN LÝ LIST PHỎNG VẤN (CẬP NHẬT THÊM NÚT NỘI DUNG) ---
    function setupInterviewLogic() {
        const listEl = document.getElementById('interview-list');
        const loadingEl = document.getElementById('interview-list-loading');

        async function loadInterviews() {
            listEl.innerHTML = '';
            loadingEl.style.display = 'block';
            const res = await fetch(`${NGROK_BASE_URL}/listInterview.php`, { credentials: 'include', headers: {'ngrok-skip-browser-warning':'true'} });
            const data = await res.json();
            loadingEl.style.display = 'none';

            if (data.interviews) {
                data.interviews.forEach(name => {
                    const li = document.createElement('li');
                    // Thêm nút "Nội dung" vào đây
                    li.innerHTML = `
                        <span>${name}</span>
                        <div class="action-btn-group">
                            <button class="btn-small btn-blue open-interviewee-btn" data-name="${name}">Ứng viên</button>
                            <button class="btn-small btn-green open-content-btn" data-name="${name}">Nội dung</button>
                            <button class="btn-small btn-red delete-interview-btn" data-name="${name}">Xóa</button>
                        </div>
                    `;
                    listEl.appendChild(li);
                });
            }
        }

        // Xử lý click trong list (Event Delegation)
        listEl.addEventListener('click', (e) => {
            const btn = e.target;
            const name = btn.dataset.name;
            if (!name) return;

            if (btn.classList.contains('open-interviewee-btn')) {
                openIntervieweeModal(name); // Hàm global bên dưới
            } else if (btn.classList.contains('open-content-btn')) {
                openContentModal(name); // Hàm global mới
            } else if (btn.classList.contains('delete-interview-btn')) {
                if(confirm('Xóa cuộc phỏng vấn này?')) {
                    fetch(`${NGROK_BASE_URL}/deleteInterview.php`, {
                        method: 'POST', credentials: 'include',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                        body: new URLSearchParams({ 'interview_name': name })
                    }).then(() => loadInterviews());
                }
            }
        });

        // Xử lý tạo mới
        document.getElementById('create-interview-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const count = document.getElementById('question-count').value;
            await fetch(`${NGROK_BASE_URL}/createInterview.php`, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                body: new URLSearchParams({ 'question_count': count })
            });
            loadInterviews();
        });

        loadInterviews();
    }

    // --- HÀM QUẢN LÝ MODAL ỨNG VIÊN (FIX LỖI SỬA TÊN TRONG NÀY) ---
    function setupIntervieweeModalLogic() {
        const modal = document.getElementById('interviewee-modal');
        const tbody = document.getElementById('interviewee-list-body');
        const statusMsg = document.getElementById('modal-status-msg');

        // Định nghĩa hàm mở modal ra global để function bên trên gọi được
        window.openIntervieweeModal = (name) => {
            currentManagingInterview = name;
            document.getElementById('modal-title').textContent = `Ứng viên: ${name}`;
            modal.style.display = 'flex';
            loadInterviewees();
        };

        document.getElementById('modal-close-btn').onclick = () => modal.style.display = 'none';

        async function loadInterviewees() {
            tbody.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';
            const res = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                body: new URLSearchParams({ action: 'list', interview_name: currentManagingInterview })
            });
            const data = await res.json();
            renderTable(data.interviewees || []);
        }

        function renderTable(list) {
            tbody.innerHTML = '';
            list.forEach(user => {
                const tr = document.createElement('tr');
                // Render Input sửa tên trực tiếp để fix lỗi
                tr.innerHTML = `
                    <td>${user.username}</td>
                    <td>
                        <input type="text" class="edit-name-input" value="${user.fullname}" id="input-${user.username}">
                        <button class="btn-small btn-blue save-name-btn" data-user="${user.username}">Lưu</button>
                    </td>
                    <td>${user.joincode}</td>
                    <td>${user.status ? 'Đã nộp' : 'Chưa nộp'}</td>
                    <td><button class="btn-small btn-red delete-user-btn" data-user="${user.username}">Xóa</button></td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Xử lý click trong bảng (Lưu tên / Xóa)
        tbody.addEventListener('click', async (e) => {
            const btn = e.target;
            const username = btn.dataset.user;
            if (!username) return;

            if (btn.classList.contains('save-name-btn')) {
                const newName = document.getElementById(`input-${username}`).value;
                btn.textContent = '...';
                await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ 
                        action: 'update', 
                        interview_name: currentManagingInterview, 
                        username_to_update: username, 
                        fullname: newName 
                    })
                });
                btn.textContent = 'Lưu';
                alert('Đã lưu tên mới!');
            } else if (btn.classList.contains('delete-user-btn')) {
                if(!confirm('Xóa ứng viên này?')) return;
                await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ action: 'delete', interview_name: currentManagingInterview, username_to_delete: username })
                });
                loadInterviewees();
            }
        });

        // Thêm mới
        document.getElementById('modal-add-interviewee-btn').onclick = async () => {
            statusMsg.textContent = "Đang thêm...";
            const res = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                body: new URLSearchParams({ action: 'add', interview_name: currentManagingInterview })
            });
            const data = await res.json();
            // Sửa lại để hiển thị Mã tham gia (joincode) cho đúng logic
            msg.textContent = `Đã thêm thành công: ${data.newUser.username} (Mã tham gia: ${data.newUser.joincode})`;
            loadInterviewees();
        };
    }

    // --- HÀM MỚI: QUẢN LÝ MODAL NỘI DUNG ---
    function setupContentModalLogic() {
        const modal = document.getElementById('content-modal');
        const closeBtn = document.getElementById('content-close-btn');
        const container = document.getElementById('questions-container');
        const loading = document.getElementById('content-loading');
        const form = document.getElementById('content-form');

        window.openContentModal = (name) => {
            currentManagingInterview = name;
            modal.style.display = 'flex';
            loading.style.display = 'block';
            form.style.display = 'none';
            loadContent();
        };
        
        closeBtn.onclick = () => modal.style.display = 'none';

        async function loadContent() {
            const res = await fetch(`${NGROK_BASE_URL}/manageContent.php`, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                body: new URLSearchParams({ action: 'load', interview_name: currentManagingInterview })
            });
            const json = await res.json();
            loading.style.display = 'none';
            
            if (json.success) {
                form.style.display = 'block';
                container.innerHTML = '';
                json.data.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'question-block'; // Class này sẽ style ở CSS
                    div.innerHTML = `
                        <h4>Câu hỏi ${item.id}</h4>
                        <label>Nội dung:</label>
                        <textarea class="q-text" data-id="${item.id}">${item.question}</textarea>
                        <label>Tiêu chí chấm:</label>
                        <textarea class="c-text" data-id="${item.id}">${item.criteria}</textarea>
                    `;
                    container.appendChild(div);
                });
            }
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const qList = [];
            document.querySelectorAll('.q-text').forEach(el => {
                const id = el.dataset.id;
                const criteria = document.querySelector(`.c-text[data-id="${id}"]`).value;
                qList.push({ id: id, question: el.value, criteria: criteria });
            });

            const status = document.getElementById('content-status-msg');
            status.textContent = "Đang lưu...";
            
            await fetch(`${NGROK_BASE_URL}/manageContent.php`, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                body: new URLSearchParams({ 
                    action: 'save', 
                    interview_name: currentManagingInterview, 
                    questions: JSON.stringify(qList) 
                })
            });
            status.textContent = "Lưu thành công!";
            setTimeout(() => { modal.style.display = 'none'; status.textContent=''; }, 1000);
        });
    }

})();


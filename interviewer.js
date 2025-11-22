(async function() {
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev';
    let currentManagingInterview = '';

    try {
        const response = await fetch(`${NGROK_BASE_URL}/interviewer.php`, { method: 'GET', credentials: 'include', headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await response.json();

        if (data.success === true) {
            // HIỂN THỊ LỜI CHÀO BẰNG TÊN ĐẦY ĐỦ
            document.getElementById('username-display').textContent = data.fullname || data.username;
            
            // Sidebar Info
            document.getElementById('info-username').textContent = data.username;
            document.getElementById('info-fullname').textContent = data.fullname || 'Chưa cập nhật';
            document.getElementById('info-dob').textContent = data.dob || 'Chưa cập nhật';

            setupProfileSidebar(data);
            setupLogoutButton();
            setupInterviewLogic();
            setupIntervieweeModalLogic();
            setupContentModalLogic();
        } else {
            window.location.href = 'login.html';
        }
    } catch (e) { console.error(e); }

    function setupLogoutButton() {
        document.getElementById('logout-button').onclick = async () => {
            await fetch(`${NGROK_BASE_URL}/logout.php`, { method:'GET', credentials:'include', headers:{'ngrok-skip-browser-warning':'true'} });
            window.location.href = 'login.html';
        };
    }
    
    function setupProfileSidebar(data) { /* (Giữ nguyên code cũ, không thay đổi) */ 
        const sidebar = document.getElementById('sidebar-profile');
        document.getElementById('edit-profile-btn').onclick = () => sidebar.classList.add('is-editing');
        document.getElementById('cancel-profile-btn').onclick = () => sidebar.classList.remove('is-editing');
        document.getElementById('save-profile-btn').onclick = async () => {
            const newFullname = document.getElementById('edit-fullname').value;
            const newDob = document.getElementById('edit-dob').value;
            await fetch(`${NGROK_BASE_URL}/editInterviewerInfo.php`, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                body: new URLSearchParams({ 'fullname': newFullname, 'dob': newDob })
            });
            document.getElementById('info-fullname').textContent = newFullname;
            document.getElementById('info-dob').textContent = newDob;
            // Cập nhật lại lời chào ngay lập tức
            document.getElementById('username-display').textContent = newFullname;
            sidebar.classList.remove('is-editing');
        };
    }

    // --- LOGIC QUẢN LÝ PHỎNG VẤN (QUAN TRỌNG: CẬP NHẬT HIỂN THỊ) ---
    function setupInterviewLogic() {
        const listEl = document.getElementById('interview-list');
        const loadingEl = document.getElementById('interview-list-loading');

        async function loadInterviews() {
            listEl.innerHTML = '';
            loadingEl.style.display = 'block';
            
            const res = await fetch(`${NGROK_BASE_URL}/listInterview.php`, { credentials: 'include', headers: {'ngrok-skip-browser-warning':'true'} });
            const data = await res.json();
            loadingEl.style.display = 'none';

            if (data.interviews && data.interviews.length > 0) {
                data.interviews.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'interview-item'; // Dùng class CSS mới

                    // Kiểm tra có mô tả không để hiện nút Toggle
                    const hasDesc = item.description && item.description.trim() !== "";
                    const toggleBtnHtml = hasDesc 
                        ? `<button class="btn-small btn-gray toggle-desc-btn">▼ Mô tả</button>` 
                        : '';

                    li.innerHTML = `
                        <div class="interview-header">
                            <div class="interview-info">
                                <span class="interview-name">${item.name}</span>
                                <span class="interview-id">ID: ${item.id}</span>
                            </div>
                            <div class="action-btn-group">
                                ${toggleBtnHtml}
                                <button class="btn-small btn-blue open-interviewee-btn" data-name="${item.id}">Ứng viên</button>
                                <button class="btn-small btn-green open-content-btn" data-name="${item.id}">Nội dung</button>
                                <button class="btn-small btn-red delete-interview-btn" data-name="${item.id}">Xóa</button>
                            </div>
                        </div>
                        <div class="interview-desc-content" style="display:none;">
                            ${item.description}
                        </div>
                    `;
                    listEl.appendChild(li);
                });
            } else {
                listEl.innerHTML = '<p style="text-align:center;">Chưa có cuộc phỏng vấn nào.</p>';
            }
        }

        // Event Delegation (Xử lý click nút Toggle và các nút khác)
        listEl.addEventListener('click', (e) => {
            const target = e.target;
            
            // Toggle Mô tả
            if (target.classList.contains('toggle-desc-btn')) {
                const li = target.closest('li');
                const descDiv = li.querySelector('.interview-desc-content');
                if (descDiv.style.display === 'none') {
                    descDiv.style.display = 'block';
                    target.textContent = '▲ Thu gọn';
                } else {
                    descDiv.style.display = 'none';
                    target.textContent = '▼ Mô tả';
                }
                return;
            }

            const name = target.dataset.name;
            if (!name) return;

            if (target.classList.contains('open-interviewee-btn')) openIntervieweeModal(name);
            else if (target.classList.contains('open-content-btn')) openContentModal(name);
            else if (target.classList.contains('delete-interview-btn')) {
                if(confirm('Xóa cuộc phỏng vấn này?')) {
                    fetch(`${NGROK_BASE_URL}/deleteInterview.php`, {
                        method: 'POST', credentials: 'include',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                        body: new URLSearchParams({ 'interview_name': name })
                    }).then(() => loadInterviews());
                }
            }
        });

        // Xử lý Tạo Mới (Cập nhật gửi thêm full_name và description)
        document.getElementById('create-interview-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('interview-fullname').value;
            const count = document.getElementById('question-count').value;
            const desc = document.getElementById('interview-desc').value;
            const msg = document.getElementById('create-status-msg');
            const btn = e.target.querySelector('button');

            btn.disabled = true; msg.textContent = "Đang tạo...";

            try {
                const res = await fetch(`${NGROK_BASE_URL}/createInterview.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ 
                        'full_name': fullName,
                        'question_count': count,
                        'description': desc
                    })
                });
                const json = await res.json();
                
                if(json.success) {
                    msg.textContent = "Thành công!";
                    document.getElementById('interview-fullname').value = '';
                    document.getElementById('interview-desc').value = '';
                    loadInterviews();
                } else {
                    msg.textContent = json.message;
                }
            } catch(e) { msg.textContent = "Lỗi kết nối."; }
            finally { btn.disabled = false; setTimeout(()=>msg.textContent='', 3000); }
        });

        loadInterviews();
    }

    // --- CÁC LOGIC MODAL KHÁC GIỮ NGUYÊN ---
    function setupIntervieweeModalLogic() { /* Giữ nguyên logic Modal Ứng viên đã sửa ở bước trước */ 
        const modal = document.getElementById('interviewee-modal');
        const tbody = document.getElementById('interviewee-list-body');
        const statusMsg = document.getElementById('modal-status-msg');
        window.openIntervieweeModal = (name) => {
            currentManagingInterview = name;
            document.getElementById('modal-title').textContent = `Ứng viên: ${name}`;
            modal.style.display = 'flex';
            loadInterviewees();
        };
        document.getElementById('modal-close-btn').onclick = () => modal.style.display = 'none';
        async function loadInterviewees() {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Đang tải...</td></tr>';
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
            if(list.length===0) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Chưa có ứng viên.</td></tr>';
            list.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.username}</td>
                    <td><input type="text" class="edit-name-input" value="${user.fullname}" id="input-${user.username}"> <button class="btn-small btn-blue save-name-btn" data-user="${user.username}">Lưu</button></td>
                    <td>${user.joincode}</td>
                    <td>${user.status ? '<span style="color:green;font-weight:bold">Đã nộp</span>' : '<span style="color:gray">Chưa nộp</span>'}</td>
                    <td><button class="btn-small btn-red delete-user-btn" data-user="${user.username}">Xóa</button></td>
                `;
                tbody.appendChild(tr);
            });
        }
        tbody.addEventListener('click', async (e) => {
            const btn = e.target; const username = btn.dataset.user; if (!username) return;
            if (btn.classList.contains('save-name-btn')) {
                const newName = document.getElementById(`input-${username}`).value;
                btn.textContent='...';
                await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ action: 'update', interview_name: currentManagingInterview, username_to_update: username, fullname: newName })
                });
                btn.textContent='Lưu'; alert('Đã lưu!');
            } else if (btn.classList.contains('delete-user-btn')) {
                if(confirm('Xóa?')) {
                    await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                        method: 'POST', credentials: 'include',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                        body: new URLSearchParams({ action: 'delete', interview_name: currentManagingInterview, username_to_delete: username })
                    });
                    loadInterviewees();
                }
            }
        });
        document.getElementById('modal-add-interviewee-btn').onclick = async () => {
            statusMsg.textContent = "Đang thêm...";
            const res = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                body: new URLSearchParams({ action: 'add', interview_name: currentManagingInterview })
            });
            const data = await res.json();
            statusMsg.textContent = `Thêm thành công: ${data.newUser.username} (Mã: ${data.newUser.joincode})`;
            loadInterviewees();
        };
    }

    function setupContentModalLogic() { /* Giữ nguyên logic Modal Nội dung đã sửa ở bước trước */ 
        const modal = document.getElementById('content-modal');
        const container = document.getElementById('questions-container');
        const form = document.getElementById('content-form');
        window.openContentModal = async (name) => {
            currentManagingInterview = name; modal.style.display = 'flex'; form.style.display = 'none';
            const res = await fetch(`${NGROK_BASE_URL}/manageContent.php`, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                body: new URLSearchParams({ action: 'load', interview_name: name })
            });
            const json = await res.json();
            document.getElementById('content-loading').style.display='none';
            if (json.success) {
                form.style.display = 'block'; container.innerHTML = '';
                json.data.forEach(item => {
                    const div = document.createElement('div'); div.className = 'question-block';
                    div.innerHTML = `<h4>Câu ${item.id}</h4><label>Câu hỏi:</label><textarea class="q-text" data-id="${item.id}">${item.question}</textarea><label>Tiêu chí:</label><textarea class="c-text" data-id="${item.id}">${item.criteria}</textarea>`;
                    container.appendChild(div);
                });
            }
        };
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const qList = []; document.querySelectorAll('.q-text').forEach(el => { qList.push({ id: el.dataset.id, question: el.value, criteria: document.querySelector(`.c-text[data-id="${el.dataset.id}"]`).value }); });
            document.getElementById('content-status-msg').textContent = "Đang lưu...";
            await fetch(`${NGROK_BASE_URL}/manageContent.php`, {
                method: 'POST', credentials: 'include',
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                body: new URLSearchParams({ action: 'save', interview_name: currentManagingInterview, questions: JSON.stringify(qList) })
            });
            document.getElementById('content-status-msg').textContent = "Lưu xong!"; setTimeout(()=>{modal.style.display='none';}, 1000);
        });
    }
})();

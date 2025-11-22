// interviewer.js - PHIÊN BẢN ỔN ĐỊNH CAO
(async function() {
    
    // (!!!) CẤU HÌNH ĐƯỜNG DẪN NGROK (!!!)
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev';
    
    let currentManagingInterview = '';

    // ===============================================================
    // 1. KHỞI TẠO & KIỂM TRA ĐĂNG NHẬP
    // ===============================================================
    try {
        const response = await fetch(`${NGROK_BASE_URL}/interviewer.php`, { 
            method: 'GET', 
            credentials: 'include', 
            headers: { 'ngrok-skip-browser-warning': 'true' } 
        });
        const data = await response.json();

        if (data.success === true) {
            // Hiển thị thông tin cơ bản
            updateProfileUI(data);
            
            // KHỞI CHẠY TOÀN BỘ CÁC CHỨC NĂNG
            // (Tách rời nhau để lỗi cái này không chết cái kia)
            initLogout();
            initProfileLogic(data);
            initInterviewListLogic();      // Quản lý danh sách + Nút "Nội dung" trong list
            initCandidateModalLogic();     // Modal Ứng viên + Nút "Thêm ứng viên"
            initContentModalLogic();       // Modal Nội dung
            
        } else {
            console.warn("Chưa đăng nhập -> Chuyển hướng");
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Lỗi kết nối nghiêm trọng:", error);
        // Có thể comment dòng dưới để debug nếu cần
        window.location.href = 'login.html'; 
    }

    // Hàm cập nhật giao diện thông tin cá nhân
    function updateProfileUI(data) {
        const fullname = data.fullname || data.username;
        const dob = data.dob || 'Chưa cập nhật';
        
        // Header
        const displayEl = document.getElementById('username-display');
        if(displayEl) displayEl.textContent = fullname;

        // Sidebar
        const uEl = document.getElementById('info-username');
        const fEl = document.getElementById('info-fullname');
        const dEl = document.getElementById('info-dob');
        
        if(uEl) uEl.textContent = data.username;
        if(fEl) fEl.textContent = fullname;
        if(dEl) dEl.textContent = dob;
    }

    // ===============================================================
    // 2. LOGIC ĐĂNG XUẤT (ĐỔI TÀI KHOẢN)
    // ===============================================================
    function initLogout() {
        const btn = document.getElementById('logout-button');
        if (!btn) return;

        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.textContent = "Đang xử lý...";
            try {
                await fetch(`${NGROK_BASE_URL}/logout.php`, { 
                    method: 'GET', credentials: 'include', 
                    headers: {'ngrok-skip-browser-warning':'true'} 
                });
            } catch (e) { console.error(e); } 
            finally {
                window.location.href = 'login.html';
            }
        });
    }

    // ===============================================================
    // 3. LOGIC DANH SÁCH & CÁC NÚT TRONG DANH SÁCH
    // ===============================================================
    function initInterviewListLogic() {
        const listEl = document.getElementById('interview-list');
        const createForm = document.getElementById('create-interview-form');
        
        if (!listEl || !createForm) return;

        // --- HÀM TẢI DANH SÁCH ---
        async function loadInterviews() {
            listEl.innerHTML = '<p style="text-align:center">Đang tải...</p>';
            try {
                const res = await fetch(`${NGROK_BASE_URL}/listInterview.php`, { credentials: 'include', headers: {'ngrok-skip-browser-warning':'true'} });
                const data = await res.json();
                
                listEl.innerHTML = '';
                if (data.interviews && data.interviews.length > 0) {
                    data.interviews.forEach(item => {
                        const li = document.createElement('li');
                        li.className = 'interview-item';
                        
                        // Nút Toggle Mô tả
                        const hasDesc = item.description && item.description.trim() !== "";
                        const toggleBtnHtml = hasDesc 
                            ? `<button class="btn-small btn-gray toggle-desc-btn">▼ Mô tả</button>` : '';

                        li.innerHTML = `
                            <div class="interview-header">
                                <div class="interview-info">
                                    <span class="interview-name">${item.name}</span>
                                    <span class="interview-id">ID: ${item.id}</span>
                                </div>
                                <div class="action-btn-group">
                                    ${toggleBtnHtml}
                                    <button class="btn-small btn-blue open-interviewee-btn" data-id="${item.id}">Ứng viên</button>
                                    <button class="btn-small btn-green open-content-btn" data-id="${item.id}">Nội dung</button>
                                    <button class="btn-small btn-red delete-interview-btn" data-id="${item.id}">Xóa</button>
                                </div>
                            </div>
                            <div class="interview-desc-content" style="display:none;">${item.description}</div>
                        `;
                        listEl.appendChild(li);
                    });
                } else {
                    listEl.innerHTML = '<p style="text-align:center">Chưa có cuộc phỏng vấn nào.</p>';
                }
            } catch (e) {
                console.error(e);
                listEl.innerHTML = '<p style="color:red; text-align:center">Lỗi tải dữ liệu.</p>';
            }
        }

        // --- SỰ KIỆN CLICK TRONG DANH SÁCH (Event Delegation) ---
        // Dùng .closest('button') để đảm bảo bấm vào icon/text bên trong nút vẫn nhận
        listEl.addEventListener('click', (e) => {
            const btn = e.target.closest('button'); 
            if (!btn) return;

            // 1. Toggle Mô tả
            if (btn.classList.contains('toggle-desc-btn')) {
                const contentDiv = btn.closest('.interview-item').querySelector('.interview-desc-content');
                if (contentDiv.style.display === 'none') {
                    contentDiv.style.display = 'block';
                    btn.textContent = '▲ Thu gọn';
                } else {
                    contentDiv.style.display = 'none';
                    btn.textContent = '▼ Mô tả';
                }
            }
            
            const id = btn.dataset.id;
            if (!id) return;

            // 2. Mở Modal Ứng viên
            if (btn.classList.contains('open-interviewee-btn')) {
                window.openCandidateModal(id); // Gọi hàm global
            }
            // 3. Mở Modal Nội dung
            else if (btn.classList.contains('open-content-btn')) {
                window.openContentModal(id);   // Gọi hàm global
            }
            // 4. Xóa
            else if (btn.classList.contains('delete-interview-btn')) {
                if(confirm(`Xóa cuộc phỏng vấn ${id}?`)) {
                    fetch(`${NGROK_BASE_URL}/deleteInterview.php`, {
                        method: 'POST', credentials: 'include',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                        body: new URLSearchParams({ 'interview_name': id })
                    }).then(() => loadInterviews());
                }
            }
        });

        // --- XỬ LÝ FORM TẠO MỚI ---
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('interview-fullname').value;
            const count = document.getElementById('question-count').value;
            const desc = document.getElementById('interview-desc').value;
            const msg = document.getElementById('create-status-msg');
            const submitBtn = createForm.querySelector('button[type="submit"]');

            submitBtn.disabled = true; msg.textContent = "Đang tạo...";

            try {
                await fetch(`${NGROK_BASE_URL}/createInterview.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ 'full_name': fullName, 'question_count': count, 'description': desc })
                });
                msg.textContent = "Thành công!";
                document.getElementById('interview-fullname').value = '';
                document.getElementById('interview-desc').value = '';
                loadInterviews();
            } catch(e) { msg.textContent = "Lỗi tạo mới."; }
            finally { submitBtn.disabled = false; setTimeout(()=>msg.textContent='', 2000); }
        });

        // Chạy lần đầu
        loadInterviews();
    }

    // ===============================================================
    // 4. LOGIC MODAL ỨNG VIÊN (CANDIDATE)
    // ===============================================================
    function initCandidateModalLogic() {
        const modal = document.getElementById('interviewee-modal');
        const closeBtn = document.getElementById('modal-close-btn');
        const addBtn = document.getElementById('modal-add-interviewee-btn');
        const tbody = document.getElementById('interviewee-list-body');
        const statusMsg = document.getElementById('modal-status-msg');

        if(!modal) return;

        // Hàm mở modal (Gán vào window để nơi khác gọi được)
        window.openCandidateModal = (interviewId) => {
            currentManagingInterview = interviewId;
            document.getElementById('modal-title').textContent = `Quản lý Ứng viên: ${interviewId}`;
            modal.style.display = 'flex';
            loadCandidates();
        };

        // Đóng modal
        closeBtn.onclick = () => modal.style.display = 'none';

        // Tải danh sách
        async function loadCandidates() {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Đang tải...</td></tr>';
            try {
                const res = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ action: 'list', interview_name: currentManagingInterview })
                });
                const data = await res.json();
                renderTable(data.interviewees || []);
            } catch(e) { tbody.innerHTML = '<tr><td colspan="5" style="color:red">Lỗi tải.</td></tr>'; }
        }

        // Render bảng
        function renderTable(list) {
            tbody.innerHTML = '';
            if(list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Chưa có ứng viên.</td></tr>';
                return;
            }
            list.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.username}</td>
                    <td>
                        <input type="text" class="edit-name-input" value="${user.fullname}" id="input-${user.username}">
                        <button class="btn-small btn-blue save-name-btn" data-user="${user.username}">Lưu</button>
                    </td>
                    <td>${user.joincode}</td>
                    <td>${user.status ? '<span style="color:green;font-weight:bold">Đã nộp</span>' : '<span style="color:gray">Chưa nộp</span>'}</td>
                    <td><button class="btn-small btn-red delete-user-btn" data-user="${user.username}">Xóa</button></td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Xử lý nút THÊM MỚI
        addBtn.addEventListener('click', async () => {
            statusMsg.textContent = "Đang xử lý...";
            addBtn.disabled = true;
            try {
                const res = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ action: 'add', interview_name: currentManagingInterview })
                });
                const data = await res.json();
                if(data.success) {
                    statusMsg.textContent = `Thêm thành công: ${data.newUser.username} (Mã: ${data.newUser.joincode})`;
                    loadCandidates();
                } else {
                    statusMsg.textContent = data.message;
                }
            } catch(e) { statusMsg.textContent = "Lỗi kết nối."; }
            finally { addBtn.disabled = false; }
        });

        // Xử lý nút LƯU TÊN và XÓA trong bảng (Event Delegation)
        tbody.addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            if(!btn) return;
            
            const user = btn.dataset.user;
            
            if (btn.classList.contains('save-name-btn')) {
                const newName = document.getElementById(`input-${user}`).value;
                btn.textContent = '...';
                await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ action: 'update', interview_name: currentManagingInterview, username_to_update: user, fullname: newName })
                });
                btn.textContent = 'Lưu';
                alert('Đã cập nhật tên!');
            } 
            else if (btn.classList.contains('delete-user-btn')) {
                if(confirm(`Xóa ứng viên ${user}?`)) {
                    await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                        method: 'POST', credentials: 'include',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                        body: new URLSearchParams({ action: 'delete', interview_name: currentManagingInterview, username_to_delete: user })
                    });
                    loadCandidates();
                }
            }
        });
    }

    // ===============================================================
    // 5. LOGIC MODAL NỘI DUNG (CONTENT)
    // ===============================================================
    function initContentModalLogic() {
        const modal = document.getElementById('content-modal');
        const closeBtn = document.getElementById('content-close-btn');
        const form = document.getElementById('content-form');
        const container = document.getElementById('questions-container');
        const loading = document.getElementById('content-loading');
        const msg = document.getElementById('content-status-msg');

        if(!modal) return;

        window.openContentModal = async (interviewId) => {
            currentManagingInterview = interviewId;
            modal.style.display = 'flex';
            form.style.display = 'none';
            loading.style.display = 'block';
            msg.textContent = '';

            try {
                const res = await fetch(`${NGROK_BASE_URL}/manageContent.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ action: 'load', interview_name: interviewId })
                });
                const json = await res.json();
                
                loading.style.display = 'none';
                if (json.success) {
                    form.style.display = 'block';
                    container.innerHTML = '';
                    json.data.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'question-block';
                        div.innerHTML = `
                            <h4>Câu hỏi ${item.id}</h4>
                            <label>Câu hỏi:</label>
                            <textarea class="q-text" data-id="${item.id}">${item.question}</textarea>
                            <label>Tiêu chí chấm:</label>
                            <textarea class="c-text" data-id="${item.id}">${item.criteria}</textarea>
                        `;
                        container.appendChild(div);
                    });
                }
            } catch(e) { 
                loading.textContent = "Lỗi tải nội dung."; 
            }
        };

        closeBtn.onclick = () => modal.style.display = 'none';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            msg.style.color = 'blue'; msg.textContent = 'Đang lưu...';
            
            const qList = [];
            document.querySelectorAll('.q-text').forEach(el => {
                const id = el.dataset.id;
                const criteria = document.querySelector(`.c-text[data-id="${id}"]`).value;
                qList.push({ id: id, question: el.value, criteria: criteria });
            });

            try {
                await fetch(`${NGROK_BASE_URL}/manageContent.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ action: 'save', interview_name: currentManagingInterview, questions: JSON.stringify(qList) })
                });
                msg.style.color = 'green'; msg.textContent = 'Lưu thành công!';
                setTimeout(() => { modal.style.display = 'none'; }, 1000);
            } catch(e) { 
                msg.style.color = 'red'; msg.textContent = 'Lỗi lưu dữ liệu.'; 
            }
        });
    }

    // ===============================================================
    // 6. LOGIC PROFILE (GIỮ NGUYÊN)
    // ===============================================================
    function initProfileLogic(data) {
        const sidebar = document.getElementById('sidebar-profile');
        const editBtn = document.getElementById('edit-profile-btn');
        const cancelBtn = document.getElementById('cancel-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');
        
        if(!sidebar) return;

        editBtn.onclick = () => sidebar.classList.add('is-editing');
        cancelBtn.onclick = () => sidebar.classList.remove('is-editing');
        
        saveBtn.onclick = async () => {
            const newFullname = document.getElementById('edit-fullname').value;
            const newDob = document.getElementById('edit-dob').value;
            saveBtn.disabled = true; 
            try {
                await fetch(`${NGROK_BASE_URL}/editInterviewerInfo.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ 'fullname': newFullname, 'dob': newDob })
                });
                document.getElementById('info-fullname').textContent = newFullname;
                document.getElementById('info-dob').textContent = newDob;
                document.getElementById('username-display').textContent = newFullname;
                sidebar.classList.remove('is-editing');
            } catch(e) { alert("Lỗi lưu thông tin"); }
            finally { saveBtn.disabled = false; }
        };
    }

})();

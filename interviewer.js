(async function() {
    
    // (!!!) CẤU HÌNH ĐƯỜNG DẪN SERVER (!!!)
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev';
    
    let currentManagingInterview = ''; // ID cuộc phỏng vấn đang chọn

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
            // Cập nhật giao diện Profile ngay khi vào
            updateProfileUI(data);
            
            // KHỞI CHẠY TOÀN BỘ CÁC CHỨC NĂNG
            initLogout();
            initProfileLogic(data);        
            initInterviewListLogic();      
            initCandidateModalLogic();     
            initContentModalLogic();       
            initGradingModalLogic();       
            
        } else {
            console.warn("Chưa đăng nhập -> Chuyển hướng");
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Lỗi kết nối nghiêm trọng:", error);
        window.location.href = 'login.html'; 
    }

    // Hàm cập nhật giao diện thông tin cá nhân
    function updateProfileUI(data) {
        const fullname = data.fullname || data.username;
        const dob = data.dob || 'Chưa cập nhật';
        
        // Header (Lời chào)
        const displayEl = document.getElementById('username-display');
        if(displayEl) displayEl.textContent = fullname;

        // Sidebar Inputs/Spans
        const uEl = document.getElementById('info-username');
        const fEl = document.getElementById('info-fullname');
        const dEl = document.getElementById('info-dob');
        
        if(uEl) uEl.textContent = data.username;
        if(fEl) fEl.textContent = fullname;
        if(dEl) dEl.textContent = dob; 
    }

    // ===============================================================
    // 2. LOGIC ĐỔI TÀI KHOẢN (ĐĂNG XUẤT)
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
    // 3. LOGIC PROFILE (CHỈ SỬA TÊN)
    // ===============================================================
    function initProfileLogic(data) {
        const sidebar = document.getElementById('sidebar-profile');
        const editBtn = document.getElementById('edit-profile-btn');
        const cancelBtn = document.getElementById('cancel-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');
        const editFullnameInput = document.getElementById('edit-fullname');
        
        if(!sidebar) return;

        // Khi bấm Sửa
        editBtn.onclick = () => {
            const currentName = document.getElementById('info-fullname').textContent;
            editFullnameInput.value = (currentName === 'Chưa cập nhật') ? '' : currentName;
            sidebar.classList.add('is-editing');
        };

        cancelBtn.onclick = () => sidebar.classList.remove('is-editing');
        
        saveBtn.onclick = async () => {
            const newFullname = editFullnameInput.value;
            
            if(!newFullname.trim()) {
                alert("Tên không được để trống");
                return;
            }

            saveBtn.disabled = true; 
            saveBtn.textContent = "Đang lưu...";

            try {
                await fetch(`${NGROK_BASE_URL}/editInterviewerInfo.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ 'fullname': newFullname })
                });

                document.getElementById('info-fullname').textContent = newFullname;
                document.getElementById('username-display').textContent = newFullname;
                
                sidebar.classList.remove('is-editing');
            } catch(e) { 
                alert("Lỗi lưu thông tin"); 
            } finally { 
                saveBtn.disabled = false; 
                saveBtn.textContent = "Lưu tên";
            }
        };
    }

    // ===============================================================
    // 4. LOGIC DANH SÁCH PHỎNG VẤN & TẠO MỚI
    // ===============================================================
    function initInterviewListLogic() {
        const listEl = document.getElementById('interview-list');
        const createForm = document.getElementById('create-interview-form');
        
        if (!listEl || !createForm) return;

        // --- HÀM TẢI DANH SÁCH ---
        async function loadInterviews() {
            listEl.innerHTML = '<p style="text-align:center">Đang tải dữ liệu...</p>';
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

        // --- SỰ KIỆN CLICK TRONG DANH SÁCH ---
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
                return; 
            }
            
            const id = btn.dataset.id;
            if (!id) return;

            // 2. Các nút chức năng
            if (btn.classList.contains('open-interviewee-btn')) {
                window.openCandidateModal(id);
            }
            else if (btn.classList.contains('open-content-btn')) {
                window.openContentModal(id);
            }
            else if (btn.classList.contains('delete-interview-btn')) {
                if(confirm(`Bạn có chắc muốn xóa cuộc phỏng vấn ID: ${id}?`)) {
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

            submitBtn.disabled = true; msg.textContent = "Đang khởi tạo...";

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
            } catch(e) { msg.textContent = "Lỗi khi tạo mới."; }
            finally { submitBtn.disabled = false; setTimeout(()=>msg.textContent='', 3000); }
        });

        loadInterviews();
    }

    // ===============================================================
    // 5. LOGIC MODAL ỨNG VIÊN (CÓ ĐIỂM FINAL)
    // ===============================================================
    function initCandidateModalLogic() {
        const modal = document.getElementById('interviewee-modal');
        const closeBtn = document.getElementById('modal-close-btn');
        const addBtn = document.getElementById('modal-add-interviewee-btn');
        const tbody = document.getElementById('interviewee-list-body');
        const statusMsg = document.getElementById('modal-status-msg');

        if(!modal) return;

        // Hàm mở modal (Global)
        window.openCandidateModal = (interviewId) => {
            currentManagingInterview = interviewId;
            document.getElementById('modal-title').textContent = `Ứng viên: ${interviewId}`;
            modal.style.display = 'flex';
            loadCandidates();
        };

        closeBtn.onclick = () => modal.style.display = 'none';

        async function loadCandidates() {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Đang tải...</td></tr>';
            try {
                const res = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ action: 'list', interview_name: currentManagingInterview })
                });
                const data = await res.json();
                renderTable(data.interviewees || []);
            } catch(e) { tbody.innerHTML = '<tr><td colspan="6" style="color:red">Lỗi tải dữ liệu.</td></tr>'; }
        }

        function renderTable(list) {
            tbody.innerHTML = '';
            if(list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chưa có ứng viên nào.</td></tr>';
                return;
            }
            list.forEach(user => {
                const tr = document.createElement('tr');
                
                let statusHtml = '<span style="color:gray">Chưa thi</span>';
                let actionHtml = ''; // Nút Xem/Chấm điểm
                
                if (user.status) { 
                    statusHtml = '<span style="color:green;font-weight:bold">Đã nộp</span>';
                    // Nút mở Modal Chấm điểm
                    actionHtml = `<button class="btn-small btn-green view-res-btn" data-user="${user.username}" style="margin-right:5px;">📝 Chi tiết điểm</button>`;
                } else {
                    actionHtml = `<button class="btn-small btn-gray" disabled style="margin-right:5px; opacity:0.5;">Chưa có bài</button>`;
                }

                tr.innerHTML = `
                    <td>${user.username}</td>
                    <td>
                        <div style="display:flex; gap:5px;">
                            <input type="text" class="edit-name-input" value="${user.fullname}" id="input-${user.username}">
                            <button class="btn-small btn-blue save-name-btn" data-user="${user.username}">Lưu</button>
                        </div>
                    </td>
                    <td>${user.joincode}</td>
                    <td style="font-weight:bold; color:#d63384;">${user.final_score || 0}</td>
                    <td>${statusHtml}</td>
                    <td>
                        ${actionHtml}
                        <button class="btn-small btn-red delete-user-btn" data-user="${user.username}">Xóa</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Xử lý thêm mới
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

        // Xử lý click trong bảng
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
                btn.textContent = 'Lưu'; alert('Đã cập nhật tên!');
            } 
            else if (btn.classList.contains('delete-user-btn')) {
                if(confirm(`Xóa ứng viên ${user} và toàn bộ kết quả?`)) {
                    await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                        method: 'POST', credentials: 'include',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                        body: new URLSearchParams({ action: 'delete', interview_name: currentManagingInterview, username_to_delete: user })
                    });
                    loadCandidates();
                }
            }
            else if (btn.classList.contains('view-res-btn')) {
                // MỞ MODAL CHẤM ĐIỂM
                window.openGradingModal(currentManagingInterview, user);
            }
        });
    }

    // ===============================================================
    // 6. LOGIC MODAL NỘI DUNG (CÓ THỜI GIAN)
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
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                <h4 style="margin:0;">Câu hỏi ${item.id}</h4>
                                <div style="display:flex; align-items:center; gap:5px;">
                                    <label style="margin:0;">Thời gian (giây):</label>
                                    <input type="number" class="time-limit-input" data-id="${item.id}" value="${item.timeLimit || 60}" style="width:60px; padding:5px;">
                                </div>
                            </div>
                            <label>Nội dung câu hỏi:</label>
                            <textarea class="q-text" data-id="${item.id}">${item.question}</textarea>
                            <label>Tiêu chí chấm:</label>
                            <textarea class="c-text" data-id="${item.id}">${item.criteria}</textarea>
                        `;
                        container.appendChild(div);
                    });
                }
            } catch(e) { loading.textContent = "Lỗi tải nội dung."; }
        };

        closeBtn.onclick = () => modal.style.display = 'none';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            msg.style.color = 'blue'; msg.textContent = 'Đang lưu...';
            
            const qList = [];
            document.querySelectorAll('.q-text').forEach(el => {
                const id = el.dataset.id;
                const criteria = document.querySelector(`.c-text[data-id="${id}"]`).value;
                const time = document.querySelector(`.time-limit-input[data-id="${id}"]`).value;
                qList.push({ id: id, question: el.value, criteria: criteria, timeLimit: time });
            });

            try {
                await fetch(`${NGROK_BASE_URL}/manageContent.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ action: 'save', interview_name: currentManagingInterview, questions: JSON.stringify(qList) })
                });
                msg.style.color = 'green'; msg.textContent = 'Lưu thành công!';
                setTimeout(() => { modal.style.display = 'none'; }, 1000);
            } catch(e) { msg.style.color = 'red'; msg.textContent = 'Lỗi lưu dữ liệu.'; }
        });
    }

    // ===============================================================
    // 7. LOGIC MODAL CHẤM ĐIỂM (CẬP NHẬT ĐẦY ĐỦ)
    // ===============================================================
    function initGradingModalLogic() {
        const modal = document.getElementById('grading-modal');
        const listEl = document.getElementById('grading-list');
        const vid = document.getElementById('video-container');
        
        const scoreIn = document.getElementById('detail-score');
        const reasonIn = document.getElementById('detail-reason');
        const saveBtn = document.getElementById('save-score-btn');
        const finalScoreEl = document.getElementById('grading-final-score');
        
        let curCand = '', activeQ = null;

        window.openGradingModal = async (intId, u) => {
            currentManagingInterview = intId; curCand = u;
            modal.style.display = 'flex';
            document.getElementById('grading-title').textContent = `Chấm điểm: ${u}`;
            
            reasonIn.value = ''; scoreIn.value = '';
            
            const res = await fetch(`${NGROK_BASE_URL}/manageGrading.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'load','interview_name':intId,'candidate_user':u}) });
            const json = await res.json();
            
            // HIỂN THỊ ĐIỂM TỔNG KẾT (FINAL)
            if(finalScoreEl) finalScoreEl.textContent = `TB: ${json.final_score || 0}`;

            listEl.innerHTML = '';
            if(json.data) {
                json.data.forEach(q => {
                    const d = document.createElement('div'); d.className='grading-question-item';
                    d.dataset.id = q.id;
                    // HIỂN THỊ ĐIỂM THÀNH PHẦN TRONG DANH SÁCH
                    d.innerHTML = `<h4>Câu ${q.id}</h4><span>Điểm: <strong>${q.score}</strong></span>`;
                    d.onclick = () => showDetail(q);
                    listEl.appendChild(d);
                });
                if(json.data.length > 0) showDetail(json.data[0]);
            }
        };
        
        // ĐÓNG MODAL -> RELOAD DANH SÁCH ỨNG VIÊN (Để cập nhật điểm Final ra ngoài)
        document.getElementById('grading-close-btn').onclick = () => { 
            modal.style.display='none'; 
            window.openCandidateModal(currentManagingInterview); 
        };

        function showDetail(q) {
            activeQ = q.id;
            document.getElementById('detail-q-text').textContent = q.question;
            scoreIn.value = q.score;
            reasonIn.value = ''; 
            
            document.getElementById('detail-history').textContent = q.history || '(Chưa có lịch sử)';
            
            vid.innerHTML = q.youtube_id 
                ? `<iframe src="https://www.youtube.com/embed/${q.youtube_id}" allowfullscreen></iframe>` 
                : '<span style="color:#ccc; text-align:center;">Chưa có video.<br>Ứng viên chưa nộp bài hoặc lỗi file.</span>';
            
            // Highlight câu hỏi đang chọn
            document.querySelectorAll('.grading-question-item').forEach(el => el.classList.remove('active'));
            document.querySelector(`.grading-question-item[data-id="${q.id}"]`)?.classList.add('active');
        }

        saveBtn.onclick = async () => {
            const valScore = scoreIn.value;
            const valReason = reasonIn.value.trim();

            if (!valReason) {
                alert("Vui lòng nhập lý do thay đổi điểm! (Bắt buộc)");
                reasonIn.focus();
                return;
            }

            saveBtn.textContent = 'Đang lưu...'; saveBtn.disabled = true;
            
            try {
                const res = await fetch(`${NGROK_BASE_URL}/manageGrading.php`, {
                    method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'},
                    body:new URLSearchParams({
                        'action':'update_score',
                        'interview_name':currentManagingInterview,
                        'candidate_user':curCand,
                        'question_id':activeQ,
                        'score':valScore,
                        'reason':valReason
                    })
                });
                const json = await res.json();
                
                if(json.success) {
                    alert('Đã lưu điểm thành công!');
                    // RELOAD LẠI MODAL CHẤM ĐIỂM (Để cập nhật lại Điểm TB trên Header và List bên trái)
                    window.openGradingModal(currentManagingInterview, curCand);
                } else {
                    alert(json.message);
                }
            } catch(e) { alert("Lỗi hệ thống"); }
            finally { saveBtn.textContent = 'Lưu'; saveBtn.disabled = false; }
        };
    }
})();

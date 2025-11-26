(async function() {
    
    // (!!!) CẤU HÌNH ĐƯỜNG DẪN SERVER (!!!)
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev';
    
    let currentManagingInterview = ''; 

    // ===============================================================
    // 1. KHỞI TẠO & KIỂM TRA ĐĂNG NHẬP
    // ===============================================================
    try {
        const response = await fetch(`${NGROK_BASE_URL}/interviewer.php`, { 
            method: 'GET', credentials: 'include', 
            headers: { 'ngrok-skip-browser-warning': 'true' } 
        });
        const data = await response.json();

        if (data.success === true) {
            updateProfileUI(data);
            initLogout();
            initProfileLogic(data);        
            initInterviewListLogic();      
            initCandidateModalLogic();     
            initContentModalLogic();       
            initGradingModalLogic();       
        } else {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        window.location.href = 'login.html'; 
    }

    function updateProfileUI(data) {
        const fullname = data.fullname || data.username;
        const displayEl = document.getElementById('username-display');
        const uEl = document.getElementById('info-username');
        const fEl = document.getElementById('info-fullname');
        
        if(displayEl) displayEl.textContent = fullname;
        if(uEl) uEl.textContent = data.username;
        if(fEl) fEl.textContent = fullname;
    }

    // ===============================================================
    // 2. LOGIC ĐĂNG XUẤT (FIX LỖI LIỆT NÚT)
    // ===============================================================
    function initLogout() {
        const btn = document.getElementById('logout-button');
        if (btn) {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Thoát...';
                btn.style.opacity = '0.7';
                btn.style.cursor = 'wait';

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2000);

                    await fetch(`${NGROK_BASE_URL}/logout.php`, { 
                        method: 'GET', credentials: 'include', 
                        headers: {'ngrok-skip-browser-warning':'true'},
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                } catch (err) { console.warn("Logout error:", err); } 
                finally {
                    window.location.href = 'login.html';
                }
            });
        }
    }

    // ===============================================================
    // 3. LOGIC CHỈNH SỬA PROFILE (ĐÃ FIX)
    // ===============================================================
    function initProfileLogic(data) {
        const editBtn = document.getElementById('edit-profile-btn');
        const cancelBtn = document.getElementById('cancel-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');
        const displaySpan = document.getElementById('info-fullname');
        const inputField = document.getElementById('edit-fullname');
        const controlsDiv = document.getElementById('edit-controls'); 
        
        if(!editBtn || !inputField) return;

        editBtn.onclick = () => {
            inputField.value = displaySpan.textContent.trim();
            displaySpan.style.display = 'none';
            inputField.style.display = 'block';
            controlsDiv.style.display = 'flex'; 
            controlsDiv.style.gap = '10px';
            inputField.focus();
        };

        cancelBtn.onclick = () => {
            displaySpan.style.display = 'block';
            inputField.style.display = 'none';
            controlsDiv.style.display = 'none';
        };
        
        saveBtn.onclick = async () => {
            const newName = inputField.value.trim();
            if(!newName) { alert("Vui lòng nhập tên!"); return; }
            saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Lưu...';

            try {
                await fetch(`${NGROK_BASE_URL}/editInterviewerInfo.php`, { 
                    method: 'POST', credentials: 'include', 
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, 
                    body: new URLSearchParams({ 'fullname': newName }) 
                });
                displaySpan.textContent = newName;
                document.getElementById('username-display').textContent = newName;
                cancelBtn.click(); 
            } catch(e) { alert('Lỗi lưu tên.'); } 
            finally { saveBtn.disabled = false; saveBtn.innerHTML = 'Lưu lại'; }
        };
    }

    // ===============================================================
    // 4. LOGIC DANH SÁCH PHỎNG VẤN
    // ===============================================================
    function initInterviewListLogic() {
        const listEl = document.getElementById('interview-list');
        const createForm = document.getElementById('create-interview-form');
        
        async function loadInterviews() {
            try {
                const res = await fetch(`${NGROK_BASE_URL}/listInterview.php`, { credentials: 'include', headers: {'ngrok-skip-browser-warning':'true'} });
                const data = await res.json();
                listEl.innerHTML = '';
                if (data.interviews && data.interviews.length > 0) {
                    data.interviews.forEach(item => {
                        const li = document.createElement('li');
                        li.className = 'interview-item';
                        const hasDesc = item.description && item.description.trim() !== "";
                        const toggleBtnHtml = hasDesc ? `<button class="btn-small btn-gray toggle-desc-btn">▼ Mô tả</button>` : '';

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
                } else { listEl.innerHTML = '<p style="text-align:center; color:#666;">Chưa có đợt phỏng vấn nào.</p>'; }
            } catch (e) { listEl.innerHTML = '<p style="color:red; text-align:center">Lỗi tải dữ liệu.</p>'; }
        }

        listEl.addEventListener('click', (e) => {
            const btn = e.target.closest('button'); if (!btn) return;
            if (btn.classList.contains('toggle-desc-btn')) {
                const div = btn.closest('.interview-item').querySelector('.interview-desc-content');
                div.style.display = div.style.display === 'none' ? 'block' : 'none';
                return;
            }
            const id = btn.dataset.id;
            if (btn.classList.contains('open-interviewee-btn')) window.openCandidateModal(id);
            else if (btn.classList.contains('open-content-btn')) window.openContentModal(id);
            else if (btn.classList.contains('delete-interview-btn')) {
                if(confirm('Bạn có chắc muốn xóa?')) fetch(`${NGROK_BASE_URL}/deleteInterview.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ 'interview_name': id }) }).then(() => loadInterviews());
            }
        });

        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = createForm.querySelector('button[type="submit"]');
            btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo...';
            try {
                await fetch(`${NGROK_BASE_URL}/createInterview.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ 'full_name': document.getElementById('interview-fullname').value, 'question_count': document.getElementById('question-count').value, 'description': document.getElementById('interview-desc').value }) });
                document.getElementById('interview-fullname').value = '';
                document.getElementById('interview-desc').value = '';
                loadInterviews();
            } catch(e) { alert('Lỗi tạo mới'); }
            finally { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Khởi tạo'; }
        });
        loadInterviews();
    }

    // ===============================================================
    // 5. LOGIC MODAL ỨNG VIÊN (ĐÃ FIX: THÊM INPUT SỬA TÊN)
    // ===============================================================
    function initCandidateModalLogic() {
        const modal = document.getElementById('interviewee-modal');
        const tbody = document.getElementById('interviewee-list-body');
        
        window.openCandidateModal = (id) => {
            currentManagingInterview = id;
            document.getElementById('modal-title').textContent = `Ứng viên: ${id}`;
            modal.style.display = 'flex';
            loadCandidates();
        };
        document.getElementById('modal-close-btn').onclick = () => modal.style.display = 'none';
        
        async function loadCandidates() {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Loading...</td></tr>';
            try {
                const res = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ action: 'list', interview_name: currentManagingInterview }) });
                const data = await res.json();
                renderTable(data.interviewees || []);
            } catch (e) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red">Lỗi kết nối</td></tr>'; }
        }

        function renderTable(list) {
            tbody.innerHTML = '';
            if(list.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chưa có ứng viên nào.</td></tr>'; return; }
            list.forEach(user => {
                const tr = document.createElement('tr');
                let statusHtml = user.status ? '<span style="color:var(--success);font-weight:bold">Đã nộp</span>' : '<span style="color:gray">Chưa thi</span>';
                let actionHtml = user.status ? `<button class="btn-small btn-green view-res-btn" data-user="${user.username}" style="margin-right:5px;">📝 Chấm điểm</button>` : `<button class="btn-small btn-gray" disabled style="margin-right:5px; opacity:0.5;">Chờ nộp</button>`;
                
                // FIX: Thêm input sửa tên và nút lưu vào cột thứ 2
                tr.innerHTML = `
                    <td>${user.username}</td>
                    <td>
                        <div style="display:flex; gap:5px; align-items:center;">
                            <input type="text" class="form-input edit-name-input" value="${user.fullname}" id="input-${user.username}" style="padding:5px; width:150px;">
                            <button class="btn-small btn-blue save-name-btn" data-user="${user.username}" title="Lưu tên"><i class="fa-solid fa-save"></i></button>
                        </div>
                    </td>
                    <td>${user.joincode}</td>
                    <td style="font-weight:bold; color:#d63384;">${user.final_score||0}</td>
                    <td>${statusHtml}</td>
                    <td>${actionHtml}<button class="btn-small btn-red delete-user-btn" data-user="${user.username}">Xóa</button></td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        document.getElementById('modal-add-interviewee-btn').onclick = async () => {
             const btn = document.getElementById('modal-add-interviewee-btn');
             btn.disabled = true; btn.textContent = 'Đang thêm...';
             await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ action: 'add', interview_name: currentManagingInterview }) });
             btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Thêm ứng viên mới';
             loadCandidates();
        };

        tbody.addEventListener('click', async (e) => {
            const btn = e.target.closest('button'); if(!btn) return;
            const user = btn.dataset.user;
            
            // Logic Lưu tên ứng viên
            if (btn.classList.contains('save-name-btn')) {
                const newName = document.getElementById(`input-${user}`).value;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                    method: 'POST', credentials: 'include',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'},
                    body: new URLSearchParams({ action: 'update', interview_name: currentManagingInterview, username_to_update: user, fullname: newName })
                });
                btn.innerHTML = '<i class="fa-solid fa-check"></i>';
                setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-save"></i>'; }, 1000);
            }
            else if (btn.classList.contains('delete-user-btn')) {
                if(confirm(`Xóa ứng viên ${user}?`)) { await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ action: 'delete', interview_name: currentManagingInterview, username_to_delete: user }) }); loadCandidates(); }
            } else if (btn.classList.contains('view-res-btn')) {
                window.openGradingModal(currentManagingInterview, user);
            }
        });
    }

    // ===============================================================
    // 6. LOGIC MODAL NỘI DUNG (ĐÃ FIX: THÊM INPUT THỜI GIAN)
    // ===============================================================
    function initContentModalLogic() {
        const modal = document.getElementById('content-modal');
        const form = document.getElementById('content-form');
        const container = document.getElementById('questions-container');
        
        window.openContentModal = async (id) => {
            currentManagingInterview = id; modal.style.display = 'flex';
            const res = await fetch(`${NGROK_BASE_URL}/manageContent.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ action: 'load', interview_name: id }) });
            const json = await res.json();
            form.style.display = 'block'; container.innerHTML = '';
            
            if(json.success) json.data.forEach(item => {
                // FIX: Thêm input chỉnh thời gian vào header của mỗi câu hỏi
                container.innerHTML += `
                    <div class="question-block" style="margin-bottom:15px; padding:15px; background:#f9f9f9; border:1px solid #ddd; border-radius:5px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <h4 style="margin:0; color:var(--primary);">Câu ${item.id}</h4>
                            <div style="display:flex; align-items:center; gap:5px; font-size:0.9rem;">
                                <label style="margin:0; font-weight:bold;">Giới hạn (giây):</label>
                                <input type="number" class="form-input time-limit-input" data-id="${item.id}" value="${item.timeLimit || 60}" style="width:70px; padding:5px; margin:0;">
                            </div>
                        </div>
                        <label style="font-weight:bold;">Nội dung câu hỏi:</label>
                        <textarea class="q-text form-input" data-id="${item.id}">${item.question}</textarea>
                        <label style="font-weight:bold;">Tiêu chí chấm:</label>
                        <textarea class="c-text form-input" data-id="${item.id}">${item.criteria}</textarea>
                    </div>`;
            });
        };
        
        document.getElementById('content-close-btn').onclick = () => modal.style.display = 'none';
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]'); btn.textContent = 'Đang lưu...'; btn.disabled = true;
            const qList = []; 
            document.querySelectorAll('.q-text').forEach(el => {
                const id = el.dataset.id;
                // Lấy thời gian từ input vừa thêm
                const time = document.querySelector(`.time-limit-input[data-id="${id}"]`).value;
                qList.push({ 
                    id: id, 
                    question: el.value, 
                    criteria: document.querySelector(`.c-text[data-id="${id}"]`).value, 
                    timeLimit: time // Lưu thời gian
                });
            });
            
            await fetch(`${NGROK_BASE_URL}/manageContent.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ action: 'save', interview_name: currentManagingInterview, questions: JSON.stringify(qList) }) });
            btn.textContent = 'Lưu thay đổi'; btn.disabled = false;
            modal.style.display = 'none';
        });
    }

    // ===============================================================
    // 7. LOGIC MODAL CHẤM ĐIỂM (GIỮ NGUYÊN CLASS MỚI)
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
            
            const res = await fetch(`${NGROK_BASE_URL}/manageGrading.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'load','interview_name':intId,'candidate_user':u}) });
            const json = await res.json();
            
            if(finalScoreEl) finalScoreEl.textContent = `TB: ${json.final_score || 0}`;
            listEl.innerHTML = '';
            
            if(json.data) {
                json.data.forEach(q => {
                    const d = document.createElement('div');
                    d.className = 'grading-question-item'; 
                    d.dataset.id = q.id;
                    d.innerHTML = `<h4>Câu ${q.id}</h4><span>Điểm: <strong>${q.score}</strong></span>`;
                    d.onclick = () => showDetail(q);
                    listEl.appendChild(d);
                });
                if(json.data.length > 0) showDetail(json.data[0]);
            }
        };
        
        document.getElementById('grading-close-btn').onclick = () => { modal.style.display='none'; window.openCandidateModal(currentManagingInterview); };

        function showDetail(q) {
            activeQ = q.id;
            document.getElementById('detail-q-text').textContent = q.question;
            scoreIn.value = q.score;
            reasonIn.value = ''; 
            document.getElementById('detail-history').textContent = q.history || '(Chưa có lịch sử)';
            
            vid.innerHTML = q.youtube_id ? `<iframe src="https://www.youtube.com/embed/${q.youtube_id}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe>` : '<span style="color:#ccc;">Chưa có video.</span>';
            
            document.querySelectorAll('.grading-question-item').forEach(el => el.classList.remove('active'));
            document.querySelector(`.grading-question-item[data-id="${q.id}"]`)?.classList.add('active');
        }

        saveBtn.onclick = async () => {
            if (!reasonIn.value.trim()) { alert("Vui lòng nhập nhận xét/lý do!"); return; }
            saveBtn.textContent = 'Đang lưu...'; saveBtn.disabled = true;
            await fetch(`${NGROK_BASE_URL}/manageGrading.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'update_score', 'interview_name':currentManagingInterview, 'candidate_user':curCand, 'question_id':activeQ, 'score':scoreIn.value, 'reason':reasonIn.value}) });
            saveBtn.textContent = 'Lưu điểm'; saveBtn.disabled = false;
            window.openGradingModal(currentManagingInterview, curCand);
        };
    }
})();

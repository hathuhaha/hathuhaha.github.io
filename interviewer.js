// FILE: interviewer.js
// FIX: UI Bảng ứng viên, Trạng thái nộp bài và Thêm mới không cần reload

(async function() {
    
    // ===============================================================
    // (!!!) QUAN TRỌNG: CẬP NHẬT LINK NGROK TẠI ĐÂY (!!!)
    // ===============================================================
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev';
    
    let currentManagingInterview = ''; 

    // --- KHỞI TẠO ---
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
    }

    function updateProfileUI(data) {
        const fullname = data.fullname || data.username;
        const displayEl = document.getElementById('username-display');
        if(displayEl) displayEl.textContent = fullname;
        if(document.getElementById('info-username')) document.getElementById('info-username').textContent = data.username;
        if(document.getElementById('info-fullname')) document.getElementById('info-fullname').textContent = fullname;
    }

    function initLogout() {
        const btn = document.getElementById('logout-button');
        if (btn) btn.onclick = async (e) => {
            e.preventDefault();
            await fetch(`${NGROK_BASE_URL}/logout.php`, { method:'GET', credentials:'include', headers:{'ngrok-skip-browser-warning':'true'} });
            window.location.href = 'login.html';
        };
    }

    function initProfileLogic(data) {
        const editBtn = document.getElementById('edit-profile-btn');
        const cancelBtn = document.getElementById('cancel-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');
        const displaySpan = document.getElementById('info-fullname');
        const inputField = document.getElementById('edit-fullname');
        const controlsDiv = document.getElementById('edit-controls'); 
        
        if(!editBtn) return;

        editBtn.onclick = () => {
            inputField.value = displaySpan.textContent.trim();
            displaySpan.style.display = 'none'; inputField.style.display = 'block';
            controlsDiv.style.display = 'flex'; controlsDiv.style.gap = '10px'; inputField.focus();
        };
        cancelBtn.onclick = () => {
            displaySpan.style.display = 'block'; inputField.style.display = 'none'; controlsDiv.style.display = 'none';
        };
        saveBtn.onclick = async () => {
            const newName = inputField.value.trim();
            if(!newName) return alert("Vui lòng nhập tên!");
            saveBtn.disabled = true; 
            await fetch(`${NGROK_BASE_URL}/editInterviewerInfo.php`, { 
                method: 'POST', credentials: 'include', 
                headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, 
                body: new URLSearchParams({ 'fullname': newName }) 
            });
            displaySpan.textContent = newName; document.getElementById('username-display').textContent = newName;
            saveBtn.disabled = false; cancelBtn.click();
        };
    }

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
                        li.innerHTML = `
                            <div class="interview-header">
                                <div class="interview-info">
                                    <span class="interview-name">${item.name}</span>
                                    <span class="interview-id">ID: ${item.id}</span>
                                </div>
                                <div class="action-btn-group">
                                    <button class="btn-small btn-blue open-interviewee-btn" data-id="${item.id}">Ứng viên</button>
                                    <button class="btn-small btn-green open-content-btn" data-id="${item.id}">Nội dung</button>
                                    <button class="btn-small export-excel-btn" data-id="${item.id}" style="background-color:#217346; color:white; margin-left:5px;"><i class="fa-solid fa-file-excel"></i> Excel</button>
                                    <button class="btn-small btn-red delete-interview-btn" data-id="${item.id}">Xóa</button>
                                </div>
                            </div>`;
                        listEl.appendChild(li);
                    });
                } else { listEl.innerHTML = '<p style="text-align:center">Chưa có dữ liệu.</p>'; }
            } catch(e) {}
         }
         
         listEl.addEventListener('click', (e) => {
            const btn = e.target.closest('button'); if (!btn) return;
            const id = btn.dataset.id;
            if (btn.classList.contains('open-interviewee-btn')) window.openCandidateModal(id);
            else if (btn.classList.contains('open-content-btn')) window.openContentModal(id);
            else if (btn.classList.contains('export-excel-btn')) handleExportExcel(id, btn);
            else if (btn.classList.contains('delete-interview-btn')) {
                if(confirm('Bạn có chắc muốn xóa?')) fetch(`${NGROK_BASE_URL}/deleteInterview.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ 'interview_name': id }) }).then(() => loadInterviews());
            }
         });
         
         createForm.addEventListener('submit', async (e) => {
             e.preventDefault();
             await fetch(`${NGROK_BASE_URL}/createInterview.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ 'full_name': document.getElementById('interview-fullname').value, 'question_count': document.getElementById('question-count').value, 'description': document.getElementById('interview-desc').value }) });
             document.getElementById('interview-fullname').value=''; document.getElementById('interview-desc').value='';
             loadInterviews();
         });
         loadInterviews();
    }
    
    async function handleExportExcel(interviewId, btn) {
        const oldHtml = btn.innerHTML; btn.innerHTML = '...'; btn.disabled = true;
        try {
            const res = await fetch(`${NGROK_BASE_URL}/api_export_excel.php?id=${interviewId}`, { credentials: 'include', headers: {'ngrok-skip-browser-warning':'true'} });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('KetQua');
            
            // Header
            sheet.getCell('B2').value = "BÁO CÁO KẾT QUẢ PHỎNG VẤN";
            sheet.getCell('B2').font = { size: 16, bold: true };
            sheet.getCell('B4').value = `Phỏng vấn: ${json.info.interview_name}`;
            
            // Table Header
            const headerRow = sheet.getRow(6);
            headerRow.values = ['STT', 'Tài khoản', 'Họ tên', 'Điểm TB', 'Chi tiết'];
            headerRow.font = { bold: true };
            
            // Data
            json.data.forEach((u, i) => {
                const row = sheet.addRow([i+1, u.account, u.name, u.final, u.scores.join(', ')]);
            });
            
            const buf = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buf]), `${interviewId}_Result.xlsx`);
        } catch(e) { alert(e.message); } 
        finally { btn.innerHTML = oldHtml; btn.disabled = false; }
    }

    // ===============================================================
    // MODAL ỨNG VIÊN (FIXED)
    // ===============================================================
    function initCandidateModalLogic() {
        const modal = document.getElementById('interviewee-modal');
        const tbody = document.getElementById('interviewee-list-body');
        const addBtn = document.getElementById('modal-add-interviewee-btn');
        
        window.openCandidateModal = (id) => {
            currentManagingInterview = id;
            document.getElementById('modal-title').textContent = `Quản lý Ứng viên: ${id}`;
            modal.style.display = 'flex';
            loadCandidates();
        };
        document.getElementById('modal-close-btn').onclick = () => modal.style.display = 'none';
        
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
            } catch (e) { tbody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center">Lỗi tải dữ liệu</td></tr>'; }
        }

        function renderTable(list) {
            tbody.innerHTML = '';
            if(list.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chưa có ứng viên.</td></tr>'; return; }
            
            list.forEach(user => {
                const tr = document.createElement('tr');
                
                // Logic Status
                let statusBadge = user.status 
                    ? `<span style="color:var(--success); font-weight:bold"><i class="fa-solid fa-check"></i> Đã nộp</span>`
                    : `<span style="color:#999"><i class="fa-regular fa-clock"></i> Chưa nộp</span>`;
                
                let gradeBtn = user.status
                    ? `<button class="btn-small btn-green view-res-btn" data-user="${user.username}">📝 Chấm điểm</button>`
                    : `<button class="btn-small btn-gray" disabled style="opacity:0.5; cursor:not-allowed">Chờ nộp</button>`;

                tr.innerHTML = `
                    <td><strong>${user.username}</strong></td>
                    <td>
                        <div style="display:flex;gap:5px;">
                            <input type="text" id="input-${user.username}" value="${user.fullname}" class="form-input" style="padding:5px;width:120px;">
                            <button class="btn-small btn-blue save-name-btn" data-user="${user.username}"><i class="fa-solid fa-save"></i></button>
                        </div>
                    </td>
                    <td style="font-family:monospace;color:#d63384;font-weight:bold">${user.joincode}</td>
                    <td>${user.final_score}</td>
                    <td>${statusBadge}</td>
                    <td>
                        ${gradeBtn}
                        <button class="btn-small btn-red delete-user-btn" data-user="${user.username}"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        // ADD USER
        addBtn.onclick = async () => {
             addBtn.disabled = true; addBtn.innerHTML = 'Đang tạo...';
             try {
                 const res = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, { 
                     method: 'POST', credentials: 'include', 
                     headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, 
                     body: new URLSearchParams({ action: 'add', interview_name: currentManagingInterview }) 
                 });
                 const json = await res.json();
                 if (json.success) {
                     loadCandidates(); // Reload table
                 } else { alert(json.message); }
             } catch(e) { alert("Lỗi kết nối"); }
             finally { addBtn.disabled = false; addBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Thêm ứng viên mới'; }
        };

        tbody.addEventListener('click', async (e) => {
            const btn = e.target.closest('button'); if(!btn) return;
            const user = btn.dataset.user;
            
            if (btn.classList.contains('save-name-btn')) {
                const newName = document.getElementById(`input-${user}`).value;
                await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ action: 'update', interview_name: currentManagingInterview, username_to_update: user, fullname: newName }) });
                alert("Đã lưu tên!");
            }
            else if (btn.classList.contains('delete-user-btn')) {
                if(confirm(`Xóa ${user}? Dữ liệu sẽ mất hết.`)) { 
                    await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ action: 'delete', interview_name: currentManagingInterview, username_to_delete: user }) }); 
                    loadCandidates(); 
                }
            } else if (btn.classList.contains('view-res-btn')) {
                window.openGradingModal(currentManagingInterview, user);
            }
        });
    }

    // MODAL CONTENT (Giữ nguyên)
    function initContentModalLogic() {
        const modal = document.getElementById('content-modal');
        const form = document.getElementById('content-form');
        const container = document.getElementById('questions-container');
        window.openContentModal = async (id) => {
            currentManagingInterview = id; modal.style.display = 'flex';
            const res = await fetch(`${NGROK_BASE_URL}/manageContent.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ action: 'load', interview_name: id }) });
            const json = await res.json();
            container.innerHTML = '';
            if(json.success) json.data.forEach(item => {
                container.innerHTML += `
                    <div style="margin-bottom:15px; padding:15px; background:#f9f9f9; border:1px solid #ddd; border-radius:5px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <h4 style="margin:0;">Câu ${item.id}</h4>
                            <div><label>Giới hạn (giây):</label> <input type="number" class="time-limit-input" data-id="${item.id}" value="${item.timeLimit||60}" style="width:60px;"></div>
                        </div>
                        <textarea class="q-text form-input" data-id="${item.id}" placeholder="Câu hỏi...">${item.question}</textarea>
                        <textarea class="c-text form-input" data-id="${item.id}" placeholder="Tiêu chí..." style="margin-top:5px;">${item.criteria}</textarea>
                    </div>`;
            });
        };
        document.getElementById('content-close-btn').onclick = () => modal.style.display = 'none';
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const qList = []; 
            document.querySelectorAll('.q-text').forEach(el => {
                const id = el.dataset.id;
                qList.push({ id: id, question: el.value, criteria: document.querySelector(`.c-text[data-id="${id}"]`).value, timeLimit: document.querySelector(`.time-limit-input[data-id="${id}"]`).value });
            });
            await fetch(`${NGROK_BASE_URL}/manageContent.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ action: 'save', interview_name: currentManagingInterview, questions: JSON.stringify(qList) }) });
            modal.style.display = 'none';
        });
    }

    // MODAL GRADING
    function initGradingModalLogic() {
        const modal = document.getElementById('grading-modal');
        const listEl = document.getElementById('grading-list');
        const scoreIn = document.getElementById('detail-score');
        const reasonIn = document.getElementById('detail-reason');
        const saveBtn = document.getElementById('save-score-btn');
        let curCand = '', activeQ = null;

        window.openGradingModal = async (intId, u) => {
            currentManagingInterview = intId; curCand = u; modal.style.display = 'flex';
            document.getElementById('grading-title').textContent = `Chấm điểm: ${u}`;
            const res = await fetch(`${NGROK_BASE_URL}/manageGrading.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'load','interview_name':intId,'candidate_user':u}) });
            const json = await res.json();
            document.getElementById('grading-final-score').textContent = `TB: ${json.final_score||0}`;
            listEl.innerHTML = '';
            if(json.data) {
                json.data.forEach(q => {
                    const d = document.createElement('div'); d.className = 'grading-question-item'; d.dataset.id = q.id;
                    d.innerHTML = `<h4>Câu ${q.id}</h4><span>Điểm: <strong>${q.score}</strong></span>`;
                    d.onclick = () => showDetail(q); listEl.appendChild(d);
                });
                if(json.data.length > 0) showDetail(json.data[0]);
            }
        };
        document.getElementById('grading-close-btn').onclick = () => { modal.style.display='none'; window.openCandidateModal(currentManagingInterview); };

        function showDetail(q) {
            activeQ = q.id;
            document.getElementById('detail-q-text').textContent = q.question;
            scoreIn.value = q.score; reasonIn.value = ''; 
            document.getElementById('detail-history').textContent = q.history || '(Trống)';
            const vid = document.getElementById('video-container');
            if (q.drive_id) {
                vid.innerHTML = `<iframe src="https://drive.google.com/file/d/${q.drive_id}/preview" width="100%" height="450px" style="border:none"></iframe>`;
            } else { vid.innerHTML = '<div style="padding:20px;text-align:center;color:#888">Chưa có video hoặc đang upload...</div>'; }
            document.querySelectorAll('.grading-question-item').forEach(el => el.classList.remove('active'));
            document.querySelector(`.grading-question-item[data-id="${q.id}"]`)?.classList.add('active');
        }

        saveBtn.onclick = async () => {
            if (!reasonIn.value.trim()) return alert("Nhập lý do!");
            saveBtn.disabled = true;
            await fetch(`${NGROK_BASE_URL}/manageGrading.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'update_score', 'interview_name':currentManagingInterview, 'candidate_user':curCand, 'question_id':activeQ, 'score':scoreIn.value, 'reason':reasonIn.value}) });
            saveBtn.disabled = false; window.openGradingModal(currentManagingInterview, curCand);
        };
    }
})();

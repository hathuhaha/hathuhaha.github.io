(async function() {
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev';
    let currentManagingInterview = '';

    // ... (Phần Init, Logout, Profile, InterviewListLogic GIỮ NGUYÊN như bản trước) ...
    // Để file không quá dài, tôi chỉ paste các hàm có thay đổi

    try {
        const response = await fetch(`${NGROK_BASE_URL}/interviewer.php`, { method: 'GET', credentials: 'include', headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await response.json();
        if (data.success === true) {
            updateProfileUI(data);
            initLogout();
            initProfileLogic(data);
            initInterviewListLogic();
            initCandidateModalLogic();
            initContentModalLogic();
            initGradingModalLogic(); 
        } else { window.location.href = 'login.html'; }
    } catch (e) { console.error(e); window.location.href = 'login.html'; }

    function updateProfileUI(data) { /* Giữ nguyên */ 
        const fullname = data.fullname || data.username;
        document.getElementById('username-display').textContent = fullname;
        document.getElementById('info-username').textContent = data.username;
        document.getElementById('info-fullname').textContent = fullname;
        document.getElementById('info-dob').textContent = data.dob || '...';
    }
    function initLogout() { /* Giữ nguyên */ 
        document.getElementById('logout-button').addEventListener('click', async () => {
            await fetch(`${NGROK_BASE_URL}/logout.php`, { method: 'GET', credentials: 'include', headers: {'ngrok-skip-browser-warning':'true'} });
            window.location.href = 'login.html';
        });
    }
    function initProfileLogic(data) { /* Giữ nguyên logic chỉ sửa tên */
        const sb = document.getElementById('sidebar-profile');
        document.getElementById('edit-profile-btn').onclick = () => { document.getElementById('edit-fullname').value = document.getElementById('info-fullname').textContent; sb.classList.add('is-editing'); };
        document.getElementById('cancel-profile-btn').onclick = () => sb.classList.remove('is-editing');
        document.getElementById('save-profile-btn').onclick = async () => {
            const name = document.getElementById('edit-fullname').value;
            await fetch(`${NGROK_BASE_URL}/editInterviewerInfo.php`, { method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true'}, body: new URLSearchParams({ 'fullname': name }) });
            document.getElementById('info-fullname').textContent = name; document.getElementById('username-display').textContent = name; sb.classList.remove('is-editing');
        };
    }
    function initInterviewListLogic() { /* Giữ nguyên */
        const listEl = document.getElementById('interview-list');
        async function load() {
            listEl.innerHTML = '<p style="text-align:center">Tải...</p>';
            const res = await fetch(`${NGROK_BASE_URL}/listInterview.php`, { credentials: 'include', headers: {'ngrok-skip-browser-warning':'true'} });
            const data = await res.json();
            listEl.innerHTML = '';
            if(data.interviews) {
                data.interviews.forEach(item => {
                    const li = document.createElement('li'); li.className = 'interview-item';
                    const hasDesc = item.description && item.description.trim() !== "";
                    li.innerHTML = `
                        <div class="interview-header">
                            <div class="interview-info"><span class="interview-name">${item.name}</span><span class="interview-id">ID: ${item.id}</span></div>
                            <div class="action-btn-group">
                                ${hasDesc ? '<button class="btn-small btn-gray toggle-desc">▼ Mô tả</button>' : ''}
                                <button class="btn-small btn-blue open-cand" data-id="${item.id}">Ứng viên</button>
                                <button class="btn-small btn-green open-cont" data-id="${item.id}">Nội dung</button>
                                <button class="btn-small btn-red del-int" data-id="${item.id}">Xóa</button>
                            </div>
                        </div>
                        <div class="interview-desc-content" style="display:none">${item.description}</div>`;
                    listEl.appendChild(li);
                });
            }
        }
        listEl.addEventListener('click', (e) => {
            const btn = e.target.closest('button'); if(!btn) return;
            const id = btn.dataset.id;
            if(btn.classList.contains('toggle-desc')) { const d = btn.closest('li').querySelector('.interview-desc-content'); d.style.display = d.style.display==='none'?'block':'none'; }
            else if(btn.classList.contains('open-cand')) window.openCandidateModal(id);
            else if(btn.classList.contains('open-cont')) window.openContentModal(id);
            else if(btn.classList.contains('del-int')) { if(confirm('Xóa?')) fetch(`${NGROK_BASE_URL}/deleteInterview.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'interview_name':id}) }).then(load); }
        });
        document.getElementById('create-interview-form').addEventListener('submit', async (e)=>{
            e.preventDefault();
            const name = document.getElementById('interview-fullname').value; const count = document.getElementById('question-count').value; const desc = document.getElementById('interview-desc').value;
            await fetch(`${NGROK_BASE_URL}/createInterview.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'full_name':name,'question_count':count,'description':desc}) });
            load();
        });
        load();
    }

    function initCandidateModalLogic() {
        const modal = document.getElementById('interviewee-modal');
        const tbody = document.getElementById('interviewee-list-body');
        window.openCandidateModal = (id) => { currentManagingInterview = id; document.getElementById('modal-title').textContent = `Ứng viên: ${id}`; modal.style.display = 'flex'; loadCand(); };
        document.getElementById('modal-close-btn').onclick = () => modal.style.display = 'none';
        async function loadCand() {
            tbody.innerHTML = '<tr><td colspan="6">Tải...</td></tr>';
            const res = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'list','interview_name':currentManagingInterview}) });
            const data = await res.json();
            tbody.innerHTML = '';
            data.interviewees.forEach(u => {
                const status = u.status ? '<span style="color:green;font-weight:bold">Đã nộp</span>' : 'Chưa nộp';
                const btn = u.status ? `<button class="btn-small btn-green view-res" data-u="${u.username}">Xem Bài</button>` : '';
                const tr = document.createElement('tr');
                // CẬP NHẬT: Thêm cột điểm TB
                tr.innerHTML = `<td>${u.username}</td>
                    <td><input class="edit-name-input" id="n-${u.username}" value="${u.fullname}"><button class="btn-small btn-blue save-n" data-u="${u.username}">Lưu</button></td>
                    <td>${u.joincode}</td>
                    <td style="font-weight:bold; color:#d63384;">${u.final_score}</td>
                    <td>${status}</td>
                    <td>${btn} <button class="btn-small btn-red del-u" data-u="${u.username}">Xóa</button></td>`;
                tbody.appendChild(tr);
            });
        }
        tbody.addEventListener('click', async (e)=>{
            const btn = e.target.closest('button'); if(!btn) return; const u = btn.dataset.u;
            if(btn.classList.contains('save-n')) { await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'update','interview_name':currentManagingInterview,'username_to_update':u,'fullname':document.getElementById(`n-${u}`).value}) }); alert('Đã lưu'); }
            else if(btn.classList.contains('del-u')) { if(confirm('Xóa?')) { await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'delete','interview_name':currentManagingInterview,'username_to_delete':u}) }); loadCand(); } }
            else if(btn.classList.contains('view-res')) { window.openGradingModal(currentManagingInterview, u); }
        });
        document.getElementById('modal-add-interviewee-btn').onclick = async () => {
            const res = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'add','interview_name':currentManagingInterview}) });
            const data = await res.json(); document.getElementById('modal-status-msg').textContent = `Mã: ${data.newUser.joincode}`; loadCand();
        };
    }

    function initContentModalLogic() { /* Giữ nguyên logic Lưu Nội dung + Thời gian */
        const modal = document.getElementById('content-modal'); const cont = document.getElementById('questions-container');
        window.openContentModal = async (id) => {
            currentManagingInterview = id; modal.style.display = 'flex';
            const res = await fetch(`${NGROK_BASE_URL}/manageContent.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'load','interview_name':id}) });
            const json = await res.json();
            cont.innerHTML = ''; document.getElementById('content-form').style.display='block'; document.getElementById('content-loading').style.display='none';
            json.data.forEach(q => {
                const d = document.createElement('div'); d.className='question-block';
                d.innerHTML = `<h4>Câu ${q.id} (Giây: <input class="tl-in" data-id="${q.id}" value="${q.timeLimit}" style="width:40px">)</h4><textarea class="q-in" data-id="${q.id}">${q.question}</textarea><textarea class="c-in" data-id="${q.id}">${q.criteria}</textarea>`;
                cont.appendChild(d);
            });
        };
        document.getElementById('content-close-btn').onclick = () => modal.style.display='none';
        document.getElementById('content-form').addEventListener('submit', async (e)=>{
            e.preventDefault(); const list = [];
            document.querySelectorAll('.q-in').forEach(el => { const id = el.dataset.id; list.push({ id: id, question: el.value, criteria: document.querySelector(`.c-in[data-id="${id}"]`).value, timeLimit: document.querySelector(`.tl-in[data-id="${id}"]`).value }); });
            await fetch(`${NGROK_BASE_URL}/manageContent.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'save','interview_name':currentManagingInterview,'questions':JSON.stringify(list)}) });
            alert('Lưu xong'); modal.style.display='none';
        });
    }

    function initGradingModalLogic() { /* Logic Chấm điểm và cập nhật danh sách cha khi đóng */
        const modal = document.getElementById('grading-modal'); const listEl = document.getElementById('grading-list'); const vid = document.getElementById('video-container');
        let curCand = '', activeQ = null;
        window.openGradingModal = async (intId, u) => {
            currentManagingInterview = intId; curCand = u; modal.style.display = 'flex';
            const res = await fetch(`${NGROK_BASE_URL}/manageGrading.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'load','interview_name':intId,'candidate_user':u}) });
            const json = await res.json(); listEl.innerHTML = '';
            json.data.forEach(q => { const d = document.createElement('div'); d.className='grading-question-item'; d.innerHTML = `<h4>Câu ${q.id}</h4><span>Điểm: ${q.score}</span>`; d.onclick = () => showDetail(q); listEl.appendChild(d); });
            if(json.data.length>0) showDetail(json.data[0]);
        };
        // Khi đóng modal chấm điểm, reload lại modal danh sách ứng viên để cập nhật điểm TB
        document.getElementById('grading-close-btn').onclick = () => { modal.style.display='none'; window.openCandidateModal(currentManagingInterview); };

        function showDetail(q) {
            activeQ = q.id; document.getElementById('detail-q-text').textContent = q.question; document.getElementById('detail-score').value = q.score; document.getElementById('detail-history').textContent = q.history;
            vid.innerHTML = q.youtube_id ? `<iframe src="https://www.youtube.com/embed/${q.youtube_id}" allowfullscreen></iframe>` : 'Chưa có video';
        }
        document.getElementById('save-score-btn').onclick = async () => {
            await fetch(`${NGROK_BASE_URL}/manageGrading.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'update_score','interview_name':currentManagingInterview,'candidate_user':curCand,'question_id':activeQ,'score':document.getElementById('detail-score').value,'reason':document.getElementById('detail-reason').value}) });
            alert('Lưu điểm thành công'); window.openGradingModal(currentManagingInterview, curCand);
        };
    }
})();

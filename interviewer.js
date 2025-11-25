(async function() {
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev';
    let currentManagingInterview = '';

    // ... (Phần Init, Logout, Profile, InterviewListLogic GIỮ NGUYÊN như bản trước) ...
    // Paste lại các hàm updateProfileUI, initLogout, initProfileLogic, initInterviewListLogic, initContentModalLogic từ bản trước vào đây.

    // ... (Chỉ paste code mới cho CandidateModalLogic và GradingModalLogic dưới đây) ...

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

    function updateProfileUI(d){ document.getElementById('username-display').textContent=d.fullname||d.username; document.getElementById('info-fullname').textContent=d.fullname||d.username; document.getElementById('info-username').textContent=d.username; document.getElementById('info-dob').textContent=d.dob; }
    function initLogout(){ document.getElementById('logout-button').onclick=async()=>{ await fetch(`${NGROK_BASE_URL}/logout.php`,{method:'GET',credentials:'include',headers:{'ngrok-skip-browser-warning':'true'}}); window.location.href='login.html'; }; }
    function initProfileLogic(d){ const sb=document.getElementById('sidebar-profile'); document.getElementById('edit-profile-btn').onclick=()=>{document.getElementById('edit-fullname').value=document.getElementById('info-fullname').textContent; sb.classList.add('is-editing');}; document.getElementById('cancel-profile-btn').onclick=()=>sb.classList.remove('is-editing'); document.getElementById('save-profile-btn').onclick=async()=>{ const n=document.getElementById('edit-fullname').value; await fetch(`${NGROK_BASE_URL}/editInterviewerInfo.php`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'},body:new URLSearchParams({'fullname':n})}); document.getElementById('info-fullname').textContent=n; document.getElementById('username-display').textContent=n; sb.classList.remove('is-editing'); }; }
    
    function initInterviewListLogic() {
        const listEl = document.getElementById('interview-list');
        async function load() {
            listEl.innerHTML='<p style="text-align:center">Tải...</p>';
            const res = await fetch(`${NGROK_BASE_URL}/listInterview.php`,{credentials:'include',headers:{'ngrok-skip-browser-warning':'true'}});
            const data = await res.json(); listEl.innerHTML='';
            if(data.interviews) data.interviews.forEach(i=>{
                const hasDesc = i.description && i.description.trim()!=="";
                const li=document.createElement('li'); li.className='interview-item';
                li.innerHTML=`<div class="interview-header"><div class="interview-info"><span class="interview-name">${i.name}</span><span class="interview-id">ID: ${i.id}</span></div>
                <div class="action-btn-group">${hasDesc?'<button class="btn-small btn-gray toggle-desc">▼ Mô tả</button>':''} <button class="btn-small btn-blue open-cand" data-id="${i.id}">Ứng viên</button> <button class="btn-small btn-green open-cont" data-id="${i.id}">Nội dung</button> <button class="btn-small btn-red del-int" data-id="${i.id}">Xóa</button></div></div><div class="interview-desc-content" style="display:none">${i.description}</div>`;
                listEl.appendChild(li);
            });
        }
        listEl.addEventListener('click',(e)=>{
            const btn=e.target.closest('button'); if(!btn)return; const id=btn.dataset.id;
            if(btn.classList.contains('toggle-desc')){const d=btn.closest('li').querySelector('.interview-desc-content'); d.style.display=d.style.display==='none'?'block':'none';}
            else if(btn.classList.contains('open-cand')) window.openCandidateModal(id);
            else if(btn.classList.contains('open-cont')) window.openContentModal(id);
            else if(btn.classList.contains('del-int')){if(confirm('Xóa?')) fetch(`${NGROK_BASE_URL}/deleteInterview.php`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'},body:new URLSearchParams({'interview_name':id})}).then(load);}
        });
        document.getElementById('create-interview-form').addEventListener('submit',async(e)=>{e.preventDefault(); await fetch(`${NGROK_BASE_URL}/createInterview.php`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'},body:new URLSearchParams({'full_name':document.getElementById('interview-fullname').value,'question_count':document.getElementById('question-count').value,'description':document.getElementById('interview-desc').value})}); load();});
        load();
    }

    function initContentModalLogic() {
        const m=document.getElementById('content-modal'); const c=document.getElementById('questions-container');
        window.openContentModal=async(id)=>{currentManagingInterview=id; m.style.display='flex'; const res=await fetch(`${NGROK_BASE_URL}/manageContent.php`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'},body:new URLSearchParams({'action':'load','interview_name':id})}); const j=await res.json(); c.innerHTML=''; document.getElementById('content-form').style.display='block'; document.getElementById('content-loading').style.display='none'; j.data.forEach(q=>{ const d=document.createElement('div'); d.className='question-block'; d.innerHTML=`<h4>Câu ${q.id} (Giây: <input class="tl-in" data-id="${q.id}" value="${q.timeLimit}" style="width:40px">)</h4><textarea class="q-in" data-id="${q.id}">${q.question}</textarea><textarea class="c-in" data-id="${q.id}">${q.criteria}</textarea>`; c.appendChild(d); }); };
        document.getElementById('content-close-btn').onclick=()=>m.style.display='none';
        document.getElementById('content-form').addEventListener('submit',async(e)=>{e.preventDefault(); const l=[]; document.querySelectorAll('.q-in').forEach(el=>{const id=el.dataset.id; l.push({id:id,question:el.value,criteria:document.querySelector(`.c-in[data-id="${id}"]`).value,timeLimit:document.querySelector(`.tl-in[data-id="${id}"]`).value});}); await fetch(`${NGROK_BASE_URL}/manageContent.php`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'},body:new URLSearchParams({'action':'save','interview_name':currentManagingInterview,'questions':JSON.stringify(l)})}); alert('Lưu xong'); m.style.display='none';});
    }

    // ===============================================================
    // 4. LOGIC MODAL ỨNG VIÊN
    // ===============================================================
    function initCandidateModalLogic() {
        const modal = document.getElementById('interviewee-modal');
        const tbody = document.getElementById('interviewee-list-body');
        
        window.openCandidateModal = (id) => {
            currentManagingInterview = id;
            document.getElementById('modal-title').textContent = `Ứng viên: ${id}`;
            modal.style.display = 'flex'; loadCand();
        };
        document.getElementById('modal-close-btn').onclick = () => modal.style.display = 'none';

        async function loadCand() {
            tbody.innerHTML = '<tr><td colspan="6">Tải...</td></tr>';
            const res = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'list','interview_name':currentManagingInterview}) });
            const data = await res.json();
            tbody.innerHTML = '';
            data.interviewees.forEach(u => {
                const status = u.status ? '<span style="color:green;font-weight:bold">Đã nộp</span>' : '<span style="color:gray">Chưa nộp</span>';
                const btn = u.status ? `<button class="btn-small btn-green view-res" data-u="${u.username}">📝 Chi tiết điểm</button>` : '';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.username}</td>
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

    // ===============================================================
    // 5. LOGIC MODAL CHẤM ĐIỂM (CÓ ĐIỂM THÀNH PHẦN & ĐIỂM TỔNG)
    // ===============================================================
    function initGradingModalLogic() {
        const modal = document.getElementById('grading-modal');
        const listEl = document.getElementById('grading-list');
        const vid = document.getElementById('video-container');
        const scoreIn = document.getElementById('detail-score');
        const reasonIn = document.getElementById('detail-reason');
        const finalScoreEl = document.getElementById('grading-final-score');
        
        let curCand = '', activeQ = null;

        window.openGradingModal = async (intId, u) => {
            currentManagingInterview = intId; curCand = u;
            modal.style.display = 'flex';
            document.getElementById('grading-title').textContent = `Chấm điểm: ${u}`;
            
            const res = await fetch(`${NGROK_BASE_URL}/manageGrading.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'load','interview_name':intId,'candidate_user':u}) });
            const json = await res.json();
            
            // Cập nhật điểm tổng kết trên Header Modal
            finalScoreEl.textContent = `TB: ${json.final_score || 0}`;

            listEl.innerHTML = '';
            json.data.forEach(q => {
                const d = document.createElement('div'); d.className='grading-question-item';
                d.dataset.id = q.id;
                // Hiển thị điểm thành phần đậm nét
                d.innerHTML = `<h4>Câu ${q.id}</h4><span>Điểm: <strong>${q.score}</strong></span>`;
                d.onclick = () => showDetail(q);
                listEl.appendChild(d);
            });
            if(json.data.length > 0) showDetail(json.data[0]);
        };
        
        document.getElementById('grading-close-btn').onclick = () => { modal.style.display='none'; window.openCandidateModal(currentManagingInterview); };

        function showDetail(q) {
            activeQ = q.id;
            document.getElementById('detail-q-text').textContent = q.question;
            scoreIn.value = q.score;
            reasonIn.value = ''; 
            document.getElementById('detail-history').textContent = q.history || '(Chưa có lịch sử)';
            vid.innerHTML = q.youtube_id ? `<iframe src="https://www.youtube.com/embed/${q.youtube_id}" allowfullscreen></iframe>` : '<span style="color:#ccc">Chưa có video.</span>';
            
            // Highlight
            document.querySelectorAll('.grading-question-item').forEach(el => el.classList.remove('active'));
            document.querySelector(`.grading-question-item[data-id="${q.id}"]`)?.classList.add('active');
        }

        document.getElementById('save-score-btn').onclick = async () => {
            const reason = reasonIn.value.trim();
            if(!reason) { alert("Vui lòng nhập lý do!"); return; }
            
            await fetch(`${NGROK_BASE_URL}/manageGrading.php`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded','ngrok-skip-browser-warning':'true'}, body:new URLSearchParams({'action':'update_score','interview_name':currentManagingInterview,'candidate_user':curCand,'question_id':activeQ,'score':scoreIn.value,'reason':reason}) });
            alert('Đã lưu điểm thành công!');
            window.openGradingModal(currentManagingInterview, curCand);
        };
    }
})();

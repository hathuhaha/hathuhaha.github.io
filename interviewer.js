(async function() {
    // --- CẤU HÌNH URL ---
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev';

    let currentManagingInterview = '';

    // --- INIT ---
    try {
        const response = await fetch(`${NGROK_BASE_URL}/interviewer.php`, { credentials: 'include', headers: {'ngrok-skip-browser-warning':'true'} });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('info-username').textContent = data.username;
            // ... (Code xử lý profile giữ nguyên như cũ) ...
            
            setupInterviewLogic(); // Gọi hàm khởi tạo danh sách
        } else {
            window.location.href = 'login.html';
        }
    } catch (e) { console.error(e); }

    // --- LOGIC QUẢN LÝ DANH SÁCH PHỎNG VẤN ---
    function setupInterviewLogic() {
        const listContainer = document.getElementById('interview-list');
        
        async function loadInterviews() {
            listContainer.innerHTML = '';
            try {
                const res = await fetch(`${NGROK_BASE_URL}/listInterview.php`, { credentials: 'include', headers: {'ngrok-skip-browser-warning':'true'} });
                const json = await res.json();
                
                if (json.interviews) {
                    json.interviews.forEach(name => {
                        const li = document.createElement('li');
                        li.style.borderBottom = "1px solid #eee";
                        li.style.padding = "10px";
                        li.style.display = "flex";
                        li.style.justifyContent = "space-between";
                        li.style.alignItems = "center";
                        
                        li.innerHTML = `
                            <span style="font-weight:bold; color:#007bff;">${name}</span>
                            <div class="action-btn-group">
                                <button class="btn-small btn-blue" onclick="openIntervieweeModal('${name}')">👤 Ứng viên</button>
                                <button class="btn-small btn-green" onclick="openContentModal('${name}')">📝 Nội dung</button>
                                <button class="btn-small" style="background:#dc3545; color:white; border:none;" onclick="deleteInterview('${name}')">Xóa</button>
                            </div>
                        `;
                        listContainer.appendChild(li);
                    });
                }
            } catch (e) { console.error(e); }
        }
        
        // Đăng ký hàm ra global để HTML gọi được
        window.deleteInterview = async (name) => {
            if(!confirm(`Xóa ${name}?`)) return;
            await fetch(`${NGROK_BASE_URL}/deleteInterview.php`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true' },
                body: new URLSearchParams({ 'interview_name': name })
            });
            loadInterviews();
        };

        // Form tạo mới
        document.getElementById('create-interview-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const count = document.getElementById('question-count').value;
            await fetch(`${NGROK_BASE_URL}/createInterview.php`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true' },
                body: new URLSearchParams({ 'question_count': count })
            });
            loadInterviews();
        });

        loadInterviews();
    }

    // --- LOGIC MODAL 1: QUẢN LÝ ỨNG VIÊN (ĐÃ FIX LỖI SỬA TÊN) ---
    window.openIntervieweeModal = async (name) => {
        currentManagingInterview = name;
        document.getElementById('modal-title').textContent = `Ứng viên: ${name}`;
        document.getElementById('interviewee-modal').style.display = 'flex';
        loadIntervieweeTable();
    };

    async function loadIntervieweeTable() {
        const tbody = document.getElementById('interviewee-list-body');
        tbody.innerHTML = '<tr><td colspan="4">Đang tải...</td></tr>';
        
        const res = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true' },
            body: new URLSearchParams({ action: 'list', interview_name: currentManagingInterview })
        });
        const data = await res.json();
        
        tbody.innerHTML = '';
        if (data.interviewees) {
            data.interviewees.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.username}</td>
                    <td>
                        <input type="text" class="form-input edit-name-input" value="${u.fullname}" data-user="${u.username}">
                        <button class="btn-small btn-blue" onclick="updateFullname('${u.username}')">Lưu tên</button>
                    </td>
                    <td>${u.joincode}</td>
                    <td><button class="btn-small" style="background:#dc3545; color:white;" onclick="deleteUser('${u.username}')">Xóa</button></td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    // Hàm thêm user
    document.getElementById('modal-add-interviewee-btn').addEventListener('click', async () => {
        await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true' },
            body: new URLSearchParams({ action: 'add', interview_name: currentManagingInterview })
        });
        loadIntervieweeTable();
    });

    // Hàm sửa tên (Được gọi từ HTML trong bảng)
    window.updateFullname = async (username) => {
        const input = document.querySelector(`input[data-user="${username}"]`);
        if(!input) return;
        
        const newName = input.value;
        if(!confirm(`Đổi tên thành "${newName}"?`)) return;

        const res = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true' },
            body: new URLSearchParams({ 
                action: 'update', 
                interview_name: currentManagingInterview,
                username_to_update: username,
                fullname: newName
            })
        });
        const data = await res.json();
        alert(data.message);
        if(data.success) loadIntervieweeTable();
    };

    window.deleteUser = async (username) => {
        if(!confirm('Xóa user này?')) return;
        await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true' },
            body: new URLSearchParams({ action: 'delete', interview_name: currentManagingInterview, username_to_delete: username })
        });
        loadIntervieweeTable();
    };


    // --- LOGIC MODAL 2: QUẢN LÝ NỘI DUNG (NEW) ---
    window.openContentModal = async (name) => {
        currentManagingInterview = name;
        document.getElementById('content-modal').style.display = 'flex';
        document.getElementById('content-loading').style.display = 'block';
        document.getElementById('content-form').style.display = 'none';
        
        // Load dữ liệu
        const res = await fetch(`${NGROK_BASE_URL}/manageContent.php`, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true' },
            body: new URLSearchParams({ action: 'load', interview_name: name })
        });
        const json = await res.json();
        
        const container = document.getElementById('questions-container');
        container.innerHTML = '';
        
        if (json.success && json.data) {
            json.data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'question-block';
                div.innerHTML = `
                    <h4>Câu hỏi số ${item.id}</h4>
                    <label>Nội dung câu hỏi:</label>
                    <textarea class="q-text" data-id="${item.id}">${item.question}</textarea>
                    <br><br>
                    <label>Tiêu chí chấm (Lưu vào mark_instruction.txt):</label>
                    <textarea class="c-text" data-id="${item.id}">${item.criteria}</textarea>
                `;
                container.appendChild(div);
            });
            document.getElementById('content-loading').style.display = 'none';
            document.getElementById('content-form').style.display = 'block';
        }
    };

    // Lưu nội dung
    document.getElementById('content-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const qInputs = document.querySelectorAll('.q-text');
        const cInputs = document.querySelectorAll('.c-text');
        
        let dataToSend = [];
        qInputs.forEach((input, index) => {
            dataToSend.push({
                id: input.getAttribute('data-id'),
                question: input.value,
                criteria: cInputs[index].value
            });
        });

        const status = document.getElementById('content-status-msg');
        status.textContent = "Đang lưu...";
        
        const res = await fetch(`${NGROK_BASE_URL}/manageContent.php`, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning':'true' },
            body: new URLSearchParams({ 
                action: 'save', 
                interview_name: currentManagingInterview,
                questions: JSON.stringify(dataToSend)
            })
        });
        const json = await res.json();
        status.textContent = json.message;
        setTimeout(() => { 
            document.getElementById('content-modal').style.display = 'none'; 
            status.textContent = '';
        }, 1500);
    });

})();

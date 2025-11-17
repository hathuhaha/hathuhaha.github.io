// Script này chạy ngay lập tức (IIFE)
(async function() {
    
    // (!!!) THAY ĐỔI ĐỊA CHỈ NGROK CỦA BẠN TẠI ĐÂY (!!!)
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev';

    let currentFullname = '';
    let currentDob = '';
    let currentManagingInterview = '';

    try {
        // 1. KIỂM TRA PHIÊN ĐĂNG NHẬP
        const response = await fetch(`${NGROK_BASE_URL}/interviewer.php`, {
            method: 'GET',
            headers: { 'ngrok-skip-browser-warning': 'true' },
            credentials: 'include' 
        });
        if (!response.ok) throw new Error('Server trả về lỗi: ' + response.status);
        const data = await response.json();

        // 2. XỬ LÝ KẾT QUẢ
        if (data.success === true) {
            console.log('Chào mừng, ' + data.username);
            currentFullname = data.fullname || '';
            currentDob = data.dob || '';

            const setupInterviewerPage = () => {
                setupProfileSidebar(data);
                setupLogoutButton();
                setupInterviewLogic();
                setupIntervieweeModalLogic(); // (!!!) HÀM NÀY SẼ ĐƯỢC CẬP NHẬT
            };
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupInterviewerPage);
            } else {
                setupInterviewerPage();
            }

        } else {
            console.log('Chưa đăng nhập, đang chuyển hướng...');
            window.location.href = 'login.html';
        }

    } catch (error) {
        console.error('Lỗi xác thực nghiêm trọng:', error);
        window.location.href = 'login.html';
    }

    // --- (Hàm setupProfileSidebar và setupLogoutButton giữ nguyên) ---
    function setupProfileSidebar(data) {
        // (Giữ nguyên code từ file trước)
        const userDisplay = document.getElementById('username-display');
        if (userDisplay) userDisplay.textContent = data.username;
        const infoUsername = document.getElementById('info-username');
        if (infoUsername) infoUsername.textContent = data.username;
        const infoFullname = document.getElementById('info-fullname');
        if (infoFullname) infoFullname.textContent = currentFullname || '(Chưa cập nhật)';
        const infoDob = document.getElementById('info-dob');
        if (infoDob) infoDob.textContent = currentDob || '(Chưa cập nhật)';
        const sidebar = document.getElementById('sidebar-profile');
        const editBtn = document.getElementById('edit-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');
        const cancelBtn = document.getElementById('cancel-profile-btn');
        const editFullname = document.getElementById('edit-fullname');
        const editDob = document.getElementById('edit-dob');
        const editStatusMsg = document.getElementById('edit-status-msg');
        if (!sidebar || !editBtn || !saveBtn || !cancelBtn || !editFullname || !editDob) return;
        editBtn.addEventListener('click', () => {
            editStatusMsg.textContent = '';
            editFullname.value = currentFullname;
            editDob.value = currentDob;
            sidebar.classList.add('is-editing');
        });
        cancelBtn.addEventListener('click', () => {
            sidebar.classList.remove('is-editing');
            editStatusMsg.textContent = '';
        });
        saveBtn.addEventListener('click', async () => {
            editStatusMsg.textContent = 'Đang lưu...';
            saveBtn.disabled = true;
            cancelBtn.disabled = true;
            const newFullname = editFullname.value;
            const newDob = editDob.value;
            try {
                const response = await fetch(`${NGROK_BASE_URL}/editInterviewerInfo.php`, {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning': 'true' },
                    body: new URLSearchParams({ 'fullname': newFullname, 'dob': newDob })
                });
                const result = await response.json();
                if (!response.ok || result.success === false) throw new Error(result.message || 'Lỗi server');
                editStatusMsg.textContent = 'Cập nhật thành công!';
                currentFullname = newFullname;
                currentDob = newDob;
                infoFullname.textContent = currentFullname || '(Chưa cập nhật)';
                infoDob.textContent = currentDob || '(Chưa cập nhật)';
                sidebar.classList.remove('is-editing');
                setTimeout(() => { editStatusMsg.textContent = ''; }, 2000);
            } catch (error) {
                editStatusMsg.textContent = `Lỗi: ${error.message}`;
            } finally {
                saveBtn.disabled = false;
                cancelBtn.disabled = false;
            }
        });
    }

    function setupLogoutButton() {
        // (Giữ nguyên code từ file trước)
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                try {
                    logoutButton.disabled = true;
                    logoutButton.textContent = "Đang đăng xuất...";
                    // (Sử dụng code logout.php "mạnh tay" mà chúng ta đã thảo luận)
                    await fetch(`${NGROK_BASE_URL}/logout.php`, {
                        method: 'GET', headers: { 'ngrok-skip-browser-warning': 'true' }, credentials: 'include' 
                    });
                } catch (error) { console.error('Lỗi khi đăng xuất:', error); } 
                finally { window.location.href = 'login.html'; }
            });
        }
    }

    function setupInterviewLogic() {
        // (Giữ nguyên code từ file trước)
        const createForm = document.getElementById('create-interview-form');
        const createStatusMsg = document.getElementById('create-status-msg');
        const interviewList = document.getElementById('interview-list');
        const listLoadingMsg = document.getElementById('interview-list-loading');
        if (!createForm || !interviewList || !listLoadingMsg || !createStatusMsg) return;
        async function loadInterviews() {
            listLoadingMsg.textContent = 'Đang tải danh sách...';
            listLoadingMsg.style.display = 'block';
            interviewList.innerHTML = '';
            try {
                const response = await fetch(`${NGROK_BASE_URL}/listInterview.php`, {
                    method: 'GET', credentials: 'include', headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                const data = await response.json();
                if (!response.ok || data.success === false) throw new Error(data.message || 'Không thể tải danh sách');
                if (data.interviews && data.interviews.length > 0) {
                    listLoadingMsg.style.display = 'none';
                    data.interviews.forEach(name => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <span class="interview-name-link" data-name="${name}">${name} (Quản lý)</span>
                            <button class="delete-btn" data-name="${name}">Xóa</button>
                        `;
                        interviewList.appendChild(li);
                    });
                } else {
                    listLoadingMsg.textContent = 'Bạn chưa tạo cuộc phỏng vấn nào.';
                }
            } catch (error) {
                listLoadingMsg.textContent = `Lỗi: ${error.message}`;
            }
        }
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const countInput = document.getElementById('question-count');
            const createBtn = createForm.querySelector('button[type="submit"]');
            createStatusMsg.textContent = 'Đang tạo...';
            createBtn.disabled = true;
            try {
                const response = await fetch(`${NGROK_BASE_URL}/createInterview.php`, {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning': 'true' },
                    body: new URLSearchParams({ 'question_count': countInput.value })
                });
                const result = await response.json();
                if (!response.ok || result.success === false) throw new Error(result.message || 'Lỗi server');
                createStatusMsg.textContent = result.message || 'Tạo thành công!';
                countInput.value = '5';
                loadInterviews();
                setTimeout(() => { createStatusMsg.textContent = ''; }, 3000);
            } catch (error) {
                createStatusMsg.textContent = `Lỗi: ${error.message}`;
            } finally {
                createBtn.disabled = false;
            }
        });
        interviewList.addEventListener('click', async (e) => {
            const target = e.target;
            if (target.classList.contains('delete-btn')) {
                const deleteBtn = target;
                const interviewName = deleteBtn.dataset.name;
                if (!confirm(`Bạn có chắc muốn xóa "${interviewName}"?`)) return;
                deleteBtn.disabled = true;
                deleteBtn.textContent = 'Đang xóa...';
                try {
                    const response = await fetch(`${NGROK_BASE_URL}/deleteInterview.php`, {
                        method: 'POST', credentials: 'include',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning': 'true' },
                        body: new URLSearchParams({ 'interview_name': interviewName })
                    });
                    const result = await response.json();
                    if (!response.ok || result.success === false) throw new Error(result.message || 'Lỗi server');
                    deleteBtn.parentElement.remove();
                    if (interviewList.children.length === 0) {
                         listLoadingMsg.textContent = 'Bạn chưa tạo cuộc phỏng vấn nào.';
                         listLoadingMsg.style.display = 'block';
                    }
                } catch (error) {
                    alert(`Lỗi khi xóa: ${error.message}`);
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = 'Xóa';
                }
            }
            if (target.classList.contains('interview-name-link')) {
                const interviewName = target.dataset.name;
                openIntervieweeModal(interviewName);
            }
        });
        loadInterviews();
    }
    
    // (!!!) HÀM NÀY ĐÃ ĐƯỢC CẬP NHẬT TOÀN BỘ (!!!)
    function setupIntervieweeModalLogic() {
        const modal = document.getElementById('interviewee-modal');
        const closeBtn = document.getElementById('modal-close-btn');
        const modalTitle = document.getElementById('modal-title');
        const addBtn = document.getElementById('modal-add-interviewee-btn');
        const statusMsg = document.getElementById('modal-status-msg');
        const tableBody = document.getElementById('interviewee-list-body');

        if (!modal || !closeBtn || !modalTitle || !addBtn || !statusMsg || !tableBody) return;

        // Mở Modal (Không đổi)
        window.openIntervieweeModal = (interviewName) => {
            currentManagingInterview = interviewName;
            modalTitle.textContent = `Quản lý ứng viên: ${interviewName}`;
            statusMsg.textContent = '';
            tableBody.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';
            modal.style.display = 'flex';
            loadInterviewees();
        };

        // Đóng Modal (Không đổi)
        const closeModal = () => {
            modal.style.display = 'none';
            currentManagingInterview = '';
        };
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Tải danh sách (Không đổi)
        async function loadInterviewees() {
            if (currentManagingInterview === '') return;
            tableBody.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';
            try {
                const response = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning': 'true' },
                    body: new URLSearchParams({ action: 'list', interview_name: currentManagingInterview })
                });
                const data = await response.json();
                if (!response.ok || data.success === false) throw new Error(data.message || 'Lỗi');
                renderIntervieweeTable(data.interviewees || []);
            } catch (error) {
                tableBody.innerHTML = `<tr><td colspan="5" style="color: red;">${error.message}</td></tr>`;
            }
        }
        
        // (!!!) HÀM RENDER ĐÃ THAY ĐỔI (!!!)
        function renderIntervieweeTable(interviewees) {
            tableBody.innerHTML = '';
            if (interviewees.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5">Chưa có ứng viên nào.</td></tr>';
                return;
            }
            interviewees.forEach(user => {
                const tr = document.createElement('tr');
                tr.dataset.username = user.username; // Gắn username vào <tr>
                
                // Xác định trạng thái
                const statusHtml = user.status 
                    ? '<span style="color: green; font-weight: bold;">Đã nộp</span>' 
                    : '<span style="color: gray;">Chưa nộp</span>';
                
                // Render HTML cho <tr>
                tr.innerHTML = `
                    <td>
                        <span class="display-val">${user.username}</span>
                    </td>
                    <td>
                        <span class="display-val display-fullname">${user.fullname}</span>
                        <input class="edit-val edit-fullname form-input" value="${user.fullname}">
                    </td>
                    <td>
                        <span class="display-val">${user.joincode}</span>
                    </td>
                    <td>
                        ${statusHtml}
                    </td>
                    <td>
                        <button class="edit-btn edit-row-btn" data-username="${user.username}">Sửa tên</button>
                        <button class="delete-btn delete-interviewee" data-username="${user.username}">Xóa</button>
                        
                        <button class="save-btn save-row-btn" data-username="${user.username}" style="display: none;">Lưu</button>
                        <button class="cancel-btn cancel-edit-row-btn" data-username="${user.username}" style="display: none;">Hủy</button>
                    </td>
                `;
                // (Input cho joincode đã bị xóa)
                tableBody.appendChild(tr);
            });
        }

        // (!!!) LOGIC THÊM MỚI (CẬP NHẬT) (!!!)
        addBtn.addEventListener('click', async () => {
            statusMsg.textContent = 'Đang thêm...';
            addBtn.disabled = true;
            try {
                const response = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning': 'true' },
                    body: new URLSearchParams({ action: 'add', interview_name: currentManagingInterview })
                });
                const data = await response.json();
                if (!response.ok || data.success === false) throw new Error(data.message || 'Lỗi');
                
                statusMsg.textContent = `Đã tạo: ${data.newUser.username}`;
                
                // Hiển thị mật khẩu 1 LẦN (trên cùng)
                const tr = document.createElement('tr');
                tr.className = 'new-user-highlight';
                tr.innerHTML = `
                    <td>${data.newUser.username}</td>
                    <td>${data.newUser.fullname}</td>
                    <td>${data.newUser.joincode}</td>
                    <td><span style="color: gray;">Chưa nộp</span></td>
                    <td style="color: red; font-weight: bold;">(Copy Mật khẩu: ${data.newUser.password})</td>
                `;
                if (tableBody.querySelector('td[colspan="5"]')) tableBody.innerHTML = '';
                tableBody.prepend(tr); 
                
                // Tải lại danh sách sau 1 giây để hàng mới tạo (ở trên) được thay thế
                // bằng hàng chuẩn (có nút sửa/xóa)
                setTimeout(loadInterviewees, 1500); 

            } catch (error) {
                statusMsg.textContent = `Lỗi: ${error.message}`;
            } finally {
                addBtn.disabled = false;
                setTimeout(() => { statusMsg.textContent = ''; }, 5000); // Tăng thời gian
            }
        });
        
        // (!!!) LOGIC SỬA/XÓA ỨNG VIÊN (CẬP NHẬT) (!!!)
        tableBody.addEventListener('click', async (e) => {
            const target = e.target;
            const tr = target.closest('tr');
            if (!tr || !tr.dataset.username) return; // Bỏ qua nếu bấm vào hàng mới tạo (chưa có dataset)
            
            const username = tr.dataset.username;

            // --- HÀNH ĐỘNG: Sửa ---
            if (target.classList.contains('edit-row-btn')) {
                tr.classList.add('is-editing-row'); // CSS sẽ xử lý ẩn/hiện
            }
            
            // --- HÀNH ĐỘNG: Hủy Sửa ---
            if (target.classList.contains('cancel-edit-row-btn')) {
                tr.classList.remove('is-editing-row');
                // Reset giá trị input
                tr.querySelector('.edit-fullname').value = tr.querySelector('.display-fullname').textContent;
            }

            // --- HÀNH ĐỘNG: Lưu ---
            if (target.classList.contains('save-row-btn')) {
                const newFullname = tr.querySelector('.edit-fullname').value;

                target.disabled = true;
                target.textContent = '...';
                statusMsg.textContent = `Đang lưu ${username}...`;

                try {
                    const response = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                        method: 'POST', credentials: 'include',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning': 'true' },
                        body: new URLSearchParams({
                            action: 'update',
                            interview_name: currentManagingInterview,
                            username_to_update: username,
                            fullname: newFullname
                            // (Không cần gửi joincode)
                        })
                    });
                    const data = await response.json();
                    if (!response.ok || data.success === false) throw new Error(data.message || 'Lỗi');

                    // Cập nhật text hiển thị
                    tr.querySelector('.display-fullname').textContent = data.updatedUser.fullname;
                    tr.classList.remove('is-editing-row'); // Tắt chế độ sửa
                    statusMsg.textContent = data.message;
                    
                } catch (error) {
                    statusMsg.textContent = `Lỗi: ${error.message}`;
                    target.disabled = false; // Cho phép thử lại
                    target.textContent = 'Lưu';
                } finally {
                    setTimeout(() => { statusMsg.textContent = ''; }, 3000);
                }
            }

            // --- HÀNH ĐỘNG: Xóa ---
            if (target.classList.contains('delete-interviewee')) {
                if (!confirm(`Bạn có chắc muốn xóa TOÀN BỘ ứng viên "${username}"? (Bao gồm cả file kết quả nếu có)`)) return;

                target.disabled = true;
                target.textContent = '...';
                statusMsg.textContent = `Đang xóa ${username}...`;
            
                try {
                    const response = await fetch(`${NGROK_BASE_URL}/manageInterviewer.php`, {
                        method: 'POST', credentials: 'include',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'ngrok-skip-browser-warning': 'true' },
                        body: new URLSearchParams({
                            action: 'delete',
                            interview_name: currentManagingInterview,
                            username_to_delete: username
                        })
                    });
                    const data = await response.json();
                    if (!response.ok || data.success === false) throw new Error(data.message || 'Lỗi');
                
                    statusMsg.textContent = data.message;
                    tr.remove(); // Xóa <tr>
                
                } catch (error) {
                    statusMsg.textContent = `Lỗi: ${error.message}`;
                    target.disabled = false;
                    target.textContent = 'Xóa';
                } finally {
                    setTimeout(() => { statusMsg.textContent = ''; }, 3000);
                }
            }
        });
    }

})();

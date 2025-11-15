// Script này chạy ngay lập tức (IIFE)
(async function() {
    
    // (!!!) THAY ĐỔI ĐỊA CHỈ NGROK CỦA BẠN TẠI ĐÂY (!!!)
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev';

    // Biến để lưu trữ thông tin, dùng cho việc HỦY
    let currentFullname = '';
    let currentDob = '';

    try {
        // 1. KIỂM TRA PHIÊN ĐĂNG NHẬP (Gác cổng)
        const response = await fetch(`${NGROK_BASE_URL}/interviewer.php`, {
            method: 'GET',
            headers: { 'ngrok-skip-browser-warning': 'true' },
            credentials: 'include' 
        });

        if (!response.ok) {
            throw new Error('Server trả về lỗi: ' + response.status);
        }

        const data = await response.json();

        // 2. XỬ LÝ KẾT QUẢ
        if (data.success === true) {
            // ĐÃ ĐĂNG NHẬP THÀNH CÔNG
            console.log('Chào mừng, ' + data.username);
            
            // Lưu lại thông tin
            currentFullname = data.fullname || '';
            currentDob = data.dob || '';

            // Hàm này sẽ chạy khi DOM sẵn sàng
            const setupInterviewerPage = () => {
                
                // === TÁC VỤ A: ĐIỀN THÔNG TIN (Như cũ) ===
                const userDisplay = document.getElementById('username-display');
                if (userDisplay) userDisplay.textContent = data.username;

                const infoUsername = document.getElementById('info-username');
                if (infoUsername) infoUsername.textContent = data.username;

                const infoFullname = document.getElementById('info-fullname');
                if (infoFullname) infoFullname.textContent = currentFullname || '(Chưa cập nhật)';

                const infoDob = document.getElementById('info-dob');
                if (infoDob) infoDob.textContent = currentDob || '(Chưa cập nhật)';

                // === TÁC VỤ B: GẮN NÚT ĐĂNG XUẤT (Như cũ) ===
                const logoutButton = document.getElementById('logout-button');
                if (logoutButton) {
                    logoutButton.addEventListener('click', async () => {
                        try {
                            logoutButton.disabled = true;
                            logoutButton.textContent = "Đang đăng xuất...";
                            await fetch(`${NGROK_BASE_URL}/logout.php`, {
                                method: 'GET',
                                headers: { 'ngrok-skip-browser-warning': 'true' },
                                credentials: 'include' 
                            });
                        } catch (error) {
                            console.error('Lỗi khi đăng xuất:', error);
                        } finally {
                            window.location.href = 'login.html';
                        }
                    });
                }

                // === (!!!) TÁC VỤ C: LOGIC CHỈNH SỬA THÔNG TIN (MỚI) (!!!) ===
                const sidebar = document.getElementById('sidebar-profile');
                const editBtn = document.getElementById('edit-profile-btn');
                const saveBtn = document.getElementById('save-profile-btn');
                const cancelBtn = document.getElementById('cancel-profile-btn');
                
                const editFullname = document.getElementById('edit-fullname');
                const editDob = document.getElementById('edit-dob');
                const editStatusMsg = document.getElementById('edit-status-msg');

                if (!sidebar || !editBtn || !saveBtn || !cancelBtn || !editFullname || !editDob) {
                    console.error('Không tìm thấy đủ các element để chỉnh sửa profile.');
                    return;
                }
                
                // Khi nhấn nút SỬA (cái bút)
                editBtn.addEventListener('click', () => {
                    editStatusMsg.textContent = ''; // Xóa thông báo lỗi cũ
                    // Điền giá trị hiện tại vào ô input
                    editFullname.value = currentFullname;
                    editDob.value = currentDob;
                    // Thêm class .is-editing để đổi giao diện
                    sidebar.classList.add('is-editing');
                });

                // Khi nhấn nút HỦY
                cancelBtn.addEventListener('click', () => {
                    sidebar.classList.remove('is-editing');
                    editStatusMsg.textContent = ''; // Xóa thông báo
                });

                // Khi nhấn nút LƯU
                saveBtn.addEventListener('click', async () => {
                    editStatusMsg.textContent = 'Đang lưu...';
                    saveBtn.disabled = true;
                    cancelBtn.disabled = true;

                    const newFullname = editFullname.value;
                    const newDob = editDob.value;
                    
                    try {
                        const response = await fetch(`${NGROK_BASE_URL}/editInterviewerInfo.php`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'ngrok-skip-browser-warning': 'true'
                            },
                            body: new URLSearchParams({
                                'fullname': newFullname,
                                'dob': newDob
                            })
                        });

                        const result = await response.json();

                        if (!response.ok || result.success === false) {
                            throw new Error(result.message || 'Lỗi không xác định từ server');
                        }

                        // LƯU THÀNH CÔNG
                        editStatusMsg.textContent = 'Cập nhật thành công!';
                        
                        // Cập nhật giá trị "hiện tại"
                        currentFullname = newFullname;
                        currentDob = newDob;
                        
                        // Cập nhật text hiển thị
                        infoFullname.textContent = currentFullname || '(Chưa cập nhật)';
                        infoDob.textContent = currentDob || '(Chưa cập nhật)';
                        
                        // Chuyển về chế độ xem
                        sidebar.classList.remove('is-editing');

                    } catch (error) {
                        console.error('Lỗi khi lưu profile:', error);
                        editStatusMsg.textContent = `Lỗi: ${error.message}`;
                    } finally {
                        saveBtn.disabled = false;
                        cancelBtn.disabled = false;
                        // Xóa thông báo thành công sau 2 giây
                        if(editStatusMsg.textContent === 'Cập nhật thành công!') {
                            setTimeout(() => { editStatusMsg.textContent = ''; }, 2000);
                        }
                    }
                });
            };
            
            // Chờ DOM sẵn sàng rồi mới chạy các tác vụ
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupInterviewerPage);
            } else {
                setupInterviewerPage(); // DOM đã sẵn sàng
            }

        } else {
            // CHƯA ĐĂNG NHẬP: Ném về trang login
            console.log('Chưa đăng nhập (hoặc session bị mất), đang chuyển hướng...');
            window.location.href = 'login.html';
        }

    } catch (error) {
        // LỖI NGHIÊM TRỌNG (Mất mạng, Server sập, Lỗi JSON): Ném về login
        console.error('Lỗi xác thực nghiêm trọng:', error);
        window.location.href = 'login.html';
    }

})(); // Chạy hàm "gác cổng" này ngay lập tức

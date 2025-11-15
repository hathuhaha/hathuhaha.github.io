document.addEventListener('DOMContentLoaded', function() {
    
    // ===============================================
    // PHẦN 1: LOGIC CHUYỂN TAB (Giữ nguyên)
    // ===============================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const formContents = document.querySelectorAll('.form-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const formName = button.getAttribute('data-form');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            formContents.forEach(form => form.classList.remove('active'));
            
            const activeForm = document.getElementById('form-' + formName);
            if (activeForm) {
                activeForm.classList.add('active');
            }
        });
    });

    // ==========================================================
    // PHẦN 2: LOGIC SUBMIT FORM (VỚI FETCH ĐÃ SỬA LỖI)
    // ==========================================================

    const interviewerForm = document.getElementById('form-interviewer');
    const participantForm = document.getElementById('form-participant');
    const interviewerErrorMsg = document.getElementById('interviewer-error-message');
    
    // --- 1. Xử lý Form Người khởi tạo (Interviewer) ---
    if (interviewerForm) {
        interviewerForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            interviewerErrorMsg.textContent = ''; 

            const username = document.getElementById('interviewer-username').value;
            const password = document.getElementById('interviewer-password').value;
            const submitButton = interviewerForm.querySelector('button[type="submit"]');
            const NGROK_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev/login.php'; 

            try {
                interviewerErrorMsg.textContent = 'Đang kiểm tra...';
                submitButton.disabled = true;

                const data = new URLSearchParams();
                data.append('username', username);
                data.append('password', password);

                const response = await fetch(NGROK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'ngrok-skip-browser-warning': 'true' 
                    },
                    credentials: 'include', 
                    body: data
                });

                submitButton.disabled = false;
                const textResponse = await response.text();
                
                if (response.ok && textResponse.trim() === 'OK') {
                    // THÀNH CÔNG: Chuyển trang
                    window.location.href = 'interviewer.html';
                } else {
                    // THẤT BẠI: Hiển thị lỗi server (kể cả 401)
                    interviewerErrorMsg.textContent = textResponse.trim() || 'Lỗi không xác định.';
                }
                
            } catch (error) {
                // Lỗi này là lỗi mạng/kết nối
                submitButton.disabled = false;
                interviewerErrorMsg.textContent = 'Đăng nhập không thành công. Vui lòng thử lại';
                console.error('Lỗi khi gọi API đăng nhập:', error);
            }
        });
    }

    // --- 2. Xử lý Form Người tham gia (Participant) ---
    if (participantForm) {
        participantForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            
            // ==========================================
            // === SỬA LỖI LOGIC CHÍNH LÀ Ở ĐÂY ===
            // Chuyển hướng đến trang quay video (index.html)
            // thay vì trang phòng chờ (interviewee.html)
            // ==========================================
            window.location.href = 'index.html';
        });
    }

    // ==========================================================
    // PHẦN 3: LOGIC HIỆN/ẨN MẬT KHẨU (Giữ nguyên)
    // ==========================================================
    
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('interviewer-password'); 
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');

    if (togglePassword && passwordInput) {
        
        togglePassword.addEventListener('click', function() {
            
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            if (type === 'password') {
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            } else {
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            }
        });
    }

});

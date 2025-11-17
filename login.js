document.addEventListener('DOMContentLoaded', function() {
    
    const INTERVIEWER_LOGIN_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev/login.php';
    const PARTICIPANT_LOGIN_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev/interviewee.php'; 

    // ===============================================
    // PHẦN 1: LOGIC CHUYỂN TAB (Giữ nguyên)
    // ===============================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const formContents = document.querySelectorAll('.form-content');
    const interviewerErrorMsg = document.getElementById('interviewer-error-message');
    const participantErrorMsg = document.getElementById('participant-error-message');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const formName = button.getAttribute('data-form');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            formContents.forEach(form => form.classList.remove('active'));
            
            const activeForm = document.getElementById('form-' + formName);
            if (activeForm) activeForm.classList.add('active');

            if (interviewerErrorMsg) interviewerErrorMsg.textContent = '';
            if (participantErrorMsg) participantErrorMsg.textContent = '';
        });
    });

    // ==========================================================
    // PHẦN 2: LOGIC SUBMIT FORM
    // ==========================================================

    const interviewerForm = document.getElementById('form-interviewer');
    const participantForm = document.getElementById('form-participant');
    
    // --- 1. Xử lý Form Người khởi tạo (Interviewer) (Không đổi) ---
    if (interviewerForm) {
        interviewerForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            if (interviewerErrorMsg) interviewerErrorMsg.textContent = ''; 

            const username = document.getElementById('interviewer-username').value;
            const password = document.getElementById('interviewer-password').value;
            const submitButton = interviewerForm.querySelector('button[type="submit"]');

            try {
                if (interviewerErrorMsg) interviewerErrorMsg.textContent = 'Đang kiểm tra...';
                submitButton.disabled = true;

                const data = new URLSearchParams();
                data.append('username', username);
                data.append('password', password);

                const response = await fetch(INTERVIEWER_LOGIN_URL, {
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
                    window.location.href = 'interviewer.html';
                } else {
                    if (interviewerErrorMsg) {
                        interviewerErrorMsg.textContent = textResponse.trim() || 'Lỗi không xác định.';
                    }
                }
            } catch (error) {
                submitButton.disabled = false;
                if (interviewerErrorMsg) {
                    interviewerErrorMsg.textContent = 'Đăng nhập không thành công. Vui lòng thử lại';
                }
                console.error('Lỗi khi gọi API đăng nhập interviewer:', error);
            }
        });
    }

    // --- 2. Xử lý Form Người tham gia (Participant) (ĐÃ CẬP NHẬT ĐƯỜNG DẪN) ---
    if (participantForm) {
        participantForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            if (participantErrorMsg) participantErrorMsg.textContent = ''; 

            const username = document.getElementById('participant-username').value;
            const join_code = document.getElementById('participant-join-code').value;
            const submitButton = participantForm.querySelector('button[type="submit"]');
            
            try {
                if (participantErrorMsg) participantErrorMsg.textContent = 'Đang kiểm tra...';
                submitButton.disabled = true;

                const data = new URLSearchParams();
                data.append('username', username);
ac                data.append('join_code', join_code);

                const response = await fetch(PARTICIPANT_LOGIN_URL, { 
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
                    // (!!!) THAY ĐỔI THEO YÊU CẦU CỦA BẠN (!!!)
                    window.location.href = 'interviewee.html';
                } else {
                    if (participantErrorMsg) {
                        participantErrorMsg.textContent = textResponse.trim() || 'Tài khoản hoặc Mã tham gia không đúng.';
                    }
                }
                
            } catch (error) {
                submitButton.disabled = false;
                if (participantErrorMsg) {
                    participantErrorMsg.textContent = 'Đăng nhập không thành công. Vui lòng thử lại';
                }
                console.error('Lỗi khi gọi API đăng nhập participant:', error);
            }
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

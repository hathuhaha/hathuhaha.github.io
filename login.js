// Chờ cho toàn bộ nội dung HTML được tải xong
document.addEventListener('DOMContentLoaded', function() {
    
    // ===============================================
    // PHẦN 1: LOGIC CHUYỂN TAB (Giữ nguyên)
    // ===============================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const formContents = document.querySelectorAll('.form-content');

    tabButtons.forEach(function(button) {
        
        button.addEventListener('click', function() {
            
            const formName = button.getAttribute('data-form');

            // Xử lý nút active
            tabButtons.forEach(function(btn) {
                btn.classList.remove('active');
            });
            button.classList.add('active');


            // Xử lý form active
            formContents.forEach(function(form) {
                form.classList.remove('active');
            });
            
            const activeForm = document.getElementById('form-' + formName);
            if (activeForm) {
                activeForm.classList.add('active');
            }
        });
    });

    // ==========================================================
    // PHẦN 2: LOGIC CHUYỂN TRANG (KHÔNG DÙNG FETCH)
    // ==========================================================

    const interviewerForm = document.getElementById('form-interviewer');
    const participantForm = document.getElementById('form-participant');

    // Chuyển đến trang Interviewer
    if (interviewerForm) {
        interviewerForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            console.log('Đăng nhập với tư cách Người khởi tạo...');
            window.location.href = 'interviewer.html';
        });
    }

    // Chuyển đến trang Interviewee
    if (participantForm) {
        participantForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            console.log('Đăng nhập với tư cách Người tham gia...');
            window.location.href = 'interviewee.html';
        });
    }

    // ==========================================================
    // PHẦN 3: LOGIC HIỆN/ẨN MẬT KHẨU (MỚI THÊM)
    // ==========================================================
    
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('room-password');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');

    if (togglePassword && passwordInput) {
        
        togglePassword.addEventListener('click', function() {
            
            // Kiểm tra trạng thái hiện tại của ô mật khẩu
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Đổi biểu tượng con mắt
            if (type === 'password') {
                // Đang là MẬT KHẨU (ẩn) -> Hiển thị MẮT MỞ
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            } else {
                // Đang là TEXT (hiện) -> Hiển thị MẮT ĐÓNG
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            }
        });
    }


});

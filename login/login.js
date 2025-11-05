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
    // PHẦN 2: LOGIC SUBMIT FORM (Cập nhật với Fetch)
    // ==========================================================

    const interviewerForm = document.getElementById('form-interviewer');
    const participantForm = document.getElementById('form-participant');
    const interviewerErrorMsg = document.getElementById('interviewer-error-message');
    
    // --- 1. Xử lý Form Người khởi tạo (Interviewer) với FETCH ---
    if (interviewerForm) {
        interviewerForm.addEventListener('submit', async function(event) {
            // Luôn ngăn form gửi đi
            event.preventDefault(); 
            interviewerErrorMsg.textContent = ''; 

            // Lấy giá trị từ form
            const username = document.getElementById('interviewer-username').value;
            const password = document.getElementById('interviewer-password').value;
            
            // Lấy nút submit
            const submitButton = interviewerForm.querySelector('button[type="submit"]');
            
            // URL máy chủ ngrok của bạn
            const NGROK_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev/login.php'; 

            try {
                // Hiển thị trạng thái chờ và vô hiệu hóa nút
                interviewerErrorMsg.textContent = 'Đang kiểm tra...';
                submitButton.disabled = true;

                // Chuẩn bị dữ liệu dưới dạng 'x-www-form-urlencoded'
                const data = new URLSearchParams();
                data.append('username', username);
                data.append('password', password);

                // **Đây là lệnh FETCH thật**
                const response = await fetch(NGROK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        // Thêm header này để bỏ qua cảnh báo của ngrok
                        'ngrok-skip-browser-warning': 'true' 
                    },
                    body: data // Gửi dữ liệu đi
                });

                // Kích hoạt lại nút submit
                submitButton.disabled = false;

                // Lấy phản hồi từ PHP (dưới dạng văn bản)
                const textResponse = await response.text();
                
                // Kiểm tra xem máy chủ có trả về lỗi (ví dụ: 404, 500)
                if (!response.ok) {
                    throw new Error(`Lỗi máy chủ: ${response.status} - ${textResponse}`);
                }
                
                // Máy chủ của bạn (login.php) PHẢI echo "OK" khi thành công
                if (textResponse.trim() === 'OK') {
                    // THÀNH CÔNG: Chuyển trang
                    window.location.href = 'interviewer.html';
                } else {
                    // THẤT BẠI: Hiển thị lỗi mà PHP gửi về
                    interviewerErrorMsg.textContent = textResponse;
                }
                
            } catch (error) {
                // Lỗi mạng, máy chủ sập, hoặc lỗi CORS
                submitButton.disabled = false; // Kích hoạt lại nút
                interviewerErrorMsg.textContent = 'Lỗi kết nối máy chủ. Vui lòng thử lại.';
                console.error('Lỗi khi gọi API đăng nhập:', error);
            }
        });
    }

    // --- 2. Xử lý Form Người tham gia (Participant) (Giữ nguyên) ---
    if (participantForm) {
        participantForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            window.location.href = 'interviewee.html';
        });
    }

});

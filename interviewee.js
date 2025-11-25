document.addEventListener('DOMContentLoaded', async () => {
    
    // ==========================================================
    // (!!!) CẬP NHẬT URL NGROK MỚI CỦA BẠN TẠI ĐÂY (!!!)
    // ==========================================================
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev'; 
    
    // Các Element giao diện
    const loadingMsg = document.getElementById('loading-msg');
    const contentArea = document.getElementById('content-area');
    const userIdDisplay = document.getElementById('user-id-display');
    const interviewName = document.getElementById('interview-name');
    const qCount = document.getElementById('q-count');
    const interviewDesc = document.getElementById('interview-desc');

    try {
        // Gọi API lấy thông tin người dùng và cuộc phỏng vấn
        const response = await fetch(`${NGROK_BASE_URL}/interviewee.php`, {
            method: 'GET',
            headers: { 'ngrok-skip-browser-warning': 'true' },
            credentials: 'include' // Quan trọng: Gửi kèm cookie session
        });

        const data = await response.json();

        if (data.success) {
            // Ẩn thông báo tải, hiện nội dung chính
            loadingMsg.style.display = 'none';
            contentArea.style.display = 'block';

            // Điền dữ liệu vào HTML
            userIdDisplay.textContent = data.data.candidate_id;
            interviewName.textContent = data.data.interview_name;
            qCount.textContent = data.data.question_count;
            
            // Xử lý mô tả (nếu rỗng thì hiện text mặc định)
            if (data.data.description && data.data.description.trim() !== "") {
                interviewDesc.textContent = data.data.description;
            } else {
                interviewDesc.textContent = "(Không có mô tả hướng dẫn thêm)";
                interviewDesc.style.fontStyle = "italic";
                interviewDesc.style.color = "#999";
            }

        } else {
            // Nếu session hết hạn hoặc chưa đăng nhập
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            window.location.href = 'login.html';
        }

    } catch (error) {
        console.error('Lỗi kết nối:', error);
        loadingMsg.innerHTML = `Lỗi kết nối đến máy chủ.<br><br>
        <small style="color:red">Chi tiết: ${error.message}</small><br>
        <small>Hãy kiểm tra lại đường dẫn Ngrok trong file interviewee.js</small>`;
        loadingMsg.style.color = "red";
    }
});

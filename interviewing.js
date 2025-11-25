(async function() {
    
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev';
    let mediaStream;

    // 1. Lấy thông tin người dùng (Để hiển thị tên)
    try {
        const response = await fetch(`${NGROK_BASE_URL}/interviewee.php`, {
            method: 'GET',
            headers: { 'ngrok-skip-browser-warning': 'true' },
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('user-display').textContent = data.data.candidate_id;
            document.getElementById('current-q-content').textContent = "Hãy giới thiệu bản thân bạn? (Câu hỏi mẫu)";
        } else {
            alert("Vui lòng đăng nhập lại.");
            window.location.href = 'login.html';
        }
    } catch (e) {
        console.error("Lỗi kết nối", e);
    }

    // 2. Khởi động Camera (Tượng trưng)
    const video = document.getElementById('video-preview');
    const overlay = document.getElementById('camera-overlay');
    
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        video.srcObject = mediaStream;
        overlay.style.display = 'none'; // Ẩn lớp phủ đen khi cam lên
    } catch (err) {
        overlay.innerHTML = '<p style="color:red">Không thể truy cập Camera!</p>';
        console.error("Lỗi camera:", err);
    }

    // 3. Xử lý nút bấm (Tượng trưng)
    const btnRecord = document.getElementById('btn-record');
    const btnNext = document.getElementById('btn-next');
    const timer = document.getElementById('timer');

    btnRecord.addEventListener('click', () => {
        btnRecord.style.display = 'none';
        btnNext.style.display = 'inline-block';
        timer.textContent = "00:59"; // Giả vờ đếm ngược
        document.getElementById('current-q-title').textContent = "Đang ghi hình...";
    });

    btnNext.addEventListener('click', () => {
        if(confirm("Đây là bản demo giao diện. Bạn có muốn quay về phòng chờ không?")) {
            window.location.href = 'interviewee.html';
        }
    });

})();

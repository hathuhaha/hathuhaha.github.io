// Chạy ngay lập tức khi tài liệu bắt đầu tải
(async function() {
    
    // URL đến "người kiểm tra vé" trên máy chủ
    const CHECK_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev/interviewer.php';

    try {
        const response = await fetch(CHECK_URL, {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true'
            },
            
            // === DÒNG QUAN TRỌNG NHẤT ===
            // Bắt buộc trình duyệt gửi cookie (PHPSESSID) 
            // đến domain Ngrok
            credentials: 'include' 
        });

        if (!response.ok) {
            throw new Error('Server error');
        }

        const data = await response.json();

        if (data.success === true) {
            // ĐÃ ĐĂNG NHẬP:
            console.log('Chào mừng, ' + data.username);
            
            // Điền tên user vào trang
            document.addEventListener('DOMContentLoaded', () => {
                const userDisplay = document.getElementById('username-display');
                if (userDisplay) {
                    userDisplay.textContent = data.username;
                }
            });

        } else {
            // CHƯA ĐĂNG NHẬP: Ném về trang login
            console.log('Chưa đăng nhập, đang chuyển hướng...');
            window.location.href = 'login.html';
        }

    } catch (error) {
        // Lỗi (mất mạng, server sập, lỗi CORS)
        console.error('Lỗi xác thực:', error);
        // Ném về trang login cho an toàn
        window.location.href = 'login.html';
    }

})(); // Chạy hàm này ngay lập tức
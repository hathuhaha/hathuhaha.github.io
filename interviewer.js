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
            
            // Bắt buộc trình duyệt gửi cookie (PHPSESSID)
            credentials: 'include' 
        });

        if (!response.ok) {
            throw new Error('Server error');
        }

        const data = await response.json();

        if (data.success === true) {
            // ĐÃ ĐĂNG NHẬP:
            console.log('Chào mừng, ' + data.username);
            
            // === ĐÃ SỬA LẠI ===
            // Chỉ điền Tên tài khoản (username)
            // (Vì file PHP đơn giản không gửi Tên, Ngày sinh)
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

})(); // Chạy hàm "gác cổng" này ngay lập tức

//
// === ĐÃ XÓA ===
// Toàn bộ logic "profileForm.addEventListener('submit', ...)"
// đã được xóa, vì chúng ta chưa xử lý phần cập nhật.
//

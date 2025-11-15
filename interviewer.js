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
            // Nếu server trả về lỗi 404, 500, v.v.
            throw new Error('Server trả về lỗi: ' + response.status);
        }

        const data = await response.json();

        if (data.success === true) {
            // =========================================================
            // === SỬA LỖI RACE CONDITION LÀ Ở ĐÂY ===
            // 
            // Vấn đề: Script này chạy trong <head> trước khi DOM sẵn sàng.
            // Chúng ta cần một cách an toàn để cập nhật DOM.
            //
            // Giải pháp: Kiểm tra xem DOM đã tải xong chưa.
            // 1. Nếu chưa (loading), thì đợi sự kiện DOMContentLoaded.
            // 2. Nếu rồi (interactive/complete), thì cập nhật ngay.
            // =========================================================
            
            console.log('Chào mừng, ' + data.username);
            
            const updateUsername = () => {
                const userDisplay = document.getElementById('username-display');
                if (userDisplay) {
                    userDisplay.textContent = data.username;
                }
            };

            if (document.readyState === 'loading') {
                // DOM chưa sẵn sàng, chờ...
                document.addEventListener('DOMContentLoaded', updateUsername);
            } else {
                // DOM đã sẵn sàng, cập nhật ngay
                updateUsername();
            }

        } else {
            // CHƯA ĐĂNG NHẬP: Ném về trang login
            console.log('Chưa đăng nhập (hoặc session bị mất), đang chuyển hướng...');
            window.location.href = 'login.html';
        }

    } catch (error) {
        // Lỗi (mất mạng, server sập, lỗi CORS, hoặc response không phải JSON)
        console.error('Lỗi xác thực nghiêm trọng:', error);
        // Ném về trang login cho an toàn
        window.location.href = 'login.html';
    }

})(); // Chạy hàm "gác cổng" này ngay lập tức

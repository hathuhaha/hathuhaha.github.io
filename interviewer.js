// Script này chạy ngay lập tức (IIFE)
(async function() {
    
    // URL đến "người kiểm tra vé" trên máy chủ
    const CHECK_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev/interviewer.php';

    try {
        // 1. KIỂM TRA PHIÊN ĐĂNG NHẬP (Gác cổng)
        const response = await fetch(CHECK_URL, {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true'
            },
            credentials: 'include' // Bắt buộc gửi cookie (PHPSESSID)
        });

        if (!response.ok) {
            throw new Error('Server trả về lỗi: ' + response.status);
        }

        const data = await response.json();

        // 2. XỬ LÝ KẾT QUẢ
        if (data.success === true) {
            // ĐÃ ĐĂNG NHẬP THÀNH CÔNG
            console.log('Chào mừng, ' + data.username);
            
            // Hàm này sẽ chạy khi DOM sẵn sàng
            const setupInterviewerPage = () => {
                
                // Tác vụ A: Cập nhật tên người dùng
                const userDisplay = document.getElementById('username-display');
                if (userDisplay) {
                    userDisplay.textContent = data.username;
                }

                // Tác vụ B: Gắn logic 'fetch' cho nút Đăng xuất
                const logoutButton = document.getElementById('logout-button');
                if (logoutButton) {
                    logoutButton.addEventListener('click', async () => {
                        
                        console.log('Nút đăng xuất đã được nhấp. Đang gọi fetch...');
                        const LOGOUT_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev/logout.php';
                        
                        try {
                            logoutButton.disabled = true;
                            logoutButton.textContent = "Đang đăng xuất...";

                            // Gọi "ngầm" đến logout.php với header bỏ qua cảnh báo
                            await fetch(LOGOUT_URL, {
                                method: 'GET',
                                headers: {
                                    'ngrok-skip-browser-warning': 'true'
                                },
                                credentials: 'include' // Gửi cookie để server biết ai logout
                            });

                            // Sau khi fetch (dù thành công hay lỗi),
                            // luôn đưa người dùng về trang login.
                            window.location.href = 'login.html';

                        } catch (error) {
                            console.error('Lỗi khi đăng xuất:', error);
                            window.location.href = 'login.html'; // Vẫn đưa về login
                        }
                    });
                }
            };

            // Chờ DOM sẵn sàng rồi mới chạy 2 tác vụ A và B
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

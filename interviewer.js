// Script này chạy ngay lập tức (IIFE)
(async function() {
    
    // (!!!) THAY ĐỔI ĐỊA CHỈ NGROK CỦA BẠN TẠI ĐÂY (!!!)
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev';

    try {
        // 1. KIỂM TRA PHIÊN ĐĂNG NHẬP (Gác cổng)
        const response = await fetch(`${NGROK_BASE_URL}/interviewer.php`, {
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
            
            // === LOGIC MỚI ĐỂ ĐIỀN THÔNG TIN ===
            const setupInterviewerPage = () => {
                
                // Tác vụ A: Cập nhật lời chào ở nội dung chính
                const userDisplay = document.getElementById('username-display');
                if (userDisplay) {
                    userDisplay.textContent = data.username;
                }

                // Tác vụ B: Điền thông tin vào cột bên trái (sidebar)
                const infoUsername = document.getElementById('info-username');
                if (infoUsername) {
                    infoUsername.textContent = data.username;
                }

                const infoFullname = document.getElementById('info-fullname');
                if (infoFullname) {
                    infoFullname.textContent = data.fullname || 'Chưa cập nhật';
                }

                const infoDob = document.getElementById('info-dob');
                if (infoDob) {
                    infoDob.textContent = data.dob || 'Chưa cập nhật';
                }


                // Tác vụ C: Gắn logic 'fetch' cho nút Đăng xuất (Như cũ)
                const logoutButton = document.getElementById('logout-button');
                if (logoutButton) {
                    logoutButton.addEventListener('click', async () => {
                        
                        console.log('Nút đăng xuất đã được nhấp. Đang gọi fetch...');
                        
                        try {
                            logoutButton.disabled = true;
                            logoutButton.textContent = "Đang đăng xuất...";

                            await fetch(`${NGROK_BASE_URL}/logout.php`, {
                                method: 'GET',
                                headers: {
                                    'ngrok-skip-browser-warning': 'true'
                                },
                                credentials: 'include' 
                            });

                            window.location.href = 'login.html';

                        } catch (error) {
                            console.error('Lỗi khi đăng xuất:', error);
                            window.location.href = 'login.html'; 
                        }
                    });
                }
            };

            // Chờ DOM sẵn sàng rồi mới chạy các tác vụ
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

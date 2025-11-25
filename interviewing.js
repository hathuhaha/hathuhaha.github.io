(async function() {
    
    // (!!!) CẤU HÌNH ĐƯỜNG DẪN NGROK (!!!)
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev'; 
    const UPLOAD_ENDPOINT = `${NGROK_BASE_URL}/upload.php`; // File này phải có trên server

    // Biến toàn cục
    let mediaStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let questionsData = []; // Chứa {id, content, timeLimit}
    let currentQIndex = 0;
    let countdownInterval = null;

    // Elements
    const testScreen = document.getElementById('test-screen');
    const interviewLayout = document.getElementById('interview-layout');
    const testVideo = document.getElementById('test-video');
    const mainVideo = document.getElementById('main-video');
    const btnStart = document.getElementById('btn-start-interview');
    const testStatus = document.getElementById('test-status');

    // UI Interview
    const qListUI = document.getElementById('q-list-ui');
    const qTitle = document.getElementById('q-title');
    const qContent = document.getElementById('q-content');
    const timerDisplay = document.getElementById('timer');
    const btnFinishQ = document.getElementById('btn-finish-q');
    const btnNextQ = document.getElementById('btn-next-q');
    const uploadOverlay = document.getElementById('upload-overlay');

    // =========================================================
    // 1. KHỞI TẠO: LẤY DỮ LIỆU & TEST CAMERA
    // =========================================================
    
    async function init() {
        // 1.1 Gọi Backend lấy danh sách câu hỏi và Time Limit
        try {
            const res = await fetch(`${NGROK_BASE_URL}/interviewee.php?action=get_questions`, {
                headers: {'ngrok-skip-browser-warning':'true'}, 
                credentials: 'include'
            });
            const data = await res.json();
            
            if(!data.success) {
                alert("Lỗi: " + (data.message || "Chưa đăng nhập"));
                window.location.href = 'login.html';
                return;
            }

            questionsData = data.questions;
            document.getElementById('user-display').textContent = data.candidate_id;
            
            // Vẽ danh sách câu hỏi bên trái
            renderSidebar();

        } catch (e) {
            testStatus.textContent = "Lỗi kết nối Server: " + e.message;
            return;
        }

        // 1.2 Xin quyền Camera
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            testVideo.srcObject = mediaStream;
            mainVideo.srcObject = mediaStream; // Gắn sẵn cho màn hình chính
            
            testStatus.textContent = "✅ Camera sẵn sàng. Bạn có thể bắt đầu.";
            testStatus.style.color = "green";
            btnStart.disabled = false;

        } catch (err) {
            testStatus.textContent = "❌ Không thể truy cập Camera. Hãy cấp quyền và tải lại trang.";
            console.error(err);
        }
    }

    // Sự kiện nút BẮT ĐẦU
    btnStart.addEventListener('click', () => {
        if(questionsData.length === 0) {
            alert("Không có câu hỏi nào!"); return;
        }
        testScreen.style.display = 'none';
        interviewLayout.style.display = 'flex';
        
        // Vào câu hỏi đầu tiên
        startQuestion(0);
    });

    // =========================================================
    // 2. LOGIC PHỎNG VẤN (TUẦN TỰ)
    // =========================================================

    function startQuestion(index) {
        if (index >= questionsData.length) {
            finishInterview();
            return;
        }

        currentQIndex = index;
        const qData = questionsData[index];

        // Reset UI
        btnFinishQ.style.display = 'inline-block';
        btnFinishQ.disabled = false;
        btnNextQ.style.display = 'none';
        uploadOverlay.style.display = 'none';
        
        // Hiển thị nội dung
        qTitle.textContent = `Câu hỏi số ${qData.id}`;
        qContent.textContent = qData.content;
        updateSidebarActive(qData.id);

        // Bắt đầu ghi hình với Thời gian lấy từ file time_limit.txt
        // (Backend đã trả về con số này trong qData.timeLimit)
        startRecording(qData.timeLimit);
    }

    function startRecording(seconds) {
        recordedChunks = [];
        try {
            // Khởi tạo Recorder
            mediaRecorder = new MediaRecorder(mediaStream);
        } catch (e) { alert("Trình duyệt lỗi MediaRecorder"); return; }

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };

        // Khi dừng ghi -> Tự động Upload
        mediaRecorder.onstop = async () => {
            await uploadVideo();
        };

        mediaRecorder.start();
        
        // Bắt đầu đếm ngược
        startTimer(seconds);
    }

    // Xử lý nút "Nộp bài ngay"
    btnFinishQ.addEventListener('click', () => {
        forceStop();
    });

    // Hàm dừng cưỡng bức (do hết giờ hoặc bấm nút)
    function forceStop() {
        if(countdownInterval) clearInterval(countdownInterval);
        btnFinishQ.disabled = true; // Chống spam click
        
        if(mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop(); // Sẽ kích hoạt onstop -> uploadVideo
        }
    }

    // =========================================================
    // 3. LOGIC UPLOAD
    // =========================================================

    async function uploadVideo() {
        uploadOverlay.style.display = 'flex'; // Hiện màn che
        
        const qData = questionsData[currentQIndex];
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const formData = new FormData();
        
        // Tạo ID submission
        const submissionId = `sub_${Date.now()}`;
        formData.append("submission_id", submissionId);
        formData.append("question_id", qData.id); // Gửi ID câu hỏi để lưu đúng chỗ
        formData.append("file_from_client", blob, "video.webm");

        try {
            const res = await fetch(UPLOAD_ENDPOINT, {
                method: 'POST',
                body: formData,
                headers: { 'ngrok-skip-browser-warning': 'true' },
                credentials: 'include'
            });
            const text = await res.text();

            if(!text.startsWith("Success") && !res.ok) throw new Error(text);

            // Nộp thành công
            markSidebarDone(qData.id);
            
            // Ẩn nút nộp, hiện nút Next (hoặc tự chuyển nếu muốn)
            // Ở đây tôi để nút Next cho người dùng thở 1 chút
            uploadOverlay.innerHTML = `<h3 style="color:#007bff">✅ Đã nộp câu ${qData.id}</h3>`;
            
            setTimeout(() => {
                uploadOverlay.style.display = 'none';
                btnFinishQ.style.display = 'none';
                
                if (currentQIndex < questionsData.length - 1) {
                    btnNextQ.style.display = 'inline-block';
                } else {
                    finishInterview();
                }
            }, 1000);

        } catch (err) {
            console.error(err);
            uploadOverlay.innerHTML = `<h3 style="color:red">Lỗi nộp bài!</h3><p>${err.message}</p><button onclick="location.reload()">Thử lại</button>`;
        }
    }

    // Nút Next
    btnNextQ.addEventListener('click', () => {
        // Khôi phục lại nội dung loading cho lần sau
        uploadOverlay.innerHTML = '<div class="loader"></div><h3>Đang nộp bài...</h3>';
        startQuestion(currentQIndex + 1);
    });

    function finishInterview() {
        interviewLayout.innerHTML = `
            <div style="text-align:center; padding:50px;">
                <h1 style="color:green; font-size:3rem;">🎉</h1>
                <h2 style="color:green">Phỏng vấn hoàn tất!</h2>
                <p>Cảm ơn bạn đã tham gia. Dữ liệu đã được lưu trữ an toàn.</p>
                <button onclick="window.close()" class="login-button" style="width:auto; margin-top:20px;">Đóng cửa sổ</button>
            </div>
        `;
        // Tắt camera
        if(mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    }

    // =========================================================
    // 4. TIỆN ÍCH (TIMER, SIDEBAR)
    // =========================================================

    function startTimer(seconds) {
        let remaining = seconds;
        updateTimerDisplay(remaining);
        
        if(countdownInterval) clearInterval(countdownInterval);
        
        countdownInterval = setInterval(() => {
            remaining--;
            updateTimerDisplay(remaining);
            
            if(remaining <= 0) {
                clearInterval(countdownInterval);
                forceStop(); // Hết giờ -> Tự nộp
            }
        }, 1000);
    }

    function updateTimerDisplay(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        timerDisplay.textContent = `${m<10?'0'+m:m}:${sec<10?'0'+sec:sec}`;
        // Đổi màu đỏ khi còn dưới 10s
        timerDisplay.style.background = s < 10 ? 'rgba(255,0,0,0.9)' : 'rgba(0,0,0,0.6)';
    }

    function renderSidebar() {
        qListUI.innerHTML = '';
        questionsData.forEach(q => {
            const li = document.createElement('li');
            li.className = 'q-item';
            li.id = `sidebar-q-${q.id}`;
            li.textContent = `Câu ${q.id}`;
            qListUI.appendChild(li);
        });
    }

    function updateSidebarActive(id) {
        document.querySelectorAll('.q-item').forEach(el => el.classList.remove('active'));
        const item = document.getElementById(`sidebar-q-${id}`);
        if(item) item.classList.add('active');
    }

    function markSidebarDone(id) {
        const item = document.getElementById(`sidebar-q-${id}`);
        if(item) {
            item.classList.remove('active');
            item.classList.add('done');
            item.textContent = `Câu ${id} (Xong)`;
        }
    }

    // Chạy
    init();

})();

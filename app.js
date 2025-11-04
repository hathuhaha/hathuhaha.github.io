// --- Lấy các element từ HTML ---
const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
const videoPreview = document.getElementById('videoPreview');
const resultArea = document.getElementById('resultArea');

// --- CẤU HÌNH QUAN TRỌNG ---
// (!!!) THÊM LẠI DÒNG NÀY (!!!)
// Thay bằng địa chỉ ngrok TĨNH của bạn
const BACKEND_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev/upload.php'; 

// --- Các biến toàn cục ---
let mediaRecorder;
let recordedChunks = [];
let mediaStream;

// =================================================================
// BƯỚC 1: TỰ ĐỘNG BẬT CAMERA KHI TẢI TRANG
// =================================================================
async function initCamera() {
    try {
        resultArea.textContent = "Đang xin quyền camera...";
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        // Hiển thị stream từ webcam lên thẻ <video>
        videoPreview.srcObject = mediaStream;
        resultArea.textContent = "Camera đã sẵn sàng. Nhấn 'Bắt đầu' để ghi.";
        
    } catch (err) {
        console.error("Lỗi khi bật webcam: ", err);
        resultArea.textContent = "Lỗi: Bạn phải cho phép truy cập webcam và micro.";
    }
}

// Gọi hàm initCamera() ngay khi trang được tải
initCamera();

// =================================================================
// BƯỚC 2: KHI NGƯỜI DÙNG CLICK NÚT "Bắt đầu Ghi"
// =================================================================
recordButton.addEventListener('click', () => {
    // Kiểm tra xem camera đã sẵn sàng chưa
    if (!mediaStream) {
        alert("Camera chưa sẵn sàng. Vui lòng cấp quyền camera và tải lại trang.");
        return;
    }

    try {
        recordedChunks = []; // Xóa các bản ghi cũ
        mediaRecorder = new MediaRecorder(mediaStream);

        // Khi có dữ liệu video, đẩy nó vào mảng
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        // =============================================================
        // *** BƯỚC 3: (THAY ĐỔI LỚN Ở ĐÂY) KHI DỪNG GHI ***
        // =============================================================
        mediaRecorder.onstop = () => {
            // Tạo một Blob (đối tượng file) từ các đoạn video đã ghi
            const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
            
            // -----------------------------------------------------
            // (!!!) THAY ĐỔI: GỌI HÀM UPLOAD (THAY VÌ DOWNLOAD) (!!!)
            // -----------------------------------------------------
            submitVideo(videoBlob);
            
            // Dừng stream (tắt đèn camera)
            mediaStream.getTracks().forEach(track => track.stop());
            videoPreview.srcObject = null;
        };

        // Bắt đầu ghi
        mediaRecorder.start();

        // Cập nhật giao diện
        resultArea.textContent = "🔴 Đang ghi hình...";
        recordButton.disabled = true;
        stopButton.disabled = false;

    } catch (err) {
        console.error("Lỗi khi bắt đầu record: ", err);
        resultArea.textContent = "Lỗi khi bắt đầu ghi hình.";
    }
});

// =================================================================
// BƯỚC 4: KHI NGƯỜI DÙNG CLICK NÚT "Dừng và Nộp bài"
// =================================================================
stopButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop(); // Lệnh này sẽ kích hoạt sự kiện 'onstop' ở trên

        // Cập nhật giao diện
        // (!!!) THAY ĐỔI TEXT (!!!)
        resultArea.textContent = "Đã dừng ghi. Đang xử lý và nộp bài...";
        recordButton.disabled = true;
        stopButton.disabled = true;
    }
});

// =================================================================
// (!!!) BƯỚC 5: THÊM LẠI HÀM UPLOAD (!!!)
// =================================================================
async function submitVideo(videoBlob) {
    
    // Tạo một ID duy nhất cho lần nộp bài này (để chống trùng lặp)
    const submissionId = crypto.randomUUID();

    // Tạo "gói hàng" FormData
    let formData = new FormData();
    formData.append("submission_id", submissionId);
    formData.append("file_from_client", videoBlob, "phong_van.webm");

    resultArea.textContent = "Đang tải tệp lên máy chủ... Vui lòng không tắt trang.";

    try {
        // Gửi tệp đến backend (qua tunnel ngrok)
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            body: formData, 
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        });
            

        // Nhận phản hồi (chính là Video ID) từ PHP
        const result_text = await response.text();

        // Kiểm tra xem PHP có trả về lỗi không
        if (result_text.startsWith("Error:")) {
            throw new Error(result_text);
        }
        
        // Thành công! 'result_text' chính là Video ID
        const videoId = result_text;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Hiển thị kết quả cho người dùng
        resultArea.innerHTML = `
            <h3>Nộp bài thành công!</h3>
            <p>Cảm ơn bạn đã hoàn thành phỏng vấn.</p>
            <p>Bạn có thể xem lại bài của mình tại (có thể mất vài phút):</p>
            <a href="${videoUrl}" target="_blank">${videoUrl}</a>
        `;
        // Kích hoạt lại nút record để nộp bài khác (nếu muốn)
        recordButton.disabled = false;
        recordButton.textContent = "Ghi lại bài khác";

    } catch (error) {
        console.error('Lỗi khi nộp bài:', error);
        resultArea.textContent = `Lỗi nghiêm trọng: ${error.message}. Vui lòng thử lại.`;
        // Cho phép thử lại
        recordButton.disabled = false;
        recordButton.textContent = "Thử lại";
        stopButton.disabled = true;
    }
}
// (Lưu ý: Đảm bảo không có dấu '}' thừa ở cuối file này)
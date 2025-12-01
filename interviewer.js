// C:\Networking - Project\WebDesign\interviewer.js

    function showDetail(q) {
        activeQ = q.id;
        document.getElementById('detail-q-text').textContent = q.question;
        document.getElementById('detail-score').value = q.score;
        document.getElementById('detail-reason').value = ''; 
        document.getElementById('detail-history').textContent = q.history || '(Chưa có lịch sử)';
        
        const vid = document.getElementById('video-container');

        // HIỂN THỊ DRIVE VIDEO
        if (q.drive_id) {
            vid.innerHTML = `
                <iframe 
                    src="https://drive.google.com/file/d/${q.drive_id}/preview" 
                    width="100%" 
                    height="100%" 
                    style="border:none; border-radius:8px;" 
                    allow="autoplay" 
                    allowfullscreen>
                </iframe>`;
        } else {
            vid.innerHTML = '<div style="padding:20px;text-align:center;color:#888">Chưa có video nộp.</div>';
        }
        
        // Highlight câu hỏi đang chọn
        document.querySelectorAll('.grading-question-item').forEach(el => el.classList.remove('active'));
        document.querySelector(`.grading-question-item[data-id="${q.id}"]`)?.classList.add('active');
    }

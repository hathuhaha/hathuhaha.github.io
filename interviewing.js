(async function() {
    
    // (!!!) NGROK URL CONFIGURATION (!!!)
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev'; 
    const UPLOAD_ENDPOINT = `${NGROK_BASE_URL}/upload.php`;

    // Global Variables
    let mediaStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let questionsData = []; 
    let currentQIndex = 0;
    let countdownInterval = null;

    // Elements
    const testScreen = document.getElementById('test-screen');
    const interviewLayout = document.getElementById('interview-layout');
    const testVideo = document.getElementById('test-video');
    const mainVideo = document.getElementById('main-video');
    const btnStart = document.getElementById('btn-start-interview');
    const testStatus = document.getElementById('test-status');

    // UI Interview Elements
    const qListUI = document.getElementById('q-list-ui');
    const qTitle = document.getElementById('q-title');
    const qContent = document.getElementById('q-content');
    const timerDisplay = document.getElementById('timer');
    const btnFinishQ = document.getElementById('btn-finish-q');
    const btnNextQ = document.getElementById('btn-next-q');
    const uploadOverlay = document.getElementById('upload-overlay');

    // =========================================================
    // 1. INITIALIZATION
    // =========================================================
    
    async function init() {
        try {
            const res = await fetch(`${NGROK_BASE_URL}/interviewee.php?action=get_questions`, {
                headers: {'ngrok-skip-browser-warning':'true'}, 
                credentials: 'include'
            });
            const data = await res.json();
            
            if(!data.success) {
                alert("Error: " + (data.message || "Not logged in"));
                window.location.href = 'login.html';
                return;
            }

            questionsData = data.questions;
            document.getElementById('user-display').textContent = data.candidate_id;
            
            // Render question list sidebar
            renderSidebar();

        } catch (e) {
            testStatus.textContent = "Server Connection Error: " + e.message;
            return;
        }

        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            testVideo.srcObject = mediaStream;
            mainVideo.srcObject = mediaStream; 
            
            testStatus.textContent = "✅ Camera ready. You can start now.";
            testStatus.style.color = "green";
            btnStart.disabled = false;

        } catch (err) {
            testStatus.textContent = "❌ Cannot access Camera. Please grant permission and reload.";
            console.error(err);
        }
    }

    // START BUTTON
    btnStart.addEventListener('click', () => {
        if(questionsData.length === 0) {
            alert("No questions found!"); return;
        }
        testScreen.style.display = 'none';
        interviewLayout.style.display = 'flex';
        
        // [NEW] Automatically find the first UNFINISHED question
        let firstUnfinished = questionsData.findIndex(q => !q.is_submitted);
        
        if (firstUnfinished === -1) {
            // All done
            // Mark all as green
            questionsData.forEach(q => markSidebarDone(q.id));
            finishInterview();
        } else {
            // Mark previous questions as done
            for(let i=0; i < firstUnfinished; i++) {
                markSidebarDone(questionsData[i].id);
            }
            // Start from the unfinished question
            startQuestion(firstUnfinished);
        }
    });

    // =========================================================
    // 2. INTERVIEW LOGIC
    // =========================================================

    function startQuestion(index) {
        if (index >= questionsData.length) {
            finishInterview();
            return;
        }

        const qData = questionsData[index];

        // [NEW] CHECK IF ALREADY SUBMITTED, THEN SKIP
        if (qData.is_submitted) {
            markSidebarDone(qData.id);
            // Recursive call to next question
            startQuestion(index + 1);
            return;
        }

        currentQIndex = index;

        // Reset UI
        btnFinishQ.style.display = 'inline-block';
        btnFinishQ.disabled = false;
        btnNextQ.style.display = 'none';
        uploadOverlay.style.display = 'none';
        
        qTitle.textContent = `Question ${qData.id}`;
        qContent.textContent = qData.content;
        updateSidebarActive(qData.id);

        startRecording(qData.timeLimit);
    }

    function startRecording(seconds) {
        recordedChunks = [];
        try {
            mediaRecorder = new MediaRecorder(mediaStream);
        } catch (e) { alert("Browser MediaRecorder Error"); return; }

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            await uploadVideo();
        };

        mediaRecorder.start();
        startTimer(seconds);
    }

    btnFinishQ.addEventListener('click', () => {
        forceStop();
    });

    function forceStop() {
        if(countdownInterval) clearInterval(countdownInterval);
        btnFinishQ.disabled = true; 
        if(mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop(); 
        }
    }

    // =========================================================
    // 3. UPLOAD LOGIC
    // =========================================================

    async function uploadVideo() {
        uploadOverlay.style.display = 'flex'; 
        
        const qData = questionsData[currentQIndex];
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const formData = new FormData();
        
        const submissionId = `sub_${Date.now()}`;
        formData.append("submission_id", submissionId);
        formData.append("question_id", qData.id); 
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

            markSidebarDone(qData.id);
            
            // Update local status to prevent re-taking
            questionsData[currentQIndex].is_submitted = true;

            uploadOverlay.innerHTML = `<h3 style="color:#007bff">✅ Question ${qData.id} Submitted</h3>`;
            
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
            // Check for specific backend error messages (Vietnamese or English)
            if (err.message.includes("đã nộp") || err.message.includes("submitted")) {
                 alert("System recorded this as already submitted. Moving to next question.");
                 questionsData[currentQIndex].is_submitted = true;
                 startQuestion(currentQIndex + 1);
            } else {
                uploadOverlay.innerHTML = `<h3 style="color:red">Upload Error!</h3><p>${err.message}</p><button onclick="location.reload()">Retry</button>`;
            }
        }
    }

    btnNextQ.addEventListener('click', () => {
        uploadOverlay.innerHTML = '<div class="loader"></div><h3>Submitting...</h3>';
        startQuestion(currentQIndex + 1);
    });

    function finishInterview() {
        interviewLayout.innerHTML = `
            <div style="text-align:center; padding:50px;">
                <h1 style="color:green; font-size:3rem;">🎉</h1>
                <h2 style="color:green">Interview Completed!</h2>
                <p>Thank you for participating. Your data has been securely saved.</p>
                <button onclick="window.close()" class="login-button" style="width:auto; margin-top:20px;">Close Window</button>
            </div>
        `;
        if(mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    }

    // =========================================================
    // 4. UTILITIES
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
                forceStop();
            }
        }, 1000);
    }

    function updateTimerDisplay(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        timerDisplay.textContent = `${m<10?'0'+m:m}:${sec<10?'0'+sec:sec}`;
        timerDisplay.style.background = s < 10 ? 'rgba(255,0,0,0.9)' : 'rgba(0,0,0,0.6)';
    }

    function renderSidebar() {
        qListUI.innerHTML = '';
        questionsData.forEach(q => {
            const li = document.createElement('li');
            li.className = 'q-item';
            li.id = `sidebar-q-${q.id}`;
            li.textContent = `Question ${q.id}`;
            // If already submitted, mark as done immediately
            if(q.is_submitted) {
                li.classList.add('done');
                li.textContent += ' (Done)';
            }
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
            if(!item.textContent.includes('(Done)')) item.textContent += ' (Done)';
        }
    }

    init();

})();

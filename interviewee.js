document.addEventListener('DOMContentLoaded', async () => {
    
    // ==========================================================
    // (!!!) UPDATE YOUR NEW NGROK URL HERE (!!!)
    // ==========================================================
    const NGROK_BASE_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev'; 
    
    // UI Elements
    const loadingMsg = document.getElementById('loading-msg');
    const contentArea = document.getElementById('content-area');
    const userIdDisplay = document.getElementById('user-id-display');
    const interviewName = document.getElementById('interview-name');
    const qCount = document.getElementById('q-count');
    const interviewDesc = document.getElementById('interview-desc');

    try {
        // Call API to get user and interview info
        const response = await fetch(`${NGROK_BASE_URL}/interviewee.php`, {
            method: 'GET',
            headers: { 'ngrok-skip-browser-warning': 'true' },
            credentials: 'include' // Important: Send session cookies
        });

        const data = await response.json();

        if (data.success) {
            // Hide loading message, show main content
            loadingMsg.style.display = 'none';
            contentArea.style.display = 'block';

            // Populate HTML with data
            userIdDisplay.textContent = data.data.candidate_id;
            interviewName.textContent = data.data.interview_name;
            qCount.textContent = data.data.question_count;
            
            // Handle description (show default text if empty)
            if (data.data.description && data.data.description.trim() !== "") {
                interviewDesc.textContent = data.data.description;
            } else {
                interviewDesc.textContent = "(No additional instructions provided)";
                interviewDesc.style.fontStyle = "italic";
                interviewDesc.style.color = "#999";
            }

        } else {
            // If session expired or not logged in
            alert('Session expired. Please login again.');
            window.location.href = 'login.html';
        }

    } catch (error) {
        console.error('Connection error:', error);
        loadingMsg.innerHTML = `Connection error to server.<br><br>
        <small style="color:red">Detail: ${error.message}</small><br>
        <small>Please check the Ngrok URL in interviewee.js</small>`;
        loadingMsg.style.color = "red";
    }
});

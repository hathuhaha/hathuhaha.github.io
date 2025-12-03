document.addEventListener('DOMContentLoaded', function() {
    
    // (!!!) NGROK CONFIGURATION (!!!)
    const INTERVIEWER_LOGIN_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev/login.php';
    const PARTICIPANT_LOGIN_URL = 'https://nondistinguished-contemplable-della.ngrok-free.dev/interviewee.php'; 

    // ===============================================
    // PART 1: TAB SWITCHING LOGIC
    // ===============================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const formContents = document.querySelectorAll('.form-content');
    const interviewerErrorMsg = document.getElementById('interviewer-error-message');
    const participantErrorMsg = document.getElementById('participant-error-message');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const formName = button.getAttribute('data-form');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            formContents.forEach(form => form.classList.remove('active'));
            
            const activeForm = document.getElementById('form-' + formName);
            if (activeForm) activeForm.classList.add('active');

            if (interviewerErrorMsg) interviewerErrorMsg.textContent = '';
            if (participantErrorMsg) participantErrorMsg.textContent = '';
        });
    });

    // ==========================================================
    // PART 2: FORM SUBMISSION LOGIC
    // ==========================================================

    const interviewerForm = document.getElementById('form-interviewer');
    const participantForm = document.getElementById('form-participant');
    
    // --- 1. Handle Recruiter (Interviewer) Form ---
    if (interviewerForm) {
        interviewerForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            if (interviewerErrorMsg) interviewerErrorMsg.textContent = ''; 

            const username = document.getElementById('interviewer-username').value;
            const password = document.getElementById('interviewer-password').value;
            const submitButton = interviewerForm.querySelector('button[type="submit"]');

            try {
                if (interviewerErrorMsg) interviewerErrorMsg.textContent = 'Verifying...';
                submitButton.disabled = true;

                const data = new URLSearchParams();
                data.append('username', username);
                data.append('password', password);

                const response = await fetch(INTERVIEWER_LOGIN_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'ngrok-skip-browser-warning': 'true' 
                    },
                    credentials: 'include',
                    body: data
                });

                submitButton.disabled = false;
                const textResponse = await response.text();
                
                if (response.ok && textResponse.trim() === 'OK') {
                    window.location.href = 'interviewer.html';
                } else {
                    if (interviewerErrorMsg) {
                        interviewerErrorMsg.textContent = textResponse.trim() || 'Unknown error.';
                    }
                }
            } catch (error) {
                submitButton.disabled = false;
                if (interviewerErrorMsg) {
                    interviewerErrorMsg.textContent = 'Login failed. Please try again.';
                }
                console.error('Error calling interviewer login API:', error);
            }
        });
    }

    // --- 2. Handle Candidate (Participant) Form ---
    if (participantForm) {
        participantForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            if (participantErrorMsg) participantErrorMsg.textContent = ''; 

            const username = document.getElementById('participant-username').value;
            const join_code = document.getElementById('participant-join-code').value;
            const submitButton = participantForm.querySelector('button[type="submit"]');
            
            try {
                if (participantErrorMsg) participantErrorMsg.textContent = 'Verifying...';
                submitButton.disabled = true;

                const data = new URLSearchParams();
                data.append('username', username);
                data.append('join_code', join_code);

                const response = await fetch(PARTICIPANT_LOGIN_URL, { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'ngrok-skip-browser-warning': 'true' 
                    },
                    credentials: 'include', 
                    body: data
                });

                submitButton.disabled = false;
                const textResponse = await response.text();
                
                if (response.ok && textResponse.trim() === 'OK') {
                    // Redirect to waiting room
                    window.location.href = 'interviewee.html';
                } else {
                    if (participantErrorMsg) {
                        participantErrorMsg.textContent = textResponse.trim() || 'Incorrect Username or Access Code.';
                    }
                }
                
            } catch (error) {
                submitButton.disabled = false;
                if (participantErrorMsg) {
                    participantErrorMsg.textContent = 'Login failed. Please try again.';
                }
                console.error('Error calling participant login API:', error);
            }
        });
    }

    // ==========================================================
    // PART 3: TOGGLE PASSWORD VISIBILITY
    // ==========================================================
    
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('interviewer-password'); 
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            if (type === 'password') {
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            } else {
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            }
        });
    }
});

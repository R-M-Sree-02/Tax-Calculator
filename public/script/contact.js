console.log("Hello from contact");


document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('contactMessage');
    const feedback = document.getElementById('message').value.trim();

    if (!feedback || feedback.length < 10) {
        msg.innerText = 'Feedback must be atleast Ten characters';
        msg.className = 'error-msg';
        return;
    }

    try {
        const response = await fetch('/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback })
        });

        const result = await response.json();
        if (response.ok) {
            msg.innerText = result.message;
            msg.className = 'correct-msg';
            document.getElementById('contactForm').reset();
        } else {
            msg.innerText = result.message;
            msg.className = 'error-msg';
        }
    } catch (err) {
        console.error('Feedback error:', err);
        msg.innerText = 'Submission failed. Try again.';
        msg.className = 'error-msg'
    }
});
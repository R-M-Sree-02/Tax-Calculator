$('#login').on('submit', async function (e) {
     e.preventDefault();
     const userEmail = $('#loginEmail').val();
     const password = $('#loginPassword').val();
     const loginStatus = $("#loginStatus");
     console.log('Sending:', userEmail, password);

     try {
          const response = await fetch('/login', {
               method: 'POST',
               credentials: 'include',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ userEmail, password })
          });
          console.log('Response status:', response.status);
          const data = await response.json();
          console.log('Data:', data);
          if (data.message === 'Login Successfully') {
               loginStatus.removeClass('error-msg');
               loginStatus.addClass('correct-msg');
               loginStatus.text(data.message);

               window.location.href = '/';
          } else {
               loginStatus.removeClass('correct-msg');
               loginStatus.addClass('error-msg');
               loginStatus.text(data.message);
          }
     } catch (err) {
          console.error(err);
          loginStatus.removeClass('correct-msg');
          loginStatus.addClass('error-msg');
          loginStatus.text(err);
     }
});

$('#signup').on('submit', async function (e) {
     e.preventDefault();
     const userName = $('#userName').val().trim();
     const userEmail = $('#userEmail').val().trim();
     const password = $('#passwordSignup').val();
     const confirmPassword = $('#confirmPassword').val();


     const emailStatus = $('#signupEmail'),
          passStatus = $('#signupPass'),
          nameStatus = $('#signupName'),
          confirmPassStatus = $('#signupConfirmPass');

     if (userEmail.endsWith("@gmail.com")) {
          emailStatus.show();
          return;
     };

     if (password !== confirmPassword) {
          confirmPassStatus.show();
          return;
     }

     try {
          const response = await fetch('/signup', {
               method: 'POST',
               credentials: 'include',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ userName, userEmail, password })
          });
          const data = await response.json();
          console.log('Signup response:', data);

          if (data.message === 'Signup successful') {
               window.location.href = '/';
          } else {
               confirmPassStatus.show();
               confirmPassStatus.text = 'Unable to SignUp';
          }
     } catch (err) {
          console.error(err);
          confirmPassStatus.show();
          confirmPassStatus.text = err;
     }
});
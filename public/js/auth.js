async function checkAuthCode(authCodeInput) {
  try {
      const response = await fetch('/verify-auth-code', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            authCodeInput: authCodeInput
          })
      });

      if (!response.ok) {
          const data = await response.json();
          // displayError(data.error || 'Network response was not ok');
          throw new Error(data.error || 'Network response was not ok');
      }

      const data = await response.json();
      displayInfo(`${data} <span class="checkIcon">✔</span>`)
  } catch (error) {
      console.error('There was a problem with the fetch operation:', error.message);
      displayError(`${error.message} <span class="crossIcon">✖</span>`);
  }
}


document.getElementById('submitAuthCode').addEventListener('click', () => {
  let authCodeInput = document.getElementById("authCodeInput").value;
  document.querySelector('#submitAuthCode').disabled = true;
  checkAuthCode(authCodeInput).then(()=>{
    document.getElementById('errorModal').addEventListener('click', () => {
      document.querySelector('#submitAuthCode').disabled = false;
    })
  })
});

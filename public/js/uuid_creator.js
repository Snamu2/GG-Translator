async function requestAuthCode(name) {
  try {
      const response = await fetch('/generate-auth-code', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name
          })
      });

      if (!response.ok) {
          const data = await response.json();
          // displayError(data.error || 'Network response was not ok');
          throw new Error(data.error || 'Network response was not ok');
      }

      const data = await response.json();
      document.getElementById("nameInput").value = '';
      displayAuthCode(data.authCode);
      setTimeout(enableButtons, 2000)
  } catch (error) {
      console.error('There was a problem with the fetch operation:', error.message);
      displayError(error.message);
  }
}

function displayAuthCode(authCode) {
  const authCodeElement = document.getElementById('authCodeDisplay');
  if (authCodeElement) {
      authCodeElement.textContent = `${authCode}`;
  }
}



document.getElementById('generateBtn').addEventListener('click', () => {
  let name = document.getElementById("nameInput").value;
  disableButtons()
  requestAuthCode(name).then(()=>{
    document.getElementById('errorModal').addEventListener('click', () => {
      enableButtons()
    })
  })
});

async function requestCheckDuplicate(dataToCheck) {
  try {
    const response = await fetch('/check-duplicate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToCheck)
    });

    if (!response.ok) {
        const result = await response.json();
        // displayError(result.error || 'Network response was not ok');
        throw new Error(result.error || 'Network response was not ok');
    }

    const result = await response.json();

    if (result.isDuplicate) {
      displayInfo(`Data is duplicate. <span class="crossIcon">✖</span>`);
    } else {
      displayInfo(`Data is unique. <span class="checkIcon">✔</span>`);
    }
  } catch (error) {
      console.error('Error checking duplicates:', error.message);
      displayError(error.message);
  }
}

document.getElementById('checkDuplicateBtn').addEventListener('click', function() {
  let DisplayedauthCode = document.getElementById("authCodeDisplay").textContent;
  const dataToCheck = { DisplayedauthCode: DisplayedauthCode };
  disableButtons()
  requestCheckDuplicate(dataToCheck).then(()=>{
    document.getElementById('errorModal').addEventListener('click', enableButtons)
    document.getElementById('infoModal').addEventListener('click', enableButtons)
  })
})


function disableButtons() {
  document.querySelector('#generateBtn').disabled = true;
  document.querySelector('#checkDuplicateBtn').disabled = true;
}

function enableButtons() {
  document.querySelector('#generateBtn').disabled = false;
  document.querySelector('#checkDuplicateBtn').disabled = false;
}
function displayError(errorMessage) {
  const modal = document.getElementById('errorModal');
  const errorMsg = document.getElementById('errorMsg');
  const closeBtn = document.querySelector('.close-btn');

  errorMsg.innerHTML = `<span class="warningIcon">⚠</span> ${errorMessage}`;
  modal.style.display = "block";

  closeBtn.onclick = function() {
      modal.style.display = "none";
  }

  window.onclick = function(event) {
      if (event.target == modal) {
          modal.style.display = "none";
      }
  }
}

function displayInfo(infoMessage) {
  const modal = document.getElementById('infoModal');
  const infoMsg = document.getElementById('infoMsg');
  const closeBtn = document.querySelector('.info-close-btn');

  infoMsg.innerHTML = `<span class="infoIcon">i</span> ${infoMessage}`;
  modal.style.display = "block";

  closeBtn.onclick = function() {
      modal.style.display = "none";
  }

  window.onclick = function(event) {
      if (event.target == modal) {
          modal.style.display = "none";
      }
  }
}
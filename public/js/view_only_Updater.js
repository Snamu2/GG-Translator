import { auth } from './firebase_init.mjs';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

let currentUser = null;
let socket = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log('User is signed in:', user.uid);
    initializeSocket();
    fetchLatestTranslation();
  } else {
    currentUser = null;
    console.log('No user is signed in.');
    window.location.replace('/authentication');
  }
});

function initializeSocket() {
  const socket = io({
    auth: {
      token: currentUser.accessToken
    }
  });

  socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('requestLatestTranslation');
  });

  socket.on('translation update', (data) => {
    updateTranslation(data.AIResult);
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    try {
      // 연결 오류 시 fetch로 대체
      fetchLatestTranslation();
    } catch {
      alert('Connection error')
    }
  });
}

function fetchLatestTranslation() {
  currentUser.getIdToken().then(token => {
    fetch('/api/latest-translation', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.output) {
        updateTranslation(data.output);
      }
    })
    .catch(error => console.error('Error fetching translation:', error));
  });
}

function refreshTranslation() {
  console.log('Refresh button clicked');
  if (socket && socket.connected) {
    socket.emit('requestLatestTranslation');
  } else {
    fetchLatestTranslation();
  }
}

const updateTranslation = (AIResult) => {
  const languages = [
    { code: 'kor', name: 'Korean' },
    { code: 'eng', name: 'English' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'chs', name: 'Chinese (Simplified)' },
    { code: 'cht', name: 'Chinese (Traditional)' },
    { code: 'vie', name: 'Vietnamese' },
    { code: 'ind', name: 'Indonesian' },
    { code: 'tha', name: 'Thai' },
    { code: 'deu', name: 'German' },
    { code: 'rus', name: 'Russian' },
    { code: 'spa', name: 'Spanish' },
    { code: 'ita', name: 'Italian' },
    { code: 'fra', name: 'French' },
    { code: 'hin', name: 'Hindi' },
    { code: 'ara', name: 'Arabic' },
    { code: 'por', name: 'Portuguese' },
    { code: 'tur', name: 'Turkish' }
  ];

  const activeLanguages = JSON.parse(localStorage.getItem('activeLanguages')) || [];

  // 기존 섹션을 업데이트
  languages.forEach(function(language) {
    const section = document.getElementById(language.code);
    if (section) {
      const paragraph = document.getElementById(`translation-${language.code}`);
      if (paragraph) {
        let content = 'No translation available';
        AIResult.split('\n').forEach(function(line) {
          if (line.toLowerCase().startsWith(language.code)) {
            content = line.split(': ')[1] || content;
          }
        });
        paragraph.innerText = content;

        // Show or hide the section based on activeLanguages
        if (activeLanguages.includes(language.code)) {
          section.style.display = 'block';
          section.classList.add('active');
        } else {
          section.style.display = 'none';
          section.classList.remove('active');
        }
      }
    }
  });

  document.querySelectorAll('.btn').forEach(button => {
    const language = button.getAttribute('data-language');
    if (activeLanguages.includes(language)) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
};

document.querySelector('#refresh').addEventListener('click', () => {
  refreshTranslation()
})
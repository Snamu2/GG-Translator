import { analytics, db, auth } from './firebase_init.mjs';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log('User is signed in:', user.uid);
    window.location.replace('/');
  } else {
    currentUser = null;
    console.log('No user is signed in.');
  }
});

async function saveUserInfo(userId, email) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // New
      await setDoc(userDocRef, {
        email: email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
    } else {
      // already
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp()
      });
    }
    console.log('User Info saved/updated successfully.');
  } catch (e) {
    console.error('Error saving/updating user info:', e);
    throw e;
  }
}

const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const formContainer = document.getElementById('form-container');
enableButtons();

function resetForms() {
  loginForm.reset();
  signupForm.reset();
}

loginBtn.addEventListener('click', () => {
  resetForms()
  toggleForm('login');
});

signupBtn.addEventListener('click', () => {
  resetForms()
  toggleForm('signup');
});

function toggleForm(type) {
  if (type === 'login') {
    gsap.fromTo(loginForm, { opacity: 0, y: 50 }, {
      opacity: 1, y: 0, duration: 0.5, onStart: () => {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        signupForm.classList.add('d-none');
      }
    });
    loginBtn.classList.add('active');
    signupBtn.classList.remove('active');
  } else {
    gsap.fromTo(signupForm, { opacity: 0, y: 50 }, {
      opacity: 1, y: 0, duration: 0.5, onStart: () => {
        signupForm.classList.add('active');
        signupForm.classList.remove('d-none');
        loginForm.classList.remove('active');
      }
    });
    signupBtn.classList.add('active');
    loginBtn.classList.remove('active');
  }

  // Save the last active form to localStorage
  localStorage.setItem('lastActiveForm', type);
}

// Set initial form based on last active
const lastActiveForm = localStorage.getItem('lastActiveForm') || 'login';
toggleForm(lastActiveForm);

document.querySelectorAll('.btn').forEach(button => {
  button.addEventListener('click', () => {
    gsap.fromTo(button, { scale: 1 }, { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1 });
  });
});

window.onload = function () {
  gsap.from('.auth-container', { opacity: 0, y: -50, duration: 1 });
}

function disableButtons() {
  loginBtn.disabled = true;
  signupBtn.disabled = true;
  document.querySelectorAll('button[type="submit"]').forEach(button => {
    button.disabled = true;
  });
}

function enableButtons() {
  loginBtn.disabled = false;
  signupBtn.disabled = false;
  document.querySelectorAll('button[type="submit"]').forEach(button => {
    button.disabled = false;
  });
}

document.querySelector('#login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  disableButtons();
  // Handle login
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  signInWithEmailAndPassword(auth, email, password)
    .then( async (userCredential) => {
      const user = userCredential.user;
      console.log('Logged in:', user);
      showConfirmation(loginForm);

      await saveUserInfo(user.uid, user.email);

      window.location.replace('/');
    })
    .catch((error) => {
      console.error('Error:', error.code, error.message);
      alert('Login failed');
    })
    .finally(() => {
      enableButtons();
    });
});

document.querySelector('#signup-form').addEventListener('submit', (event) => {
  event.preventDefault();
  disableButtons();
  // Handle signup
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;

  if (password !== confirmPassword) {
    alert('Passwords do not match');
    enableButtons();
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then( async (userCredential) => {
      const user = userCredential.user;
      console.log('Signed Up:', user);
      showConfirmation(signupForm)

      await saveUserInfo(user.uid, user.email);
    
      alert("Signed Up!");
      window.location.replace('/authentication');
    })
    .catch((error) => {
      console.error('Error:', error.code, error.message);
      alert('Registration failed');
    })
    .finally(() => {
      enableButtons();
    });
});

function showConfirmation(form) {
  const checkIconContainer = document.createElement('div');
  checkIconContainer.classList.add('check-icon-container');
  const checkIcon = document.createElement('div');
  checkIcon.classList.add('check-icon', 'show-check');
  checkIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" alt="checkmark" width="21" height="21" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
    </svg>
  `;
  checkIconContainer.appendChild(checkIcon);
  formContainer.appendChild(checkIconContainer);

  form.reset()

  setTimeout(() => {
    checkIcon.classList.remove('show-check');
    formContainer.removeChild(checkIconContainer);
  }, 1500);
}

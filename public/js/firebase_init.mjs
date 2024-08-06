import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
// import { getFunctions } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";
// import { getMessaging } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js";
// import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
// import { getPerformance } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-performance.js";
// import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
// import { getRemoteConfig } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-remote-config.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3p6JuuBzDLtnuInozqhr-5Ex8zE22oNg",
  authDomain: "gg-translator-snamu.firebaseapp.com",
  projectId: "gg-translator-snamu",
  storageBucket: "gg-translator-snamu.appspot.com",
  messagingSenderId: "855496593585",
  appId: "1:855496593585:web:4ee13ae9e9df5fb90a9290",
  measurementId: "G-QV0JL4L1S9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
// const functions = getFunctions(app);
// const messaging = getMessaging(app);
// const storage = getStorage(app);
// const performance = getPerformance(app);
// const database = getDatabase(app);
// const remoteConfig = getRemoteConfig(app);
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LdmDCAqAAAAAFcbeiyz0jXUt1SnYtTKl8PG_m4r'),
  isTokenAutoRefreshEnabled: true
});

export { app, analytics, auth, db, appCheck };
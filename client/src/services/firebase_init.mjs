import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getFunctions } from "firebase/functions";
// import { getMessaging } from "firebase/messaging";
// import { getStorage } from "firebase/storage";
// import { getPerformance } from "firebase/performance";
// import { getDatabase } from "firebase/database";
// import { getRemoteConfig } from "firebase/remote-config";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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
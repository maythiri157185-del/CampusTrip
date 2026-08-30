/* ============================================================
   CampusTrip — Firebase Configuration
   ------------------------------------------------------------
   1. Go to https://console.firebase.google.com
   2. Create a project (or use an existing one)
   3. Project settings → General → "Your apps" → Add a Web app
   4. Copy the config object Firebase gives you and paste it below
   5. In the left sidebar, enable:
        - Build → Authentication → Sign-in method → Email/Password
        - Build → Firestore Database → Create database (start in
          production mode, then paste firestore.rules from this
          package into Firestore → Rules)
   ============================================================ */

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
/* ============================================================
CampusTrip — Firebase Configuration
============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyCE0cFvdb5umGZqJeB1mWBr90MkMzAgsn0",
  authDomain: "campus-trip.firebaseapp.com",
  projectId: "campus-trip",
  storageBucket: "campus-trip.firebasestorage.app",
  messagingSenderId: "731994222816",
  appId: "1:731994222816:web:a0709e5ae108fa2eac6085"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();


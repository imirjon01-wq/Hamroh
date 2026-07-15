import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";


const firebaseConfig = {
  apiKey: "AIzaSyB3kdDOcfD9uOlWHMcJn0vpGGJ8ZCvx_TA",
  authDomain: "hamroh-dabb6.firebaseapp.com",
  projectId: "hamroh-dabb6",
  storageBucket: "hamroh-dabb6.firebasestorage.app",
  messagingSenderId: "980235208037",
  appId: "1:980235208037:web:fd3824f9ae13ccdb218d8c"
};


const app = initializeApp(firebaseConfig);


const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { auth, db, storage };
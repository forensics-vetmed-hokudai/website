// assets/js/firebase-submit.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
    initializeAppCheck,
    ReCaptchaV3Provider
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-check.js";
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Firebase Console の Web App 設定からコピーした
const firebaseConfig = {
    apiKey: "AIzaSyCHlKDk43aRXhHKWNSfClRsKMppwG-vjjI",
    authDomain: "questionnaire-exoticanimalcafe.firebaseapp.com",
    projectId: "questionnaire-exoticanimalcafe",
    storageBucket: "questionnaire-exoticanimalcafe.firebasestorage.app",
    messagingSenderId: "681387269198",
    appId: "1:681387269198:web:cba28300e091ee23fab71f",
    measurementId: "G-5H8DEJK6KF"
};

// reCAPTCHA v3 site key
const RECAPTCHA_SITE_KEY = "6Ld2qAgtAAAAAPbWsb0tSUB1rmLxK9dziohL2XJb";
const COLLECTION_NAME = "exoticCafeResponses";
const PAGE_NAME = "questionnaire_exoticanimalcafe.html";

const app = initializeApp(firebaseConfig);

try {
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true
    });
} catch (error) {
    console.warn("Firebase App Check initialization failed.", error);
}

const db = getFirestore(app);

export async function submitDiagnosisAggregate(payload) {
    return addDoc(collection(db, COLLECTION_NAME), {
        sessionId: payload.sessionId,
        answers: payload.answers,
        resultId: payload.resultId,
        preCafe: payload.preCafe,
        preTouch: payload.preTouch,
        postCafe: payload.postCafe,
        postTouch: payload.postTouch,
        version: payload.version,
        page: PAGE_NAME,
        createdAt: serverTimestamp()
    });
}

window.submitDiagnosisAggregate = submitDiagnosisAggregate;

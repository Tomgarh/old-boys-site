import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =========================
   FIREBASE CONFIG
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyCX2CWL0n0oZsnIjlyaB5YXt4bYl_mPWiQ",
  authDomain: "casan-election-portal.firebaseapp.com",
  projectId: "casan-election-portal",
  storageBucket: "casan-election-portal.appspot.com",
  messagingSenderId: "614342710645",
  appId: "1:614342710645:web:1cfd27fa72d54b11c42f3c",
  measurementId: "G-XVX56E5PSP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   WAIT FOR DOM
========================= */
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("interestForm");
  const candidateGrid = document.getElementById("candidateGrid");

  /* =========================
     COUNTDOWN
  ========================= */
  const targetDate = new Date("June 13, 2026 00:00:00").getTime();

  function updateCountdown() {
    const now = Date.now();
    const gap = targetDate - now;

    const second = 1000;
    const minute = second * 60;
    const hour = minute * 60;
    const day = hour * 24;

    let days = Math.floor(gap / day);
    let hours = Math.floor((gap % day) / hour);
    let minutes = Math.floor((gap % hour) / minute);
    let seconds = Math.floor((gap % minute) / second);

    if (gap < 0) {
      days = hours = minutes = seconds = 0;
    }

    const d = document.getElementById("days");
    const h = document.getElementById("hours");
    const m = document.getElementById("minutes");
    const s = document.getElementById("seconds");

    if (d && h && m && s) {
      d.innerText = days;
      h.innerText = hours;
      m.innerText = minutes;
      s.innerText = seconds;
    }
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  /* =========================
     IMAGE PREVIEW
  ========================= */
  const passportInput = document.getElementById("passportInput");
  const previewImage = document.getElementById("previewImage");

  if (passportInput) {
    passportInput.addEventListener("change", (e) => {
      const file = e.target.files[0];

      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImage.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  /* =========================
     SUBMIT FORM
  ========================= */
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // SAFE FIELD GRABBING (no index bugs)
      const name = form.querySelector('input[type="text"]').value.trim();
      const phone = form.querySelectorAll('input[type="text"]')[1].value.trim();
      const year = form.querySelectorAll('input[type="text"]')[2].value.trim();
      const signature = form.querySelectorAll('input[type="text"]')[3].value.trim();

      const date = form.querySelector('input[type="date"]').value;
      const position = form.querySelector("select").value;
      const manifesto = form.querySelector("textarea").value;

      const data = {
        name,
        phone,
        year,
        signature,
        position,
        manifesto,
        date
      };

      try {
        /* =========================
           DUPLICATE CHECK
        ========================= */
        const q = query(
          collection(db, "interestForms_test"),
          where("phone", "==", phone)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          alert("This phone number already submitted!");
          return;
        }

        /* =========================
           SAVE TO FIREBASE
        ========================= */
        await addDoc(collection(db, "interestForms_test"), data);

        alert("Submitted successfully!");

        form.reset();
        loadCandidates();

      } catch (err) {
        console.error(err);
        alert("Firebase error. Check console.");
      }
    });
  }

  /* =========================
     LOAD CANDIDATES
  ========================= */
  async function loadCandidates() {
    if (!candidateGrid) return;

    candidateGrid.innerHTML = "";

    const snapshot = await getDocs(collection(db, "interestForms_test"));

    if (snapshot.empty) {
      candidateGrid.innerHTML = "<p>No candidates yet</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const c = doc.data();

      candidateGrid.innerHTML += `
        <div class="card">
          <h3>${c.name || "No Name"}</h3>
          <p><strong>Position:</strong> ${c.position || "N/A"}</p>
          <p><strong>Phone:</strong> ${c.phone || "N/A"}</p>
          <p><strong>Date:</strong> ${c.date || "N/A"}</p>
        </div>
      `;
    });
  }

  loadCandidates();
});

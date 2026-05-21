/* =========================
   FIREBASE SETUP
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "casan-election-portal.firebaseapp.com",
  projectId: "casan-election-portal",
  storageBucket: "casan-election-portal.appspot.com",
  messagingSenderId: "614342710645",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     COUNTDOWN (FIXED)
  ========================= */
  const targetDate = new Date("June 13, 2026 00:00:00").getTime();
  
  function updateCountdown() {
    const now = new Date().getTime();
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
      days = 0;
      hours = 0;
      minutes = 0;
      seconds = 0;
    }
  
    document.getElementById("days").innerText = days;
    document.getElementById("hours").innerText = hours;
    document.getElementById("minutes").innerText = minutes;
    document.getElementById("seconds").innerText = seconds;
  }
  
  setInterval(updateCountdown, 1000);
  updateCountdown();
  
  
  /* =========================
     PASSPORT PREVIEW
  ========================= */
  const passportInput = document.getElementById("passportInput");
  const previewImage = document.getElementById("previewImage");
  
  if (passportInput) {
    passportInput.addEventListener("change", function () {
      const file = this.files[0];
  
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
  
        reader.onload = (e) => {
          previewImage.src = e.target.result;
        };
  
        reader.readAsDataURL(file);
      }
    });
  }
  
  
  /* =========================
     CANDIDATES (LOCAL STORAGE VERSION)
  ========================= */
  const form = document.getElementById("interestForm");
  const candidateGrid = document.getElementById("candidateGrid");
  
  let candidates = JSON.parse(localStorage.getItem("candidates")) || [];
  
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const inputs = form.querySelectorAll("input");
      const select = form.querySelector("select");
      const textarea = form.querySelector("textarea");
  
      const data = {
        name: inputs[1].value.trim(),
        phone: inputs[2].value.trim(),
        year: inputs[3].value,
        position: select.value,
        manifesto: textarea.value,
        date: new Date().toLocaleDateString()
      };
  
      // prevent duplicates
      const exists = candidates.some(c => c.phone === data.phone);
      if (exists) {
        alert("This phone number already submitted!");
        return;
      }
  
      candidates.push(data);
      localStorage.setItem("candidates", JSON.stringify(candidates));
  
      renderCandidates();
      form.reset();
    });
  }
  
  function renderCandidates() {
    if (!candidateGrid) return;
  
    candidateGrid.innerHTML = "";
  
    candidates.forEach((c) => {
      candidateGrid.innerHTML += `
        <div class="card">
          <h3>${c.name}</h3>
          <p>${c.position}</p>
          <p>${c.phone}</p>
        </div>
      `;
    });
  }
  
  renderCandidates();
  
  
  /* =========================
     RECEIPT (PDF)
  ========================= */
  function generateReceipt(c) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    doc.text("CASAN ELECTION RECEIPT", 20, 20);
    doc.text(`Name: ${c.name}`, 20, 40);
    doc.text(`Phone: ${c.phone}`, 20, 50);
    doc.text(`Position: ${c.position}`, 20, 60);
    doc.text(`Date: ${c.date}`, 20, 70);
  
    doc.save(`${c.name}_receipt.pdf`);
  }
  
  });

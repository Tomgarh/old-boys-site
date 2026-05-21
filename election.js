const targetDate = new Date("June 13, 2026 00:00:00").getTime();

/* =========================
   COUNTDOWN
========================= */
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

  // prevent negative numbers after election date
  if (gap < 0) {
    days = hours = minutes = seconds = 0;
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

      reader.onload = function (e) {
        previewImage.src = e.target.result;
      };

      reader.readAsDataURL(file);
    }
  });
}


/* =========================
   FORM HANDLING
========================= */
const form = document.getElementById("interestForm");
const candidateGrid = document.getElementById("candidateGrid");

let candidates = JSON.parse(localStorage.getItem("candidates")) || [];

if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const inputs = form.querySelectorAll("input");
    const select = form.querySelector("select");
    const textarea = form.querySelector("textarea");

    const formData = {
      name: inputs[1].value.trim(),
      phone: inputs[2].value.replace(/\s/g, ""), // normalize
      year: inputs[3].value,
      position: select.value,
      manifesto: textarea.value,
      date: new Date().toLocaleDateString()
    };

    // 🚫 BLOCK DUPLICATE PHONE NUMBERS
    const exists = candidates.some(c =>
      c.phone.replace(/\s/g, "") === formData.phone
    );

    if (exists) {
      alert("This phone number has already submitted an application.");
      return;
    }

    candidates.push(formData);
    localStorage.setItem("candidates", JSON.stringify(candidates));

    renderCandidates();
    downloadReceipt(candidates.length - 1); // auto receipt
    form.reset();
  });
}


/* =========================
   DISPLAY CANDIDATES
========================= */
function renderCandidates() {
  if (!candidateGrid) return;

  candidateGrid.innerHTML = "";

  candidates.forEach((c, index) => {
    candidateGrid.innerHTML += `
      <div class="card">
        <h3>${c.name}</h3>
        <p><strong>Position:</strong> ${c.position}</p>
        <p><strong>Year:</strong> ${c.year}</p>
        <button onclick="downloadReceipt(${index})" class="view">
          Download Receipt
        </button>
      </div>
    `;
  });
}

renderCandidates();


/* =========================
   PDF RECEIPT
========================= */
function downloadReceipt(index) {
  const c = candidates[index];

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("CASAN OLD BOYS ELECTION RECEIPT", 20, 20);

  doc.setFontSize(12);
  doc.text(`Name: ${c.name}`, 20, 40);
  doc.text(`Phone: ${c.phone}`, 20, 50);
  doc.text(`Year of Induction: ${c.year}`, 20, 60);
  doc.text(`Position: ${c.position}`, 20, 70);
  doc.text(`Date: ${c.date}`, 20, 80);

  doc.save(`${c.name}_election_receipt.pdf`);
}
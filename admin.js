import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyCX2CWL0n0oZsnIjlyaB5YXt4bYl_mPWiQ",
  authDomain: "casan-election-portal.firebaseapp.com",
  projectId: "casan-election-portal",
  storageBucket: "casan-election-portal.firebasestorage.app",
  messagingSenderId: "614342710645",
  appId: "1:614342710645:web:1cfd27fa72d54b11c42f3c",
  measurementId: "G-XVX56E5PSP"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


const CANDIDATES_COLLECTION = "interestForms_test";
const PUBLIC_CANDIDATES_COLLECTION = "candidates_public";
const VOTER_REQUESTS_COLLECTION = "voter_requests";
const ELIGIBLE_VOTERS_COLLECTION = "eligible_voters";

const ADMIN_EMAIL = "tomgarh.dev@gmail.com";
const ELECTION_ID = "oldboys-election-2026";


/* =========================
   DOM ELEMENTS
========================= */

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const adminLoginForm = document.getElementById("adminLoginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const loginMessage = document.getElementById("loginMessage");

const logoutBtn = document.getElementById("logoutBtn");

const pendingVoters = document.getElementById("pendingVoters");
const pendingVoterCount = document.getElementById("pendingVoterCount");
const refreshVotersBtn = document.getElementById("refreshVotersBtn");

const pendingCandidates = document.getElementById("pendingCandidates");
const approvedCandidates = document.getElementById("approvedCandidates");

const pendingCount = document.getElementById("pendingCount");
const approvedCount = document.getElementById("approvedCount");

const refreshPendingBtn = document.getElementById("refreshPendingBtn");

const candidateModal = document.getElementById("candidateModal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalOverlay = document.getElementById("modalOverlay");

const notification = document.getElementById("notification");
const notificationText = document.getElementById("notificationText");


/* =========================
   ADMIN LOGIN
========================= */

adminLoginForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const email = adminEmail.value.trim().toLowerCase();
  const password = adminPassword.value;

  loginMessage.textContent = "Signing in...";
  loginMessage.className = "message";

  try {

    // Keep admin authentication isolated to this browser tab/session
    await setPersistence(auth, browserSessionPersistence);

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    loginMessage.textContent = "";

  } catch (error) {

    console.error("Login error:", error);

    loginMessage.textContent =
      error.code + ": " + error.message;

    loginMessage.className = "message error";
  }

});

/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(auth, async (user) => {

  if (user) {

    /*
      Client-side check for better UX.

      Firestore rules still provide the real security
      because only ADMIN_EMAIL is allowed to perform
      administrative operations.
    */

    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {

      await signOut(auth);

      loginMessage.textContent =
        "This account does not have administrator access.";

      loginMessage.className = "message error";

      return;
    }

    loginSection.style.display = "none";
    dashboardSection.style.display = "block";
    logoutBtn.style.display = "block";

    await loadDashboard();

  } else {

    loginSection.style.display = "flex";
    dashboardSection.style.display = "none";
    logoutBtn.style.display = "none";
  }

});


/* =========================
   LOGOUT
========================= */

logoutBtn.addEventListener("click", async () => {

  try {

    await signOut(auth);

    showNotification(
      "You have been logged out."
    );

  } catch (error) {

    console.error("Logout error:", error);
  }

});


/* =========================
   LOAD DASHBOARD
========================= */

async function loadDashboard() {

  await Promise.all([
    loadPendingVoters(),
    loadPendingCandidates(),
    loadApprovedCandidates()
  ]);

}


/* =====================================================
   VOTER VERIFICATION
===================================================== */


/* =========================
   LOAD PENDING VOTERS
========================= */

async function loadPendingVoters() {

  pendingVoters.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⏳</div>
      <h4>Loading voter requests...</h4>
      <p>Please wait.</p>
    </div>
  `;

  try {

    const snapshot = await getDocs(
      collection(db, VOTER_REQUESTS_COLLECTION)
    );

    const pending = [];

    snapshot.forEach((docSnap) => {

      const voter = docSnap.data();

      if (
        voter.status === "pending" ||
        (
          voter.status === undefined &&
          voter.approved !== true
        )
      ) {

        pending.push({
          id: docSnap.id,
          ...voter
        });

      }

    });

    pendingVoterCount.textContent = pending.length;


    if (pending.length === 0) {

      pendingVoters.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✓</div>
          <h4>No pending voter requests</h4>
          <p>There are currently no voters waiting for verification.</p>
        </div>
      `;

      return;
    }


    pendingVoters.innerHTML = "";


    pending.forEach((voter) => {

      pendingVoters.appendChild(
        createVoterCard(voter)
      );

    });


  } catch (error) {

    console.error(
      "Error loading voter requests:",
      error
    );

    pendingVoters.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h4>Unable to load voter requests</h4>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

  }

}


/* =========================
   CREATE VOTER CARD
========================= */

function createVoterCard(voter) {

  const card = document.createElement("div");

  card.className = "admin-candidate-card";


  const submittedDate =
    formatTimestamp(voter.submittedAt);


  card.innerHTML = `

    <div class="candidate-info">

      <span class="candidate-status pending">
        PENDING VERIFICATION
      </span>

      <h3>
        ${escapeHTML(
          voter.fullName || "Unnamed Voter"
        )}
      </h3>

      <p>
        <strong>Email:</strong>
        ${escapeHTML(
          voter.email || "N/A"
        )}
      </p>

      <p>
        <strong>Phone:</strong>
        ${escapeHTML(
          voter.phone || "N/A"
        )}
      </p>

      <p>
        <strong>Year of Induction:</strong>
        ${escapeHTML(
          voter.inductionYear || "N/A"
        )}
      </p>

      <p>
        <strong>Submitted:</strong>
        ${escapeHTML(submittedDate)}
      </p>

      <div class="candidate-actions">

        <button
          type="button"
          class="primary-btn approve-voter-btn"
        >
          ✓ Approve Voter
        </button>

        <button
          type="button"
          class="danger-btn reject-voter-btn"
        >
          ✕ Reject
        </button>

      </div>

    </div>
  `;


  const approveButton =
    card.querySelector(".approve-voter-btn");

  approveButton.addEventListener(
    "click",
    () => approveVoter(voter)
  );


  const rejectButton =
    card.querySelector(".reject-voter-btn");

  rejectButton.addEventListener(
    "click",
    () => rejectVoter(voter)
  );


  return card;
}


/* =========================
   APPROVE VOTER
========================= */

async function approveVoter(voter) {

  const user = auth.currentUser;

  if (!user) {
    showNotification(
      "Please log in as administrator."
    );
    return;
  }

  if (
    user.email?.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {
    showNotification(
      "You do not have administrator access."
    );
    return;
  }

  const confirmed = confirm(
    `Approve ${voter.fullName || "this voter"} as an eligible voter?`
  );

  if (!confirmed) {
    return;
  }

  try {

    // Make sure we are using the Firebase UID
    const voterUID = voter.uid || voter.id;

    if (!voterUID) {
      throw new Error(
        "Voter UID is missing."
      );
    }

    /*
      Both operations are placed into ONE batch.

      Either:
      1. voter request becomes approved AND
      2. eligible voter is created

      OR neither operation happens.
    */

    const batch = writeBatch(db);

    // -----------------------------------------
    // 1. APPROVE VOTER REQUEST
    // -----------------------------------------

    const voterRequestRef = doc(
      db,
      VOTER_REQUESTS_COLLECTION,
      voterUID
    );

    batch.update(
      voterRequestRef,
      {
        status: "approved",
        approved: true,
        approvedAt: serverTimestamp(),
        approvedBy: user.email
      }
    );


    // -----------------------------------------
    // 2. CREATE ELIGIBLE VOTER
    // -----------------------------------------

    const eligibleVoterRef = doc(
      db,
      ELIGIBLE_VOTERS_COLLECTION,
      voterUID
    );

    batch.set(
      eligibleVoterRef,
      {
        uid: voterUID,
        fullName: voter.fullName || "",
        email: voter.email || "",
        electionId: ELECTION_ID,
        eligible: true,
        approvedAt: serverTimestamp(),
        approvedBy: user.email
      }
    );


    // -----------------------------------------
    // COMMIT BOTH OPERATIONS
    // -----------------------------------------

    await batch.commit();


    showNotification(
      `${voter.fullName || "Voter"} has been approved successfully.`
    );


    await loadPendingVoters();


  } catch (error) {

    console.error(
      "Voter approval error:",
      error
    );

    console.error(
      "Error code:",
      error.code
    );

    console.error(
      "Error message:",
      error.message
    );


    if (error.code === "permission-denied") {

      showNotification(
        "Approval was blocked by your Firestore security rules."
      );

    } else {

      showNotification(
        `Unable to approve voter: ${error.message}`
      );

    }

  }

}

/* =========================
   REJECT VOTER
========================= */

async function rejectVoter(voter) {

  const user = auth.currentUser;


  if (!user) {

    showNotification(
      "Please log in as administrator."
    );

    return;
  }


  if (
    user.email?.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {

    showNotification(
      "You do not have administrator access."
    );

    return;
  }


  const confirmed = confirm(
    `Reject ${voter.fullName || "this voter"}?`
  );


  if (!confirmed) {
    return;
  }


  try {

    /*
      We keep the request for audit/history
      and simply mark it as rejected.
    */

    await updateDoc(
      doc(
        db,
        VOTER_REQUESTS_COLLECTION,
        voter.id
      ),
      {
        status: "rejected",
        approved: false,
        rejectedAt: serverTimestamp(),
        rejectedBy: user.email
      }
    );


    showNotification(
      `${voter.fullName || "Voter"} has been rejected.`
    );


    await loadPendingVoters();


  } catch (error) {

    console.error(
      "Voter rejection error:",
      error
    );


    if (error.code === "permission-denied") {

      showNotification(
        "Rejection is blocked by your Firestore security rules."
      );

    } else {

      showNotification(
        "Unable to reject voter."
      );
    }

  }

}


/* =====================================================
   CANDIDATES
===================================================== */


/* =========================
   LOAD PENDING CANDIDATES
========================= */

async function loadPendingCandidates() {

  pendingCandidates.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⏳</div>
      <h4>Loading applications...</h4>
      <p>Please wait.</p>
    </div>
  `;

  try {

    const snapshot = await getDocs(
      collection(db, CANDIDATES_COLLECTION)
    );

    const pending = [];


    snapshot.forEach((docSnap) => {

      const candidate = docSnap.data();

      if (candidate.approved !== true) {

        pending.push({
          id: docSnap.id,
          ...candidate
        });

      }

    });


    pendingCount.textContent = pending.length;


    if (pending.length === 0) {

      pendingCandidates.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✓</div>
          <h4>No pending applications</h4>
          <p>There are currently no candidates waiting for review.</p>
        </div>
      `;

      return;
    }


    pendingCandidates.innerHTML = "";


    pending.forEach((candidate) => {

      pendingCandidates.appendChild(
        createCandidateCard(candidate, false)
      );

    });


  } catch (error) {

    console.error(
      "Error loading pending candidates:",
      error
    );


    pendingCandidates.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h4>Unable to load applications</h4>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

  }

}


/* =========================
   LOAD APPROVED CANDIDATES
========================= */

async function loadApprovedCandidates() {

  approvedCandidates.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⏳</div>
      <h4>Loading candidates...</h4>
      <p>Please wait.</p>
    </div>
  `;


  try {

    const snapshot = await getDocs(
      collection(db, PUBLIC_CANDIDATES_COLLECTION)
    );

    const approved = [];


    snapshot.forEach((docSnap) => {

      const candidate = docSnap.data();


      if (candidate.approved === true) {

        approved.push({
          id: docSnap.id,
          ...candidate
        });

      }

    });


    approvedCount.textContent = approved.length;


    if (approved.length === 0) {

      approvedCandidates.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✓</div>
          <h4>No approved candidates</h4>
          <p>Approved candidates will appear here.</p>
        </div>
      `;

      return;
    }


    approvedCandidates.innerHTML = "";


    approved.forEach((candidate) => {

      approvedCandidates.appendChild(
        createCandidateCard(candidate, true)
      );

    });


  } catch (error) {

    console.error(
      "Error loading approved candidates:",
      error
    );


    approvedCandidates.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h4>Unable to load approved candidates</h4>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

  }

}


/* =========================
   CREATE CANDIDATE CARD
========================= */

function createCandidateCard(candidate, approved) {

  const card = document.createElement("div");

  card.className = "admin-candidate-card";


  card.innerHTML = `

    <div class="candidate-photo-wrapper">

      <img
        src="${escapeAttribute(candidate.photo || "")}"
        alt="${escapeAttribute(candidate.name || "Candidate")}"
        class="candidate-photo"
      >

    </div>


    <div class="candidate-info">

      <span class="candidate-status ${approved ? "approved" : "pending"}">

        ${approved
          ? "APPROVED"
          : "PENDING REVIEW"
        }

      </span>


      <h3>
        ${escapeHTML(
          candidate.name || "Unnamed Candidate"
        )}
      </h3>


      <p>
        <strong>Position:</strong>
        ${escapeHTML(
          candidate.position || "N/A"
        )}
      </p>


      <p>
        <strong>Year:</strong>
        ${escapeHTML(
          candidate.year || "N/A"
        )}
      </p>


      <div class="candidate-actions">

        <button
          type="button"
          class="secondary-btn view-btn"
        >
          View Details
        </button>


        ${
          approved
            ? ""
            : `
              <button
                type="button"
                class="primary-btn approve-btn"
              >
                Approve Candidate
              </button>

              <button
                type="button"
                class="danger-btn reject-btn"
              >
                Reject
              </button>
            `
        }

      </div>

    </div>
  `;


  card
    .querySelector(".view-btn")
    .addEventListener(
      "click",
      () => openCandidateModal(candidate, approved)
    );


  const approveBtn =
    card.querySelector(".approve-btn");


  if (approveBtn) {

    approveBtn.addEventListener(
      "click",
      () => approveCandidate(candidate)
    );

  }


  const rejectBtn =
    card.querySelector(".reject-btn");


  if (rejectBtn) {

    rejectBtn.addEventListener(
      "click",
      () => rejectCandidate(candidate)
    );

  }


  return card;
}


/* =========================
   CANDIDATE MODAL
========================= */

function openCandidateModal(candidate, approved) {

  modalBody.innerHTML = `

    <div class="modal-candidate">

      <img
        src="${escapeAttribute(candidate.photo || "")}"
        alt="${escapeAttribute(candidate.name || "Candidate")}"
        class="modal-photo"
      >


      <span class="candidate-status ${approved ? "approved" : "pending"}">

        ${approved
          ? "APPROVED"
          : "PENDING REVIEW"
        }

      </span>


      <h2>
        ${escapeHTML(
          candidate.name || "Unnamed Candidate"
        )}
      </h2>


      <p>
        <strong>Position:</strong>
        ${escapeHTML(
          candidate.position || "N/A"
        )}
      </p>


      <p>
        <strong>Year of Induction:</strong>
        ${escapeHTML(
          candidate.year || "N/A"
        )}
      </p>


      <p>
        <strong>Phone:</strong>
        ${escapeHTML(
          candidate.phone || "N/A"
        )}
      </p>


      <p>
        <strong>Signature:</strong>
        ${escapeHTML(
          candidate.signature || "N/A"
        )}
      </p>


      <p>
        <strong>Date:</strong>
        ${escapeHTML(
          candidate.date || "N/A"
        )}
      </p>


      <div class="manifesto-box">

        <h3>Manifesto</h3>

        <p>
          ${escapeHTML(
            candidate.manifesto ||
            "No manifesto provided."
          )}
        </p>

      </div>


      ${
        !approved
          ? `
            <div class="modal-actions">

              <button
                type="button"
                id="modalApproveBtn"
                class="primary-btn"
              >
                Approve Candidate
              </button>

              <button
                type="button"
                id="modalRejectBtn"
                class="danger-btn"
              >
                Reject
              </button>

            </div>
          `
          : ""
      }

    </div>
  `;


  candidateModal.classList.add("active");


  const modalApproveBtn =
    document.getElementById("modalApproveBtn");


  if (modalApproveBtn) {

    modalApproveBtn.addEventListener(
      "click",
      () => approveCandidate(candidate)
    );

  }


  const modalRejectBtn =
    document.getElementById("modalRejectBtn");


  if (modalRejectBtn) {

    modalRejectBtn.addEventListener(
      "click",
      () => rejectCandidate(candidate)
    );

  }

}


/* =========================
   CLOSE MODAL
========================= */

function closeModal() {

  candidateModal.classList.remove("active");

}


closeModalBtn.addEventListener(
  "click",
  closeModal
);


modalOverlay.addEventListener(
  "click",
  closeModal
);


/* =========================
   APPROVE CANDIDATE
========================= */

async function approveCandidate(candidate) {

  const user = auth.currentUser;


  if (!user) {

    showNotification(
      "Please log in as administrator."
    );

    return;
  }


  if (
    user.email?.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {

    showNotification(
      "You do not have administrator access."
    );

    return;
  }


  const confirmed = confirm(
    `Approve ${candidate.name || "this candidate"} for ${candidate.position || "this position"}?`
  );


  if (!confirmed) {
    return;
  }


  try {

    await setDoc(
      doc(
        db,
        PUBLIC_CANDIDATES_COLLECTION,
        candidate.id
      ),
      {
        name: candidate.name || "",
        year: candidate.year || "",
        position: candidate.position || "",
        manifesto: candidate.manifesto || "",
        photo: candidate.photo || "",
        approved: true
      }
    );

    await updateDoc(
      doc(
        db,
        CANDIDATES_COLLECTION,
        candidate.id
      ),
      {
        approved: true,
        approvedAt: serverTimestamp(),
        approvedBy: user.email
      }
    );


    showNotification(
      `${candidate.name} has been approved.`
    );


    closeModal();


    await loadDashboard();


  } catch (error) {

    console.error(
      "Approval error:",
      error
    );


    if (
      error.code === "permission-denied"
    ) {

      showNotification(
        "Approval is blocked by your Firestore security rules."
      );

    } else {

      showNotification(
        "Unable to approve candidate."
      );

    }

  }

}


/* =========================
   REJECT CANDIDATE
========================= */

async function rejectCandidate(candidate) {

  const user = auth.currentUser;


  if (!user) {

    showNotification(
      "Please log in as administrator."
    );

    return;
  }


  if (
    user.email?.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {

    showNotification(
      "You do not have administrator access."
    );

    return;
  }


  const confirmed = confirm(
    `Reject ${candidate.name || "this candidate"}? This will remove the application.`
  );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        CANDIDATES_COLLECTION,
        candidate.id
      )
    );


    showNotification(
      `${candidate.name} has been rejected.`
    );


    closeModal();


    await loadDashboard();


  } catch (error) {

    console.error(
      "Rejection error:",
      error
    );


    if (
      error.code === "permission-denied"
    ) {

      showNotification(
        "Rejection is blocked by your Firestore security rules."
      );

    } else {

      showNotification(
        "Unable to reject candidate."
      );

    }

  }

}


/* =========================
   REFRESH CANDIDATES
========================= */

refreshPendingBtn.addEventListener(
  "click",
  async () => {

    await loadDashboard();

    showNotification(
      "Dashboard refreshed."
    );

  }
);


/* =========================
   REFRESH VOTERS
========================= */

refreshVotersBtn.addEventListener(
  "click",
  async () => {

    await loadPendingVoters();

    showNotification(
      "Voter requests refreshed."
    );

  }
);


/* =========================
   NOTIFICATIONS
========================= */

function showNotification(message) {

  notificationText.textContent = message;

  notification.classList.add("show");


  setTimeout(() => {

    notification.classList.remove("show");

  }, 4000);

}


/* =========================
   FORMAT TIMESTAMP
========================= */

function formatTimestamp(timestamp) {

  if (!timestamp) {
    return "Not available";
  }


  try {

    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);


    return date.toLocaleString(
      "en-NG",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    );

  } catch (error) {

    return "Not available";
  }

}


/* =========================
   SECURITY HELPERS
========================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

  return escapeHTML(value);

}
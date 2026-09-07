/* =========================================================
ST. BERNARD'S ALTAR SERVERS OLD BOYS ASSOCIATION
ELECTION PORTAL 2026

VOTING ARCHITECTURE:

Firebase Auth
    ↓
Verified Email
    ↓
eligible_voters/{UID}
    ↓
Ballot
    ↓
votes/{UID}

One Firebase UID = One Vote

Election closes:
September 13, 2026 at 00:00 WAT
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    query,
    where,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


/* =========================================================
FIREBASE CONFIG
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyCX2CWL0n0oZsnIjlyaB5YXt4bYl_mPWiQ",
    authDomain: "casan-election-portal.firebaseapp.com",
    projectId: "casan-election-portal",
    storageBucket: "casan-election-portal.firebasestorage.app",
    messagingSenderId: "614342710645",
    appId: "1:614342710645:web:1cfd27fa72d54b11c42f3c",
    measurementId: "G-XVX56E5PSP"
};


/* =========================================================
CLOUDINARY CONFIG
========================================================= */

const CLOUDINARY_CLOUD_NAME = "t71rt123";

const CLOUDINARY_UPLOAD_PRESET =
    "oldboys-contestants";


/* =========================================================
INITIALIZE FIREBASE
========================================================= */

const app =
    initializeApp(firebaseConfig);

const db =
    getFirestore(app);

const auth =
    getAuth(app);


/* =========================================================
ELECTION SETTINGS
========================================================= */

const ELECTION_ID =
    "oldboys-election-2026";

const ELECTION_DEADLINE =
    new Date("2026-09-13T00:00:00+01:00");

const PUBLIC_CANDIDATES_COLLECTION =
    "candidates_public";

const CANDIDATES_COLLECTION =
    "interestForms_test";

const ELIGIBLE_VOTERS_COLLECTION =
    "eligible_voters";

const VOTES_COLLECTION =
    "votes";


/* =========================================================
GLOBAL STATE
========================================================= */

let currentEligibleVoter = null;


/* =========================================================
DOM ELEMENT REFERENCES

IMPORTANT:
These are assigned only after the DOM is ready.
========================================================= */

let voterLogin = null;

let phoneForm = null;

let ballotSection = null;

let alreadyVoted = null;

let voteSuccess = null;

let voteMessage = null;


/* =========================================================
ELECTION POSITIONS
========================================================= */

const electionPositions = [

    {
        label: "Chairman",
        key: "chairman",
        container: "chairmanCandidates"
    },

    {
        label: "Vice Chairman",
        key: "viceChairman",
        container: "viceChairmanCandidates"
    },

    {
        label: "Secretary",
        key: "secretary",
        container: "secretaryCandidates"
    },

    {
        label: "Assistant Secretary",
        key: "assistantSecretary",
        container: "assistantSecretaryCandidates"
    },

    {
        label: "Financial Secretary",
        key: "financialSecretary",
        container: "financialSecretaryCandidates"
    },

    {
        label: "Treasurer",
        key: "treasurer",
        container: "treasurerCandidates"
    },

    {
        label: "Public Relations Officer (PRO)",
        key: "pro",
        container: "proCandidates"
    },

    {
        label: "Welfare Officer",
        key: "welfare",
        container: "welfareCandidates"
    },

    {
        label: "Director of Sports and Socials",
        key: "sportsSocials",
        container: "sportsSocialsCandidates"
    },

    {
        label: "Director of Spirituality",
        key: "spirituality",
        container: "spiritualityCandidates"
    }

];


/* =========================================================
ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
SHOW MESSAGE
========================================================= */

function showMessage(
    element,
    message,
    type
) {

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        "form-message";

    if (type) {
        element.classList.add(type);
    }
}


/* =========================================================
ELECTION DEADLINE
========================================================= */

function getElectionDeadline() {

    return ELECTION_DEADLINE.getTime();
}


function electionIsOpen() {

    return Date.now() <
        getElectionDeadline();
}


/* =========================================================
DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* =================================================
        ELEMENTS
        ================================================= */

        const form =
            document.getElementById(
                "interestForm"
            );

        const candidateGrid =
            document.getElementById(
                "candidateGrid"
            );

        const otpSection =
            document.getElementById(
                "otpSection"
            );

        const otpForm =
            document.getElementById(
                "otpForm"
            );

        const passportInput =
            document.getElementById(
                "passportInput"
            );

        const previewImage =
            document.getElementById(
                "previewImage"
            );


        /* =================================================
        ASSIGN GLOBAL ELECTION ELEMENTS
        ================================================= */

        voterLogin =
            document.getElementById(
                "voterLogin"
            );

        phoneForm =
            document.getElementById(
                "phoneForm"
            );

        ballotSection =
            document.getElementById(
                "ballotSection"
            );

        voteMessage =
            document.getElementById(
                "voteMessage"
            );

        alreadyVoted =
            document.getElementById(
                "alreadyVoted"
            );

        voteSuccess =
            document.getElementById(
                "voteSuccess"
            );


        /* =================================================
        OLD OTP UI IS DISABLED
        ================================================= */

        if (otpSection) {
            otpSection.style.display =
                "none";
        }

        if (otpForm) {
            otpForm.style.display =
                "none";
        }


        /* =================================================
        COUNTDOWN
        ================================================= */

        function updateCountdown() {

            const target =
                getElectionDeadline();

            const now =
                Date.now();

            let gap =
                target - now;

            if (gap < 0) {
                gap = 0;
            }

            const second = 1000;

            const minute =
                second * 60;

            const hour =
                minute * 60;

            const day =
                hour * 24;

            const days =
                Math.floor(
                    gap / day
                );

            const hours =
                Math.floor(
                    (gap % day) / hour
                );

            const minutes =
                Math.floor(
                    (gap % hour) / minute
                );

            const seconds =
                Math.floor(
                    (gap % minute) / second
                );


            const d =
                document.getElementById(
                    "days"
                );

            const h =
                document.getElementById(
                    "hours"
                );

            const m =
                document.getElementById(
                    "minutes"
                );

            const s =
                document.getElementById(
                    "seconds"
                );


            if (d) {
                d.textContent =
                    String(days)
                        .padStart(2, "0");
            }

            if (h) {
                h.textContent =
                    String(hours)
                        .padStart(2, "0");
            }

            if (m) {
                m.textContent =
                    String(minutes)
                        .padStart(2, "0");
            }

            if (s) {
                s.textContent =
                    String(seconds)
                        .padStart(2, "0");
            }


            if (
                gap === 0
            ) {

                const message =
                    document.getElementById(
                        "countdownMessage"
                    );

                if (message) {
                    message.textContent =
                        "Voting has closed.";
                }
            }
        }


        updateCountdown();

        setInterval(
            updateCountdown,
            1000
        );


        /* =================================================
        IMAGE PREVIEW
        ================================================= */

        if (
            passportInput &&
            previewImage
        ) {

            passportInput.addEventListener(
                "change",
                function (event) {

                    const file =
                        event.target.files[0];

                    if (!file) {

                        previewImage.src =
                            "";

                        return;
                    }


                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {

                        alert(
                            "Please select an image file."
                        );

                        passportInput.value =
                            "";

                        previewImage.src =
                            "";

                        return;
                    }


                    const maxSize =
                        5 * 1024 * 1024;


                    if (
                        file.size > maxSize
                    ) {

                        alert(
                            "Please select an image smaller than 5 MB."
                        );

                        passportInput.value =
                            "";

                        previewImage.src =
                            "";

                        return;
                    }


                    const reader =
                        new FileReader();


                    reader.onload =
                        function (result) {

                            previewImage.src =
                                result.target.result;

                        };


                    reader.readAsDataURL(
                        file
                    );

                }
            );
        }


        /* =================================================
        CLOUDINARY PHOTO UPLOAD
        ================================================= */

        async function uploadCandidatePhoto(
            file
        ) {

            if (!file) {
                throw new Error(
                    "NO_PHOTO"
                );
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                throw new Error(
                    "INVALID_IMAGE"
                );
            }


            if (
                file.size >
                5 * 1024 * 1024
            ) {

                throw new Error(
                    "IMAGE_TOO_LARGE"
                );
            }


            const formData =
                new FormData();


            formData.append(
                "file",
                file
            );


            formData.append(
                "upload_preset",
                CLOUDINARY_UPLOAD_PRESET
            );


            const uploadURL =
                "https://api.cloudinary.com/v1_1/" +
                CLOUDINARY_CLOUD_NAME +
                "/image/upload";


            const response =
                await fetch(
                    uploadURL,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "CLOUDINARY_UPLOAD_FAILED"
                );
            }


            const data =
                await response.json();


            if (!data.secure_url) {

                throw new Error(
                    "NO_CLOUDINARY_URL"
                );
            }


            return data.secure_url;
        }


        /* =================================================
        DECLARATION OF INTEREST
        ================================================= */

        if (form) {

            form.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    const nameInput =
                        document.getElementById(
                            "candidateName"
                        );

                    const phoneInput =
                        document.getElementById(
                            "candidatePhone"
                        );

                    const yearInput =
                        document.getElementById(
                            "inductionYear"
                        );

                    const positionInput =
                        document.getElementById(
                            "positionSought"
                        );


                    const name =
                        nameInput
                            ? nameInput.value.trim()
                            : "";


                    const phone =
                        phoneInput
                            ? phoneInput.value.trim()
                            : "";


                    const year =
                        yearInput
                            ? yearInput.value.trim()
                            : "";


                    const position =
                        positionInput
                            ? positionInput.value
                            : "";


                    const manifesto =
                        form.querySelector(
                            "textarea"
                        )?.value.trim() ||
                        "";


                    const signature =
                        form.querySelector(
                            'input[placeholder*="signature"]'
                        )?.value.trim() ||
                        "";


                    const date =
                        form.querySelector(
                            'input[type="date"]'
                        )?.value ||
                        "";


                    const photoFile =
                        passportInput
                            ? passportInput.files[0]
                            : null;


                    if (
                        !name ||
                        !phone ||
                        !year ||
                        !position ||
                        !manifesto ||
                        !photoFile
                    ) {

                        alert(
                            "Please complete all required fields and select a passport photograph."
                        );

                        return;
                    }


                    if (
                        !phone.startsWith("+234") &&
                        !phone.startsWith("0") &&
                        !phone.startsWith("234")
                    ) {

                        alert(
                            "Please enter a valid Nigerian phone number."
                        );

                        return;
                    }


                    const submitButton =
                        form.querySelector(
                            'button[type="submit"]'
                        );


                    try {

                        if (submitButton) {

                            submitButton.disabled =
                                true;

                            submitButton.textContent =
                                "Uploading application...";
                        }


                        const photoURL =
                            await uploadCandidatePhoto(
                                photoFile
                            );


                        const candidateData = {

                            name:
                                name,

                            phone:
                                phone,

                            year:
                                year,

                            signature:
                                signature,

                            position:
                                position,

                            manifesto:
                                manifesto,

                            date:
                                date,

                            photo:
                                photoURL,

                            approved:
                                false,

                            createdAt:
                                serverTimestamp()
                        };


                        await addDoc(
                            collection(
                                db,
                                CANDIDATES_COLLECTION
                            ),
                            candidateData
                        );


                        alert(
                            "Your declaration of interest has been submitted successfully!"
                        );


                        form.reset();


                        if (previewImage) {
                            previewImage.src =
                                "";
                        }


                        await loadCandidates();


                    } catch (error) {

                        console.error(
                            "Declaration submission error:",
                            error
                        );


                        alert(
                            "There was an error while submitting your application. Please try again."
                        );


                    } finally {

                        if (submitButton) {

                            submitButton.disabled =
                                false;

                            submitButton.textContent =
                                "Submit Declaration";
                        }
                    }
                }
            );
        }


        /* =================================================
        LOAD PUBLIC CANDIDATES
        ================================================= */

        async function loadCandidates() {

            if (!candidateGrid) {
                return;
            }


            candidateGrid.innerHTML =
                "";


            try {

                const approvedQuery =
                    query(
                        collection(
                            db,
                            PUBLIC_CANDIDATES_COLLECTION
                        ),
                        where(
                            "approved",
                            "==",
                            true
                        )
                    );


                const snapshot =
                    await getDocs(
                        approvedQuery
                    );


                if (snapshot.empty) {

                    candidateGrid.innerHTML =
                        "<p>No approved candidates yet.</p>";

                    return;
                }


                snapshot.forEach(
                    function (candidateDoc) {

                        const candidate =
                            candidateDoc.data();


                        let photoHTML =
                            "";


                        if (candidate.photo) {

                            photoHTML =
                                "<img src=\"" +
                                escapeHTML(
                                    candidate.photo
                                ) +
                                "\" alt=\"" +
                                escapeHTML(
                                    candidate.name ||
                                    "Candidate"
                                ) +
                                "\" class=\"candidate-grid-photo\">";
                        }


                        let manifestoHTML =
                            "";


                        if (candidate.manifesto) {

                            manifestoHTML =
                                "<p>" +
                                escapeHTML(
                                    candidate.manifesto
                                ) +
                                "</p>";
                        }


                        candidateGrid.innerHTML +=
                            "<div class=\"card\">" +

                            photoHTML +

                            "<h3>" +
                            escapeHTML(
                                candidate.name ||
                                "No Name"
                            ) +
                            "</h3>" +

                            "<p><strong>Position:</strong> " +
                            escapeHTML(
                                candidate.position ||
                                "N/A"
                            ) +
                            "</p>" +

                            "<p><strong>Year:</strong> " +
                            escapeHTML(
                                candidate.year ||
                                "N/A"
                            ) +
                            "</p>" +

                            manifestoHTML +

                            "</div>";

                    }
                );


            } catch (error) {

                console.error(
                    "Candidate loading error:",
                    error
                );


                candidateGrid.innerHTML =
                    "<p>Unable to load candidates at the moment.</p>";
            }
        }


        /* =================================================
        LOAD PUBLIC CANDIDATES ON PAGE LOAD
        ================================================= */

        loadCandidates();


        console.log(
            "Election portal initialized."
        );

        console.log(
            "Election ID:",
            ELECTION_ID
        );

        console.log(
            "Election deadline:",
            ELECTION_DEADLINE.toString()
        );

    }
);
// ============================================
// PART 2 — VOTER LOGIN + ELIGIBILITY + BALLOT
// ============================================


/* =================================================
CREATE EMAIL/PASSWORD LOGIN FORM
========================================================= */

function setupVoterLoginForm() {

    if (!phoneForm) {

        console.error(
            "phoneForm element was not found."
        );

        return;
    }


    phoneForm.innerHTML = `
        <div class="form-group">

            <label for="voterEmail">
                Email Address
            </label>

            <input
                type="email"
                id="voterEmail"
                autocomplete="email"
                placeholder="Enter your verified email"
                required
            >

        </div>


        <div class="form-group">

            <label for="voterPassword">
                Password
            </label>

            <input
                type="password"
                id="voterPassword"
                autocomplete="current-password"
                placeholder="Enter your password"
                required
            >

        </div>


        <button
            type="submit"
            class="view"
        >
            Sign In
        </button>


        <button
            type="button"
            id="resendVerification"
            class="view"
            style="display:none; margin-top:10px;"
        >
            Resend Verification Email
        </button>


        <p
            id="loginMessage"
            class="form-message"
        ></p>
    `;


    phoneForm.addEventListener(
        "submit",
        handleVoterLogin
    );


    const resendButton =
        document.getElementById(
            "resendVerification"
        );


    if (resendButton) {

        resendButton.addEventListener(
            "click",
            async function () {

                try {

                    const email =
                        document
                            .getElementById(
                                "voterEmail"
                            )
                            ?.value
                            .trim();

                    const password =
                        document
                            .getElementById(
                                "voterPassword"
                            )
                            ?.value;


                    if (
                        !email ||
                        !password
                    ) {

                        showLoginMessage(
                            "Enter your email and password first.",
                            "error"
                        );

                        return;
                    }


                    const result =
                        await signInWithEmailAndPassword(
                            auth,
                            email,
                            password
                        );


                    if (
                        result.user.emailVerified
                    ) {

                        showLoginMessage(
                            "Your email is already verified. You can sign in.",
                            "success"
                        );

                        await signOut(
                            auth
                        );

                        return;
                    }


                    await sendEmailVerification(
                        result.user
                    );


                    showLoginMessage(
                        "A new verification email has been sent. Please check your inbox.",
                        "success"
                    );


                    await signOut(
                        auth
                    );


                } catch (error) {

                    console.error(
                        "Resend verification error:",
                        error
                    );


                    showLoginMessage(
                        "Unable to resend the verification email. Please check your email and password.",
                        "error"
                    );
                }
            }
        );
    }
}


/* =================================================
LOGIN MESSAGE
========================================================= */

function showLoginMessage(
    message,
    type = "error"
) {

    const messageElement =
        document.getElementById(
            "loginMessage"
        );


    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        message;


    messageElement.style.display =
        "block";


    if (
        type === "success"
    ) {

        messageElement.style.color =
            "green";

    } else {

        messageElement.style.color =
            "red";
    }
}


/* =================================================
GET APPROVED VOTER
========================================================= */

async function getEligibleVoter(uid) {

    try {

        const voterRef =
            doc(
                db,
                ELIGIBLE_VOTERS_COLLECTION,
                uid
            );


        const voterSnap =
            await getDoc(
                voterRef
            );


        if (!voterSnap.exists()) {
            return null;
        }


        const voter =
            voterSnap.data();


        if (
            voter.electionId !== ELECTION_ID ||
            voter.eligible !== true
        ) {

            return null;
        }


        return {

            ...voter,

            hasVoted:
                voter.hasVoted === true

        };


    } catch (error) {

        console.error(
            "Error checking voter eligibility:",
            error
        );

        return null;
    }
}


/* =================================================
HANDLE VOTER LOGIN
========================================================= */

async function handleVoterLogin(
    event
) {

    event.preventDefault();


    const emailInput =
        document.getElementById(
            "voterEmail"
        );

    const passwordInput =
        document.getElementById(
            "voterPassword"
        );


    if (
        !emailInput ||
        !passwordInput
    ) {

        return;
    }


    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    if (
        !email ||
        !password
    ) {

        showLoginMessage(
            "Please enter your email and password.",
            "error"
        );

        return;
    }


    /* ------------------------------------------
    CHECK ELECTION DEADLINE
    ------------------------------------------ */

    if (
        !electionIsOpen()
    ) {

        showLoginMessage(
            "Voting is currently closed.",
            "error"
        );

        return;
    }


    showLoginMessage(
        "Signing you in...",
        "success"
    );


    const loginButton =
        phoneForm?.querySelector(
            'button[type="submit"]'
        );


    if (loginButton) {

        loginButton.disabled =
            true;

        loginButton.textContent =
            "Signing In...";
    }


    try {

        /* --------------------------------------
        FIREBASE AUTH LOGIN
        -------------------------------------- */

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        console.log(
            "Firebase user:",
            user.uid
        );


        /* --------------------------------------
        EMAIL VERIFICATION
        -------------------------------------- */

        if (
            !user.emailVerified
        ) {

            const resendButton =
                document.getElementById(
                    "resendVerification"
                );


            if (resendButton) {

                resendButton.style.display =
                    "block";
            }


            showLoginMessage(
                "Your email address has not been verified. Please verify your email before voting.",
                "error"
            );


            return;
        }


        /* --------------------------------------
        IMPORTANT

        DO NOT CHECK ELIGIBILITY HERE.

        DO NOT CALL prepareBallot() HERE.

        onAuthStateChanged() is the SINGLE
        controller for the ballot.
        -------------------------------------- */

        showLoginMessage(
            "Checking your voter approval...",
            "success"
        );


    } catch (error) {

        console.error(
            "Voter login error:",
            error
        );


        let message =
            "Unable to sign in. Please check your email and password.";


        if (
            error.code ===
            "auth/invalid-credential"
        ) {

            message =
                "Incorrect email or password.";
        }


        if (
            error.code ===
            "auth/user-not-found"
        ) {

            message =
                "No voter account was found with this email.";
        }


        if (
            error.code ===
            "auth/wrong-password"
        ) {

            message =
                "Incorrect password.";
        }


        if (
            error.code ===
            "auth/too-many-requests"
        ) {

            message =
                "Too many login attempts. Please wait a while and try again.";
        }


        showLoginMessage(
            message,
            "error"
        );


    } finally {

        if (loginButton) {

            loginButton.disabled =
                false;

            loginButton.textContent =
                "Sign In";
        }
    }
}


/* =================================================
LOAD APPROVED CANDIDATES INTO BALLOT
========================================================= */

async function loadBallotCandidates() {

    console.log(
        "================================="
    );

    console.log(
        "LOADING BALLOT CANDIDATES..."
    );

    console.log(
        "Collection:",
        PUBLIC_CANDIDATES_COLLECTION
    );

    console.log(
        "================================="
    );


    try {

        const candidatesRef =
            collection(
                db,
                PUBLIC_CANDIDATES_COLLECTION
            );


        const candidatesQuery =
            query(
                candidatesRef,
                where(
                    "approved",
                    "==",
                    true
                )
            );


        console.log(
            "Running candidates_public query..."
        );


        const snapshot =
            await getDocs(
                candidatesQuery
            );


        console.log(
            "Approved candidates found:",
            snapshot.size
        );


        /* ----------------------------------------
        CLEAR ALL POSITION CONTAINERS
        ---------------------------------------- */

        electionPositions.forEach(
            function (position) {

                const container =
                    document.getElementById(
                        position.container
                    );


                if (container) {

                    container.innerHTML =
                        "";
                }

            }
        );


        /* ----------------------------------------
        ORGANIZE CANDIDATES
        ---------------------------------------- */

        const candidatesByPosition =
            {};


        electionPositions.forEach(
            function (position) {

                candidatesByPosition[
                    position.label
                ] = [];

            }
        );


        /* ----------------------------------------
        READ CANDIDATES
        ---------------------------------------- */

        snapshot.forEach(
            function (candidateDoc) {

                const candidate =
                    candidateDoc.data();


                console.log(
                    "Candidate document:",
                    candidateDoc.id,
                    candidate
                );


                const candidatePosition =
                    candidate.position;


                console.log(
                    "Candidate position:",
                    candidatePosition
                );


                if (
                    candidatesByPosition[
                        candidatePosition
                    ]
                ) {

                    candidatesByPosition[
                        candidatePosition
                    ].push({

                        id:
                            candidateDoc.id,

                        ...candidate

                    });

                } else {

                    console.warn(
                        "Candidate position does not match an election position:",
                        candidatePosition
                    );
                }

            }
        );


        console.log(
            "Candidates grouped by position:",
            candidatesByPosition
        );


        /* ----------------------------------------
        CREATE BALLOT OPTIONS
        ---------------------------------------- */

        electionPositions.forEach(
            function (position) {

                const container =
                    document.getElementById(
                        position.container
                    );


                if (!container) {

                    console.error(
                        "Ballot container not found:",
                        position.container
                    );

                    return;
                }


                const candidates =
                    candidatesByPosition[
                        position.label
                    ] || [];


                /* --------------------------------
                NO CANDIDATES
                -------------------------------- */

                if (
                    candidates.length === 0
                ) {

                    container.innerHTML = `
                        <p class="form-message">
                            No approved candidates are currently available for this position.
                        </p>
                    `;

                    return;
                }


                /* --------------------------------
                CREATE OPTIONS
                -------------------------------- */

                candidates.forEach(
                    function (candidate) {

                        const wrapper =
                            document.createElement(
                                "label"
                            );


                        wrapper.className =
                            "candidate-option";


                        const radio =
                            document.createElement(
                                "input"
                            );


                        radio.type =
                            "radio";


                        radio.name =
                            `position_${position.key}`;


                        radio.value =
                            candidate.id;


                        radio.dataset.position =
                            position.key;


                        radio.dataset.name =
                            candidate.name || "";


                        const candidateName =
                            document.createElement(
                                "span"
                            );


                        candidateName.textContent =
                            candidate.name ||
                            "Unnamed Candidate";


                        wrapper.appendChild(
                            radio
                        );


                        wrapper.appendChild(
                            candidateName
                        );


                        container.appendChild(
                            wrapper
                        );

                    }
                );

            }
        );


        console.log(
            "================================="
        );

        console.log(
            "BALLOT CANDIDATES LOADED SUCCESSFULLY"
        );

        console.log(
            "================================="
        );


    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "LOAD BALLOT CANDIDATES FAILED"
        );

        console.error(
            "Error code:",
            error.code
        );

        console.error(
            "Error message:",
            error.message
        );

        console.error(
            "Full error:",
            error
        );

        console.error(
            "================================="
        );


        if (voteMessage) {

            voteMessage.textContent =
                "Unable to load candidates. Please refresh the page and try again.";

            voteMessage.style.display =
                "block";

            voteMessage.style.color =
                "red";
        }
    }
}


/* =================================================
COLLECT ALL 10 BALLOT SELECTIONS
========================================================= */

function collectBallotSelections() {

    const selections =
        {};


    for (
        const position
        of electionPositions
    ) {

        const selected =
            document.querySelector(
                `input[name="position_${position.key}"]:checked`
            );


        if (!selected) {

            throw new Error(
                `Please select a candidate for ${position.label}.`
            );
        }


        selections[
            position.key
        ] =
            selected.value;
    }


    return selections;
}

// ============================================
// PART 3 — VOTE SUBMISSION + FINAL SECURITY CHECK
// ============================================


/* =================================================
SUBMIT VOTE
========================================================= */

async function submitVoteHandler(event) {

    event.preventDefault();


    /* ------------------------------------------
       CHECK AUTHENTICATION
    ------------------------------------------ */

    const user =
        auth.currentUser;


    if (!user) {

        showVoteMessage(
            "Please sign in before voting.",
            "error"
        );

        return;
    }


    /* ------------------------------------------
       CHECK EMAIL VERIFICATION
    ------------------------------------------ */

    if (!user.emailVerified) {

        showVoteMessage(
            "Please verify your email before voting.",
            "error"
        );

        return;
    }


    /* ------------------------------------------
       CHECK ELECTION DEADLINE
    ------------------------------------------ */

    if (!electionIsOpen()) {

        showVoteMessage(
            "Voting has closed.",
            "error"
        );

        return;
    }


    /* ------------------------------------------
       GET CURRENT ELIGIBILITY FROM FIRESTORE
    ------------------------------------------ */

    try {

        const eligibleVoter =
            await getEligibleVoter(
                user.uid
            );


        console.log(
            "CURRENT ELIGIBLE VOTER:",
            eligibleVoter
        );


        if (!eligibleVoter) {

            currentEligibleVoter =
                null;


            if (ballotSection) {
                ballotSection.style.display =
                    "none";
            }


            if (alreadyVoted) {
                alreadyVoted.style.display =
                    "none";
            }


            if (voteSuccess) {
                voteSuccess.style.display =
                    "none";
            }


            if (phoneForm) {
                phoneForm.style.display =
                    "block";
            }


            showVoteMessage(
                "Your account is not approved to vote in this election.",
                "error"
            );


            return;
        }


        currentEligibleVoter =
            eligibleVoter;


        /* --------------------------------------
           CRITICAL SECOND VOTE CHECK
        -------------------------------------- */

        console.log(
            "HAS VOTED VALUE:",
            eligibleVoter.hasVoted
        );

        console.log(
            "HAS VOTED TYPE:",
            typeof eligibleVoter.hasVoted
        );


        if (
            eligibleVoter.hasVoted === true
        ) {

            console.log(
                "🚫 SECOND VOTE BLOCKED BEFORE setDoc()"
            );


            if (phoneForm) {
                phoneForm.style.display =
                    "none";
            }


            if (ballotSection) {
                ballotSection.style.display =
                    "none";
            }


            if (voteSuccess) {
                voteSuccess.style.display =
                    "none";
            }


            if (alreadyVoted) {

                alreadyVoted.style.display =
                    "block";

                alreadyVoted.innerHTML = `
                    <h3>Vote Already Recorded</h3>

                    <p>
                        Our records show that you have already voted in this election.
                    </p>

                    <p>
                        Each eligible member can vote only once.
                    </p>
                `;
            }


            return;
        }


        /* --------------------------------------
           COLLECT BALLOT
        -------------------------------------- */

        let selections;


        try {

            selections =
                collectBallotSelections();

        } catch (error) {

            showVoteMessage(
                error.message,
                "error"
            );

            return;
        }


        console.log(
            "Vote selections:",
            selections
        );


        /* --------------------------------------
           CONFIRM VOTE
        -------------------------------------- */

        const confirmed =
            confirm(
                "Are you sure you want to submit your vote?\n\nYou will not be able to change your vote after submission."
            );


        if (!confirmed) {
            return;
        }


        /* --------------------------------------
           DISABLE SUBMIT BUTTON
        -------------------------------------- */

        const submitButton =
            document.getElementById(
                "submitVote"
            );


        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Submitting Vote...";
        }


        showVoteMessage(
            "Submitting your vote securely...",
            "success"
        );


        /* --------------------------------------
           CREATE VOTE DOCUMENT
        -------------------------------------- */

        const voteRef =
            doc(
                db,
                VOTES_COLLECTION,
                user.uid
            );


        const voteData = {

            uid:
                user.uid,

            electionId:
                ELECTION_ID,

            selections:
                selections,

            submittedAt:
                serverTimestamp()
        };


        console.log(
            "🚨 ABOUT TO CREATE VOTE DOCUMENT:",
            user.uid
        );


        await setDoc(
            voteRef,
            voteData
        );


        console.log(
            "✅ VOTE DOCUMENT CREATED"
        );


        /* --------------------------------------
           SEND VOTE TO CLOUDFLARE COUNTER
        -------------------------------------- */

        let counterSuccess =
            false;


        try {

            console.log(
                "Sending vote to Cloudflare counter..."
            );


            const counterResponse =
                await fetch(
                    "https://casan-election-counter.tomgarh.workers.dev/process-vote",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                uid:
                                    user.uid
                            })
                    }
                );


            const counterResult =
                await counterResponse.json();


            console.log(
                "COUNTER RESULT:",
                counterResult
            );


            if (
                counterResponse.ok &&
                (
                    counterResult.success === true ||
                    counterResult.alreadyProcessed === true
                )
            ) {

                counterSuccess =
                    true;


                console.log(
                    "Vote counted successfully."
                );


            } else {

                console.error(
                    "Vote was saved, but counter did not confirm processing."
                );
            }


        } catch (counterError) {

            console.error(
                "Cloudflare counter error:",
                counterError
            );
        }


        /* --------------------------------------
           SUCCESS
           
           IMPORTANT:
           The old code displayed "alreadyVoted"
           here. That was incorrect.

           A successful FIRST vote must show
           voteSuccess instead.
        -------------------------------------- */

        console.log(
            "Vote submitted successfully."
        );


        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Vote Submitted";
        }


        /* --------------------------------------
           HIDE BALLOT
        -------------------------------------- */

        if (ballotSection) {

            ballotSection.style.display =
                "none";
        }


        /* --------------------------------------
           HIDE LOGIN
        -------------------------------------- */

        if (voterLogin) {

            voterLogin.style.display =
                "none";
        }


        /* --------------------------------------
           HIDE ALREADY VOTED CARD
        -------------------------------------- */

        if (alreadyVoted) {

            alreadyVoted.style.display =
                "none";
        }


        /* --------------------------------------
           SHOW SUCCESS CARD
        -------------------------------------- */

        if (voteSuccess) {

            voteSuccess.style.display =
                "block";

            voteSuccess.innerHTML = `
                <h3>✓ Vote Successfully Submitted</h3>

                <p>
                    Your vote has been successfully submitted and securely recorded.
                </p>

                ${
                    counterSuccess
                        ? `
                            <p>
                                Your vote has also been counted successfully.
                            </p>
                          `
                        : `
                            <p>
                                Your vote count is being processed.
                            </p>
                          `
                }

                <p>
                    Thank you for participating in the Old Boys Association Election.
                </p>

                <p>
                    <strong>Each eligible member can vote only once.</strong>
                </p>
            `;
        }


        /* --------------------------------------
           DO NOT USE showVoteMessage() HERE
           
           voteMessage is inside ballotSection
           and ballotSection is now hidden.
           
           The voteSuccess card above is the
           visible confirmation.
        -------------------------------------- */


        /* --------------------------------------
           SIGN OUT AFTER SUCCESSFUL VOTE
        -------------------------------------- */

        console.log(
            "SUCCESSFUL VOTE CODE REACHED - SIGNOUT TIMER STARTING"
        );


        setTimeout(
            async function () {

                try {

                    await signOut(
                        auth
                    );


                } catch (signOutError) {

                    console.error(
                        "Sign-out error:",
                        signOutError
                    );
                }

            },
            2500
        );


    } catch (error) {

        console.error(
            "Vote submission error:",
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


        let message =
            "Your vote could not be submitted. Please try again.";


        /* --------------------------------------
           FIRESTORE PERMISSION DENIED
        -------------------------------------- */

        if (
            error.code ===
            "permission-denied"
        ) {

            message =
                "Vote submission was blocked by the election security rules. Please contact the election administrator.";
        }


        /* --------------------------------------
           ALREADY EXISTS
        -------------------------------------- */

        if (
            error.code ===
            "already-exists"
        ) {

            message =
                "A vote has already been submitted from this account. You cannot vote again.";
        }


        showVoteMessage(
            message,
            "error"
        );


        /* --------------------------------------
           HIDE BALLOT AFTER BLOCKED ATTEMPT
        -------------------------------------- */

        if (
            error.code ===
            "permission-denied"
        ) {

            if (ballotSection) {
                ballotSection.style.display =
                    "none";
            }


            if (voteSuccess) {
                voteSuccess.style.display =
                    "none";
            }


            if (alreadyVoted) {

                alreadyVoted.style.display =
                    "block";

                alreadyVoted.innerHTML = `
                    <h3>Vote Already Recorded</h3>

                    <p>
                        This account cannot submit another vote.
                    </p>
                `;
            }


            console.log(
                "VOTE BLOCKED - SIGNING USER OUT"
            );


            setTimeout(
                async function () {

                    try {

                        await signOut(
                            auth
                        );

                    } catch (signOutError) {

                        console.error(
                            "Sign-out error:",
                            signOutError
                        );
                    }

                },
                2000
            );


            return;
        }


        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Submit Vote";
        }
    }
}


/* =================================================
VOTE MESSAGE
========================================================= */

function showVoteMessage(
    message,
    type = "error"
) {

    const messageElement =
        document.getElementById(
            "voteMessage"
        );


    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        message;


    messageElement.style.display =
        "block";


    if (
        type === "success"
    ) {

        messageElement.style.color =
            "green";

    } else {

        messageElement.style.color =
            "red";
    }
}


/* =================================================
CONNECT SUBMIT BUTTON
========================================================= */

function setupVoteSubmission() {

    const submitButton =
        document.getElementById(
            "submitVote"
        );


    if (!submitButton) {

        console.error(
            "submitVote button was not found."
        );

        return;
    }


    submitButton.addEventListener(
        "click",
        submitVoteHandler
    );
}


/* =================================================
AUTH STATE MONITOR

THIS IS THE SINGLE SOURCE OF TRUTH FOR THE BALLOT

IMPORTANT:
This listener is started only after the DOM
elements have been found.
========================================================= */

function startAuthStateListener() {

    onAuthStateChanged(
        auth,
        async function (user) {

            console.log(
                "AUTH STATE:",
                user ? user.email : "SIGNED OUT"
            );


            /* --------------------------------------
            ALWAYS HIDE BALLOT FIRST
            -------------------------------------- */

            if (ballotSection) {
                ballotSection.style.display =
                    "none";
            }

            if (alreadyVoted) {
                alreadyVoted.style.display =
                    "none";
            }


            /* --------------------------------------
            USER SIGNED OUT
            -------------------------------------- */

            if (!user) {

                currentEligibleVoter =
                    null;


                /*
                IMPORTANT:

                If voteSuccess is visible, it means
                the voter has JUST successfully voted.

                Keep the success card visible and
                keep the login hidden.

                On a fresh page load, voteSuccess
                starts hidden, so the normal login
                appears.
                */

                if (
                    voteSuccess &&
                    voteSuccess.style.display === "block"
                ) {

                    if (voterLogin) {
                        voterLogin.style.display =
                            "none";
                    }

                    return;
                }


                if (voterLogin) {
                    voterLogin.style.display =
                        "block";
                }


                return;
            }


            console.log(
                "USER UID:",
                user.uid
            );

            console.log(
                "EMAIL VERIFIED:",
                user.emailVerified
            );


            /* --------------------------------------
            EMAIL NOT VERIFIED
            -------------------------------------- */

            if (!user.emailVerified) {

                if (voterLogin) {
                    voterLogin.style.display =
                        "block";
                }


                showLoginMessage(
                    "Please verify your email before voting.",
                    "error"
                );


                return;
            }


            /* --------------------------------------
            ELECTION DEADLINE
            -------------------------------------- */

            if (!electionIsOpen()) {

                if (voterLogin) {
                    voterLogin.style.display =
                        "block";
                }


                showLoginMessage(
                    "Voting is currently closed.",
                    "error"
                );


                return;
            }


            /* --------------------------------------
            CHECK ELIGIBILITY
            -------------------------------------- */

            try {

                console.log(
                    "CHECKING ELIGIBLE_VOTERS DOCUMENT..."
                );


                const eligibleVoter =
                    await getEligibleVoter(
                        user.uid
                    );


                console.log(
                    "ELIGIBLE VOTER RESULT:",
                    eligibleVoter
                );


                /* ----------------------------------
                NOT ELIGIBLE
                ---------------------------------- */

                if (!eligibleVoter) {

                    console.log(
                        "NO ELIGIBLE VOTER DOCUMENT FOUND."
                    );


                    currentEligibleVoter =
                        null;


                    if (voterLogin) {
                        voterLogin.style.display =
                            "block";
                    }


                    showLoginMessage(
                        "Your voter registration has not been approved yet. Please wait for the administrator to approve you.",
                        "error"
                    );


                    return;
                }


                /* ----------------------------------
                SAVE VOTER
                ---------------------------------- */

                currentEligibleVoter = {

                    uid:
                        user.uid,

                    email:
                        user.email,

                    ...eligibleVoter
                };


                console.log(
                    "CURRENT ELIGIBLE VOTER:",
                    currentEligibleVoter
                );


                console.log(
                    "HAS VOTED VALUE:",
                    eligibleVoter.hasVoted
                );

                console.log(
                    "HAS VOTED TYPE:",
                    typeof eligibleVoter.hasVoted
                );


                /* ----------------------------------
                ALREADY VOTED
                ---------------------------------- */

                if (
                    eligibleVoter.hasVoted === true
                ) {

                    console.log(
                        "🚫 VOTER ALREADY VOTED — BALLOT WILL NOT OPEN."
                    );


                    if (voterLogin) {
                        voterLogin.style.display =
                            "none";
                    }


                    if (ballotSection) {
                        ballotSection.style.display =
                            "none";
                    }


                    if (voteSuccess) {
                        voteSuccess.style.display =
                            "none";
                    }


                    if (alreadyVoted) {

                        alreadyVoted.style.display =
                            "block";

                        alreadyVoted.innerHTML = `
                            <h3>Vote Already Recorded</h3>

                            <p>
                                Our records show that you have already voted in this election.
                            </p>

                            <p>
                                Each eligible member can vote only once.
                            </p>
                        `;
                    }


                    return;
                }


                /* ----------------------------------
                ELIGIBLE + HAS NOT VOTED
                ---------------------------------- */

                console.log(
                    "✅ VOTER IS ELIGIBLE AND HAS NOT VOTED."
                );


                if (voterLogin) {
                    voterLogin.style.display =
                        "none";
                }


                if (alreadyVoted) {
                    alreadyVoted.style.display =
                        "none";
                }


                if (voteSuccess) {
                    voteSuccess.style.display =
                        "none";
                }


                /* ----------------------------------
                LOAD BALLOT
                ---------------------------------- */

                await loadBallotCandidates();


                /* ----------------------------------
                SHOW BALLOT ONLY NOW
                ---------------------------------- */

                if (ballotSection) {
                    ballotSection.style.display =
                        "block";
                }


                console.log(
                    "🗳️ BALLOT OPENED FOR:",
                    user.email
                );


            } catch (error) {

                console.error(
                    "AUTH / ELIGIBILITY ERROR:",
                    error
                );


                /* ----------------------------------
                FAIL CLOSED
                ---------------------------------- */

                if (ballotSection) {
                    ballotSection.style.display =
                        "none";
                }


                if (alreadyVoted) {
                    alreadyVoted.style.display =
                        "none";
                }


                if (voteSuccess) {
                    voteSuccess.style.display =
                        "none";
                }


                if (voterLogin) {
                    voterLogin.style.display =
                        "block";
                }


                showLoginMessage(
                    "We could not verify your voter approval. Please refresh the page and try again.",
                    "error"
                );
            }
        }
    );
}


/* =================================================
FINAL ELECTION UI INITIALIZER

EVERYTHING THAT DEPENDS ON THE DOM STARTS HERE.
========================================================= */

function initializeElectionUI() {

    console.log(
        "Initializing election UI..."
    );


    /* --------------------------------------
    VERIFY REQUIRED ELEMENTS
    -------------------------------------- */

    voterLogin =
        document.getElementById(
            "voterLogin"
        );

    phoneForm =
        document.getElementById(
            "phoneForm"
        );

    ballotSection =
        document.getElementById(
            "ballotSection"
        );

    alreadyVoted =
        document.getElementById(
            "alreadyVoted"
        );

    voteSuccess =
        document.getElementById(
            "voteSuccess"
        );

    voteMessage =
        document.getElementById(
            "voteMessage"
        );


    console.log(
        "voterLogin:",
        voterLogin
    );

    console.log(
        "phoneForm:",
        phoneForm
    );

    console.log(
        "ballotSection:",
        ballotSection
    );

    console.log(
        "alreadyVoted:",
        alreadyVoted
    );

    console.log(
        "voteSuccess:",
        voteSuccess
    );


    /* --------------------------------------
    MAKE SURE SUCCESS CARD STARTS HIDDEN
    -------------------------------------- */

    if (voteSuccess) {

        voteSuccess.style.display =
            "none";
    }


    /* --------------------------------------
    SETUP LOGIN
    -------------------------------------- */

    setupVoterLoginForm();


    /* --------------------------------------
    SETUP VOTE SUBMISSION
    -------------------------------------- */

    setupVoteSubmission();


    /* --------------------------------------
    START AUTH MONITOR

    IMPORTANT:
    Firebase auth state is now monitored
    only after all DOM elements exist.
    -------------------------------------- */

    startAuthStateListener();


    console.log(
        "Election UI initialized successfully."
    );
}


/* =================================================
START EVERYTHING AFTER DOM IS READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeElectionUI,
        {
            once: true
        }
    );

} else {

    initializeElectionUI();

}
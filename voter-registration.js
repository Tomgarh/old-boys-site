import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// =====================================
// FIREBASE CONFIG
// =====================================

const firebaseConfig = {
    apiKey: "AIzaSyCX2CWL0n0oZsnIjlyaB5YXt4bYl_mPWiQ",
    authDomain: "casan-election-portal.firebaseapp.com",
    projectId: "casan-election-portal",
    storageBucket: "casan-election-portal.firebasestorage.app",
    messagingSenderId: "614342710645",
    appId: "1:614342710645:web:1cfd27fa72d54b11c42f3c",
    measurementId: "G-XVX56E5PSP"
};


// =====================================
// INITIALIZE FIREBASE
// =====================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);


// =====================================
// DOM ELEMENTS
// =====================================

// Authentication
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

const createAccountButton =
    document.getElementById("createAccountButton");

const signInButton =
    document.getElementById("signInButton");

const signOutButton =
    document.getElementById("signOutButton");

const authMessage =
    document.getElementById("authMessage");

const accountStatus =
    document.getElementById("accountStatus");

const accountStatusText =
    document.getElementById("accountStatusText");


// Verification form
const voterForm =
    document.getElementById("voterForm");

const fullNameInput =
    document.getElementById("fullName");

const phoneInput =
    document.getElementById("phone");

const emailInput =
    document.getElementById("email");

const inductionYearInput =
    document.getElementById("inductionYear");

const formMessage =
    document.getElementById("formMessage");

const submitButton =
    document.getElementById("submitButton");

const successMessage =
    document.getElementById("successMessage");

const loginRequiredMessage =
    document.getElementById("loginRequiredMessage");


// =====================================
// CURRENT USER
// =====================================

let currentUser = null;


// =====================================
// HELPER: SHOW AUTH MESSAGE
// =====================================

function showAuthMessage(message, type = "") {

    authMessage.textContent = message;

    authMessage.className = "form-message";

    if (type) {
        authMessage.classList.add(type);
    }

}


// =====================================
// HELPER: SHOW FORM MESSAGE
// =====================================

function showFormMessage(message, type = "") {

    formMessage.textContent = message;

    formMessage.className = "form-message";

    if (type) {
        formMessage.classList.add(type);
    }

}


// =====================================
// CREATE ACCOUNT
// =====================================

createAccountButton.addEventListener("click", async () => {

    const email = authEmail.value.trim().toLowerCase();
    const password = authPassword.value;


    if (!email || !password) {

        showAuthMessage(
            "Please enter your email address and password.",
            "error"
        );

        return;
    }


    if (password.length < 6) {

        showAuthMessage(
            "Your password must contain at least 6 characters.",
            "error"
        );

        return;
    }


    createAccountButton.disabled = true;

    signInButton.disabled = true;

    showAuthMessage("Creating your election account...");


    try {

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user = userCredential.user;


        // Send verification email
        await sendEmailVerification(user);


        showAuthMessage(
            "Account created successfully. Please check your email and verify your email address before continuing.",
            "success"
        );


        authPassword.value = "";


    } catch (error) {

        console.error(
            "Account creation error:",
            error
        );


        if (error.code === "auth/email-already-in-use") {

            showAuthMessage(
                "An account already exists with this email. Please sign in instead.",
                "error"
            );

        } else if (error.code === "auth/invalid-email") {

            showAuthMessage(
                "Please enter a valid email address.",
                "error"
            );

        } else if (error.code === "auth/weak-password") {

            showAuthMessage(
                "Your password is too weak. Use at least 6 characters.",
                "error"
            );

        } else {

            showAuthMessage(
                "Unable to create the account. Please try again.",
                "error"
            );
        }

    } finally {

        createAccountButton.disabled = false;

        signInButton.disabled = false;

    }

});


// =====================================
// SIGN IN
// =====================================

signInButton.addEventListener("click", async () => {

    const email = authEmail.value.trim().toLowerCase();
    const password = authPassword.value;


    if (!email || !password) {

        showAuthMessage(
            "Please enter your email address and password.",
            "error"
        );

        return;
    }


    signInButton.disabled = true;

    createAccountButton.disabled = true;

    showAuthMessage("Signing you in...");


    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user = userCredential.user;


        // Refresh user information
        await user.reload();


        if (!user.emailVerified) {

            showAuthMessage(
                "Your email has not been verified yet. Please check your email and click the verification link.",
                "error"
            );

            return;
        }


        showAuthMessage(
            "Signed in successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Sign in error:",
            error
        );


        if (
            error.code === "auth/invalid-credential" ||
            error.code === "auth/wrong-password" ||
            error.code === "auth/user-not-found"
        ) {

            showAuthMessage(
                "Incorrect email or password.",
                "error"
            );

        } else {

            showAuthMessage(
                "Unable to sign in. Please check your details and try again.",
                "error"
            );
        }

    } finally {

        signInButton.disabled = false;

        createAccountButton.disabled = false;

    }

});


// =====================================
// SIGN OUT
// =====================================

signOutButton.addEventListener("click", async () => {

    try {

        await signOut(auth);

        showAuthMessage(
            "You have been signed out.",
            "success"
        );

    } catch (error) {

        console.error(
            "Sign out error:",
            error
        );

        showAuthMessage(
            "Unable to sign out.",
            "error"
        );

    }

});


// =====================================
// AUTH STATE
// =====================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        currentUser = null;

        accountStatus.style.display = "none";

        voterForm.style.display = "none";

        loginRequiredMessage.style.display = "block";

        submitButton.disabled = true;

        return;
    }


    currentUser = user;


    // Refresh authentication information
    try {

        await user.reload();

    } catch (error) {

        console.error(
            "Unable to refresh user:",
            error
        );

    }


    // =================================
    // EMAIL NOT VERIFIED
    // =================================

    if (!user.emailVerified) {

        accountStatus.style.display = "block";

        accountStatusText.textContent =
            `Signed in as ${user.email}. Please verify your email address before submitting your voter information.`;

        voterForm.style.display = "none";

        loginRequiredMessage.style.display = "block";

        submitButton.disabled = true;

        return;
    }


    // =================================
    // VERIFIED USER
    // =================================

    accountStatus.style.display = "block";

    accountStatusText.textContent =
        `Signed in as ${user.email}. Your email has been verified.`;


    voterForm.style.display = "block";

    loginRequiredMessage.style.display = "none";


    // Use Firebase account email
    emailInput.value = user.email;


    // =================================
    // CHECK EXISTING VOTER REQUEST
    // =================================

    try {

        const voterRef = doc(
            db,
            "voter_requests",
            user.uid
        );


        const voterSnapshot =
            await getDoc(voterRef);


        if (voterSnapshot.exists()) {

            const voterData =
                voterSnapshot.data();


            if (
                voterData.status === "approved" ||
                voterData.approved === true
            ) {

                showFormMessage(
                    "Your voter verification has already been approved.",
                    "success"
                );

            } else if (
                voterData.status === "rejected"
            ) {

                showFormMessage(
                    "Your voter verification request was rejected. Please contact the election administrator.",
                    "error"
                );

            } else {

                showFormMessage(
                    "Your voter verification request has already been submitted and is awaiting review."
                );
            }


            submitButton.disabled = true;


        } else {

            submitButton.disabled = false;

        }

    } catch (error) {

        console.error(
            "Error checking voter request:",
            error
        );

    }

});


// =====================================
// SUBMIT VOTER VERIFICATION
// =====================================

voterForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    // =================================
    // CHECK LOGIN
    // =================================

    if (!currentUser) {

        showFormMessage(
            "Please sign in before submitting your verification.",
            "error"
        );

        return;
    }


    // =================================
    // CHECK EMAIL VERIFICATION
    // =================================

    await currentUser.reload();


    if (!currentUser.emailVerified) {

        showFormMessage(
            "Please verify your email address before submitting your voter information.",
            "error"
        );

        return;
    }


    // =================================
    // GET FORM VALUES
    // =================================

    const fullName =
        fullNameInput.value.trim();

    const phone =
        phoneInput.value.trim();

    const email =
        emailInput.value.trim().toLowerCase();

    const inductionYear =
        inductionYearInput.value.trim();


    // =================================
    // BASIC VALIDATION
    // =================================

    if (
        !fullName ||
        !phone ||
        !email ||
        !inductionYear
    ) {

        showFormMessage(
            "Please complete all required fields.",
            "error"
        );

        return;
    }


    // =================================
    // EMAIL MUST MATCH ACCOUNT
    // =================================

    if (
        !currentUser.email ||
        currentUser.email.toLowerCase() !== email
    ) {

        showFormMessage(
            "The email address must match your election account.",
            "error"
        );

        return;
    }


    // =================================
    // DISABLE BUTTON
    // =================================

    submitButton.disabled = true;

    submitButton.textContent =
        "Submitting...";


    showFormMessage("");


    try {

        const voterRef = doc(
            db,
            "voter_requests",
            currentUser.uid
        );


        // =================================
        // CHECK AGAIN
        // =================================

        const existingRequest =
            await getDoc(voterRef);


        if (existingRequest.exists()) {

            showFormMessage(
                "A voter verification request already exists for this account.",
                "error"
            );

            submitButton.textContent =
                "Already Submitted";

            return;
        }


        // =================================
        // CREATE VOTER REQUEST
        // =================================

        await setDoc(
            voterRef,
            {

                uid: currentUser.uid,

                fullName: fullName,

                phone: phone,

                email: email,

                inductionYear: inductionYear,

                electionId: "oldboys-election-2026",

                status: "pending",

                approved: false,

                submittedAt: serverTimestamp()

            }
        );


        // =================================
        // HIDE FORM
        // =================================

        voterForm.style.display =
            "none";


        // =================================
        // SHOW SUCCESS
        // =================================

        successMessage.style.display =
            "block";


        showFormMessage("");


    } catch (error) {

        console.error(
            "Error submitting voter verification:",
            error
        );


        showFormMessage(
            "Something went wrong while submitting your details. Please try again.",
            "error"
        );


        submitButton.disabled = false;

        submitButton.textContent =
            "Submit for Verification";

    }

});
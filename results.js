import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {
    apiKey: "AIzaSyCX2CWL0n0oZsnIjlyaB5YXt4bYl_mPWiQ",
    authDomain: "casan-election-portal.firebaseapp.com",
    projectId: "casan-election-portal",
    storageBucket: "casan-election-portal.firebasestorage.app",
    messagingSenderId: "614342645",
    appId: "1:614342645:web:1cfd27fa72d54b11c42f3c",
    measurementId: "G-XVX56E5PSP"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// =====================================================
// CONSTANTS
// =====================================================

const ELECTION_ID = "oldboys-election-2026";

const resultsContainer = document.getElementById("resultsContainer");


// =====================================================
// ELECTION POSITIONS
// =====================================================

const electionPositions = [
    {
        key: "chairman",
        label: "Chairman"
    },
    {
        key: "viceChairman",
        label: "Vice Chairman"
    },
    {
        key: "secretary",
        label: "Secretary"
    },
    {
        key: "assistantSecretary",
        label: "Assistant Secretary"
    },
    {
        key: "financialSecretary",
        label: "Financial Secretary"
    },
    {
        key: "treasurer",
        label: "Treasurer"
    },
    {
        key: "pro",
        label: "Public Relations Officer (PRO)"
    },
    {
        key: "welfare",
        label: "Welfare Officer"
    },
    {
        key: "sportsSocials",
        label: "Director of Sports and Socials"
    },
    {
        key: "spirituality",
        label: "Director of Spirituality"
    }
];


// =====================================================
// DATA STORAGE
// =====================================================

let candidates = [];
let voteResults = {};


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// LOAD APPROVED CANDIDATES IN REAL TIME
// =====================================================

function listenToCandidates() {

    const candidatesQuery = query(
        collection(db, "candidates_public"),
        where("approved", "==", true)
    );


    onSnapshot(
        candidatesQuery,

        snapshot => {

            candidates = [];

            snapshot.forEach(docSnapshot => {

                candidates.push({
                    id: docSnapshot.id,
                    ...docSnapshot.data()
                });

            });

            renderResults();
        },

        error => {

            console.error("Candidate listener error:", error);

            resultsContainer.innerHTML = `
                <div class="error">
                    Unable to load candidates.
                    Please try again later.
                </div>
            `;
        }
    );
}


// =====================================================
// LISTEN TO LIVE VOTE COUNTS
// =====================================================

function listenToResults() {

    const resultsQuery = query(
        collection(db, "election_results"),
        where("electionId", "==", ELECTION_ID)
    );


    onSnapshot(
        resultsQuery,

        snapshot => {

            voteResults = {};


            snapshot.forEach(docSnapshot => {

                const data = docSnapshot.data();

                voteResults[docSnapshot.id] = {
                    voteCount: Number(data.voteCount || 0)
                };

            });


            renderResults();
        },

        error => {

            console.error("Results listener error:", error);

            resultsContainer.innerHTML = `
                <div class="error">
                    Unable to load live vote counts.
                    Please try again later.
                </div>
            `;
        }
    );
}


// =====================================================
// GET VOTE COUNT
// =====================================================

function getVoteCount(candidateId) {

    if (!voteResults[candidateId]) {
        return 0;
    }

    return voteResults[candidateId].voteCount || 0;
}


// =====================================================
// RENDER RESULTS
// =====================================================

function renderResults() {

    if (!candidates.length) {

        resultsContainer.innerHTML = `
            <div class="empty">
                No approved candidates found.
            </div>
        `;

        return;
    }


    let html = "";


    electionPositions.forEach(position => {

        const positionCandidates = candidates
            .filter(candidate => candidate.position === position.label)
            .map(candidate => ({
                ...candidate,
                voteCount: getVoteCount(candidate.id)
            }))
            .sort((a, b) => b.voteCount - a.voteCount);


        if (!positionCandidates.length) {
            return;
        }


        const highestVotes = Math.max(
            ...positionCandidates.map(candidate => candidate.voteCount)
        );


        html += `
            <section class="position-section">

                <h2 class="position-title">
                    ${escapeHTML(position.label)}
                </h2>

                <div class="candidates">
        `;


        positionCandidates.forEach(candidate => {

            const isLeader =
                highestVotes > 0 &&
                candidate.voteCount === highestVotes;


            const photo =
                candidate.photo ||
                candidate.photoUrl ||
                candidate.image ||
                "";


            html += `

                <div class="candidate-card ${isLeader ? "leader" : ""}">

                    ${
                        isLeader
                            ? `<div class="leader-badge">CURRENT LEADER</div>`
                            : ""
                    }

                    ${
                        photo
                            ? `
                                <img
                                    class="candidate-photo"
                                    src="${escapeHTML(photo)}"
                                    alt="${escapeHTML(candidate.name || "Candidate")}"
                                    onerror="this.style.display='none'"
                                >
                            `
                            : ""
                    }

                    <div class="candidate-name">
                        ${escapeHTML(candidate.name || "Unnamed Candidate")}
                    </div>

                    <div class="vote-count">
                        ${candidate.voteCount}
                    </div>

                    <div class="vote-label">
                        ${candidate.voteCount === 1 ? "Vote" : "Votes"}
                    </div>

                </div>

            `;
        });


        html += `
                </div>
            </section>
        `;
    });


    resultsContainer.innerHTML = html;
}


// =====================================================
// START LIVE LISTENERS
// =====================================================

listenToCandidates();

listenToResults();
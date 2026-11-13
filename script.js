// Initial State
let pollData = JSON.parse(localStorage.getItem("advancedPollData")) || {
  title: "Who should be the next Project Lead?",
  endTime: Date.now() + 5 * 60 * 1000, // 5 minutes from now
  candidates: [
    { id: 1, name: "Amina Ochieng", role: "Frontend Architect", votes: 4 },
    { id: 2, name: "David Kamau", role: "Backend Engineer", votes: 6 },
    { id: 3, name: "Grace Wanjiku", role: "Product Designer", votes: 3 }
  ]
};

let userVotedId = JSON.parse(localStorage.getItem("userVotedId")) || null;
let draftCandidates = [...pollData.candidates];
let timerInterval;

// DOM Elements
const optionsList = document.getElementById("options-list");
const totalCount = document.getElementById("total-count");
const pollTitleEl = document.getElementById("poll-title");
const countdownEl = document.getElementById("countdown");
const pollStatusEl = document.getElementById("poll-status");
const winnerBanner = document.getElementById("winner-banner");
const adminPanel = document.getElementById("admin-panel");

// Render Main Poll
function renderPoll() {
  pollTitleEl.textContent = pollData.title;
  const totalVotes = pollData.candidates.reduce((sum, c) => sum + c.votes, 0);
  totalCount.textContent = totalVotes;

  // Find highest vote count
  const maxVotes = Math.max(...pollData.candidates.map(c => c.votes), 0);
  const isExpired = Date.now() >= pollData.endTime;

  optionsList.innerHTML = "";

  pollData.candidates.forEach(candidate => {
    const percentage = totalVotes === 0 ? 0 : Math.round((candidate.votes / totalVotes) * 100);
    const isLeading = totalVotes > 0 && candidate.votes === maxVotes;
    const isUserChoice = userVotedId === candidate.id;
    const initials = candidate.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    const row = document.createElement("div");
    row.className = `option-row ${isLeading ? "leading" : ""} ${isUserChoice ? "selected-choice" : ""}`;

    row.innerHTML = `
      <div class="avatar">${initials}</div>
      <div class="option-info">
        <div class="option-header">
          <strong>${candidate.name} ${isLeading ? "👑" : ""}</strong>
          <span><strong>${percentage}%</strong> (${candidate.votes})</span>
        </div>
        <span class="candidate-role">${candidate.role || "Candidate"}</span>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
      </div>
      <button class="vote-btn" data-id="${candidate.id}" ${userVotedId !== null || isExpired ? "disabled" : ""}>
        ${isUserChoice ? "✓ Voted" : "Vote"}
      </button>
    `;
    optionsList.appendChild(row);
  });

  // Attach Vote Events
  document.querySelectorAll(".vote-btn").forEach(btn => {
    btn.addEventListener("click", () => castVote(Number(btn.dataset.id)));
  });

  // Handle Winner Banner if Expired
  if (isExpired) {
    pollStatusEl.textContent = "Poll Ended";
    pollStatusEl.classList.add("ended");
    const winners = pollData.candidates.filter(c => c.votes === maxVotes && maxVotes > 0);
    winnerBanner.classList.remove("hidden");
    winnerBanner.textContent = winners.length > 0
      ? `🏆 Winner: ${winners.map(w => w.name).join(" & ")} (${maxVotes} votes)`
      : "Poll ended with 0 votes.";
  } else {
    pollStatusEl.textContent = "Live Poll";
    pollStatusEl.classList.remove("ended");
    winnerBanner.classList.add("hidden");
  }
}

// Cast a Vote
function castVote(id) {
  if (userVotedId !== null || Date.now() >= pollData.endTime) return;
  const target = pollData.candidates.find(c => c.id === id);
  if (target) {
    target.votes += 1;
    userVotedId = id;
    saveAll();
    renderPoll();
  }
}

// Countdown Timer Logic
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const remaining = pollData.endTime - Date.now();
    if (remaining <= 0) {
      countdownEl.textContent = "00:00";
      clearInterval(timerInterval);
      renderPoll();
      return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    countdownEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, 1000);
}

// Admin Panel Controls
document.getElementById("toggle-admin-btn").addEventListener("click", () => {
  adminPanel.classList.toggle("hidden");
  renderAdminList();
});

function renderAdminList() {
  const list = document.getElementById("admin-candidate-list");
  list.innerHTML = "";
  draftCandidates.forEach((c, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span><strong>${c.name}</strong> (${c.role || "No role"})</span>
      <button onclick="removeDraftCandidate(${index})" style="background:#fee2e2;color:#991b1b;padding:2px 8px;">✕</button>
    `;
    list.appendChild(li);
  });
}

window.removeDraftCandidate = function(index) {
  draftCandidates.splice(index, 1);
  renderAdminList();
};

document.getElementById("add-candidate-btn").addEventListener("click", () => {
  const nameInput = document.getElementById("new-candidate-name");
  const roleInput = document.getElementById("new-candidate-role");
  if (!nameInput.value.trim()) return;

  draftCandidates.push({
    id: Date.now(),
    name: nameInput.value.trim(),
    role: roleInput.value.trim(),
    votes: 0
  });
  nameInput.value = "";
  roleInput.value = "";
  renderAdminList();
});

document.getElementById("start-poll-btn").addEventListener("click", () => {
  if (draftCandidates.length < 2) {
    alert("Please add at least 2 candidates.");
    return;
  }
  const newTitle = document.getElementById("poll-title-input").value.trim() || "Custom Election Poll";
  const mins = parseInt(document.getElementById("timer-minutes").value) || 5;

  pollData = {
    title: newTitle,
    endTime: Date.now() + mins * 60 * 1000,
    candidates: draftCandidates.map(c => ({ ...c, votes: 0 }))
  };
  userVotedId = null;
  saveAll();
  adminPanel.classList.add("hidden");
  startTimer();
  renderPoll();
});

// Clear Vote Button
document.getElementById("reset-vote-btn").addEventListener("click", () => {
  if (userVotedId !== null) {
    const prev = pollData.candidates.find(c => c.id === userVotedId);
    if (prev && prev.votes > 0) prev.votes -= 1;
    userVotedId = null;
    saveAll();
    renderPoll();
  }
});

function saveAll() {
  localStorage.setItem("advancedPollData", JSON.stringify(pollData));
  localStorage.setItem("userVotedId", JSON.stringify(userVotedId));
}

// Initialize
startTimer();
renderPoll();

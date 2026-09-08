/* ============================================================
   CampusTrip — Trip Dashboard
   ============================================================ */

const tripId = qs("id");
let currentUser = null;
let currentProfile = null;
let currentTrip = null;
let isOrganizer = false;
let memberCount = 1;
let showAllQuestions = false;
let latestQuestions = [];

if (!tripId) {
  window.location.href = "home.html";
}

const EXPENSE_ICONS = {
  hotel: "fa-hotel",
  fuel: "fa-gas-pump",
  food: "fa-utensils",
  activities: "fa-star",
  other: "fa-receipt"
};

/* ---------------- Sheets ---------------- */
function bindSheet(backdropId, openBtnId, cancelBtnId) {
  const backdrop = document.getElementById(backdropId);
  if (openBtnId) document.getElementById(openBtnId).addEventListener("click", () => backdrop.classList.add("open"));
  if (cancelBtnId) document.getElementById(cancelBtnId).addEventListener("click", () => backdrop.classList.remove("open"));
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) backdrop.classList.remove("open"); });
  return backdrop;
}

const expenseSheet = bindSheet("expenseSheetBackdrop", "addExpenseBtn", "cancelExpenseBtn");
const questionSheet = bindSheet("questionSheetBackdrop", "askQuestionBtn", "cancelQuestionBtn");
const pollSheet = bindSheet("pollSheetBackdrop", "newPollBtn", "cancelPollBtn");
const menuSheet = bindSheet("menuSheetBackdrop", "tripMenuBtn", null);

/* ---------------- Tabs ---------------- */
document.querySelectorAll(".tab").forEach((tabBtn) => {
  tabBtn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    tabBtn.classList.add("active");
    document.getElementById("panel-" + tabBtn.dataset.tab).classList.add("active");
  });
});

/* ---------------- Boot ---------------- */
requireAuth((user, profile) => {
  currentUser = user;
  currentProfile = profile;
  loadTrip();
  loadMembers();
  loadExpenses();
  loadQuestions();
  loadPoll();
});

function tripRef() { return db.collection("trips").doc(tripId); }

function loadTrip() {
  tripRef().onSnapshot(
    (snap) => {
      if (!snap.exists) {
        showToast("This trip could not be found.", "error");
        setTimeout(() => (window.location.href = "home.html"), 1200);
        return;
      }
      currentTrip = { id: snap.id, ...snap.data() };
      isOrganizer = currentTrip.organizerId === currentUser.uid;
      memberCount = (currentTrip.memberIds || []).length || 1;
      renderTripHero();
      renderShare();
      document.getElementById("tripLoading").classList.add("hidden");
      document.getElementById("tripContent").classList.remove("hidden");
    },
    (err) => {
      console.error(err);
      showToast("Couldn't load trip: " + err.message, "error");
    }
  );
}

function renderTripHero() {
  document.getElementById("topbarTripName").textContent = currentTrip.name;
  document.getElementById("tripName").textContent = currentTrip.name;
  document.getElementById("tripDestination").textContent = currentTrip.destination || "—";
  document.getElementById("tripDates").textContent = currentTrip.dateLabel || "Dates TBD";
  document.getElementById("tripOrganizer").textContent =
  `${currentTrip.organizerId === currentUser.uid
    ? currentProfile.name
    : currentTrip.organizerName || "—"} (Organizer)`;
  document.getElementById("tripMemberCount").textContent = `${memberCount} Member${memberCount === 1 ? "" : "s"}`;
  document.getElementById("tripCodeLabel").textContent = currentTrip.code || "------";

  // Adjust trip menu options based on role
  const menuBody = document.querySelector("#menuSheetBackdrop .sheet");
  const leaveBtn = document.getElementById("leaveTripOption");
  leaveBtn.innerHTML = isOrganizer
    ? '<span class="fi" style="color:#e5484d;"><i class="fa-solid fa-trash"></i></span> Delete Trip'
    : '<span class="fi" style="color:#e5484d;"><i class="fa-solid fa-arrow-right-from-bracket"></i></span> Leave Trip';
}

document.getElementById("shareCodeOption").addEventListener("click", async () => {
  menuSheet.classList.remove("open");
  const text = `Join my trip "${currentTrip.name}" on CampusTrip! Use code: ${currentTrip.code}`;
  try {
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(currentTrip.code);
      showToast("Trip code copied to clipboard!", "success");
    }
  } catch (e) {
    // user cancelled share — ignore
  }
});

document.getElementById("leaveTripOption").addEventListener("click", async () => {
  menuSheet.classList.remove("open");
  if (isOrganizer) {
    if (!confirm(`Delete "${currentTrip.name}" for everyone? This cannot be undone.`)) return;
    await deleteTrip();
  } else {
    if (!confirm(`Leave "${currentTrip.name}"?`)) return;
    await leaveTrip();
  }
});

async function leaveTrip() {
  try {
    const batch = db.batch();
    batch.update(tripRef(), { memberIds: firebase.firestore.FieldValue.arrayRemove(currentUser.uid) });
    batch.delete(tripRef().collection("members").doc(currentUser.uid));
    await batch.commit();
    window.location.href = "home.html";
  } catch (err) {
    showToast("Couldn't leave trip: " + err.message, "error");
  }
}

async function deleteTrip() {
  try {
    const collections = ["members", "expenses", "questions", "polls"];
    const batch = db.batch();
    for (const col of collections) {
      const snap = await tripRef().collection(col).get();
      snap.forEach((doc) => batch.delete(doc.ref));
    }
    if (currentTrip.code) batch.delete(db.collection("tripCodes").doc(currentTrip.code));
    batch.delete(tripRef());
    await batch.commit();
    window.location.href = "home.html";
  } catch (err) {
    showToast("Couldn't delete trip: " + err.message, "error");
  }
}

/* ---------------- Members ---------------- */
async function loadMembers() {
  tripRef().collection("members").orderBy("joinedAt", "asc").onSnapshot(
    async (snap) => {
      if (snap.empty) {
        document.getElementById("membersList").innerHTML =
          `<div class="empty-state">No members yet.</div>`;
        return;
      }

      const rows = [];

      for (const doc of snap.docs) {
        const m = doc.data();

        let name = m.name || "User";
        let email = m.email || "";

        try {
          const userSnap = await db
            .collection("users")
            .doc(doc.id)
            .get();

          if (userSnap.exists) {
            const userData = userSnap.data();

            name = userData.name || name;
            email = userData.email || email;
          }
        } catch (err) {
          console.error("Couldn't load member profile:", err);
        }

        const isOrg = m.role === "Organizer";
        const canRemove =
          isOrganizer && doc.id !== currentUser.uid;

        rows.push(`
          <div class="member-row">
            <div class="avatar">${escapeHtml(initials(name))}</div>

            <div class="name">
              ${escapeHtml(name)}
              <span class="sub">${escapeHtml(email)}</span>
            </div>

            ${
              isOrg
                ? '<span class="badge">Organizer</span>'
                : (
                    canRemove
                      ? `<button class="badge remove" data-uid="${doc.id}">Remove</button>`
                      : ""
                  )
            }
          </div>
        `);
      }

      document.getElementById("membersList").innerHTML =
        rows.join("");

      document.querySelectorAll(".badge.remove").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const uid = btn.dataset.uid;

          if (!confirm("Remove this member from the trip?")) return;

          try {
            const batch = db.batch();

            batch.update(tripRef(), {
              memberIds:
                firebase.firestore.FieldValue.arrayRemove(uid)
            });

            batch.delete(
              tripRef().collection("members").doc(uid)
            );

            await batch.commit();

            showToast("Member removed.");

          } catch (err) {
            showToast(
              "Couldn't remove member: " + err.message,
              "error"
            );
          }
        });
      });
    },
    (err) => console.error(err)
  );
}

/* ---------------- Expenses ---------------- */
let totalExpenses = 0;

function loadExpenses() {
  tripRef().collection("expenses").orderBy("createdAt", "desc").onSnapshot(
    (snap) => {
      if (snap.empty) {
        document.getElementById("expensesList").innerHTML = `<div class="empty-state">No expenses added yet.</div>`;
        totalExpenses = 0;
        renderShare();
        return;
      }
      const rows = [];
      let total = 0;
      snap.forEach((doc) => {
        const ex = doc.data();
        total += Number(ex.amount) || 0;
        const icon = EXPENSE_ICONS[ex.category] || EXPENSE_ICONS.other;
        rows.push(`
          <div class="expense-row">
            <div class="ic"><i class="fa-solid ${icon}"></i></div>
            <div class="info">
              <div class="title">${escapeHtml(ex.title)}</div>
              <div class="sub">Added by ${escapeHtml(ex.paidByName || "—")}</div>
            </div>
            <div class="amount">${formatMoney(ex.amount)} THB</div>
          </div>`);
      });
      document.getElementById("expensesList").innerHTML = rows.join("");
      totalExpenses = total;
      renderShare();
    },
    (err) => console.error(err)
  );
}

function renderShare() {
  const share = memberCount > 0 ? totalExpenses / memberCount : totalExpenses;
  document.getElementById("yourShare").textContent = `${formatMoney(share)} THB`;
}

document.getElementById("expenseForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("expenseTitle").value.trim();
  const category = document.getElementById("expenseCategory").value;
  const amount = parseFloat(document.getElementById("expenseAmount").value);

  if (!title || isNaN(amount) || amount < 0) {
    showToast("Please enter a valid title and amount.", "error");
    return;
  }

  const btn = document.getElementById("saveExpenseBtn");
  setButtonLoading(btn, true);
  try {
    await tripRef().collection("expenses").add({
      title,
      category,
      amount,
      paidBy: currentUser.uid,
      paidByName: currentProfile?.name || "User",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    e.target.reset();
    expenseSheet.classList.remove("open");
    showToast("Expense added!", "success");
  } catch (err) {
    showToast("Couldn't add expense: " + err.message, "error");
  } finally {
    setButtonLoading(btn, false, '<i class="fa-solid fa-plus"></i> Save Expense');
  }
});

/* ---------------- Questions & Answers ---------------- */
function loadQuestions() {
  tripRef().collection("questions").orderBy("createdAt", "desc").onSnapshot(
    (snap) => {
      latestQuestions = [];
      snap.forEach((doc) => latestQuestions.push({ id: doc.id, ...doc.data() }));
      renderQuestions();
    },
    (err) => console.error(err)
  );
}

function renderQuestions() {
  const container = document.getElementById("questionsList");
  if (latestQuestions.length === 0) {
    container.innerHTML = `<div class="empty-state">No questions yet. Be the first to ask!</div>`;
    return;
  }
  const visible = showAllQuestions ? latestQuestions : latestQuestions.slice(0, 2);
  const cards = visible.map((q) => {
    const askedAt = timeAgo(tsToDate(q.createdAt));
    let answerHtml;
    if (q.answerText) {
      const answeredAt = timeAgo(tsToDate(q.answeredAt));
      answerHtml = `
        <div class="qa-answer">
          ${escapeHtml(q.answerText)}
          <div class="a-meta">Answered by ${escapeHtml(q.answeredByName || "—")} • ${answeredAt}</div>
        </div>`;
    } else {
      answerHtml = `
        <div class="qa-answer-form" data-qid="${q.id}">
          <input type="text" placeholder="Write an answer..." class="answerInput">
          <button type="button" class="sendAnswerBtn">Send</button>
        </div>`;
    }
    return `
      <div class="qa-card">
        <div class="q">Q: ${escapeHtml(q.question)}</div>
        <div class="q-meta">Asked by ${escapeHtml(q.askedByName || "—")} • ${askedAt}</div>
        ${answerHtml}
      </div>`;
  }).join("");

  const toggle = latestQuestions.length > 2
    ? `<button class="btn-text" id="toggleQuestionsBtn" style="padding:4px 0 18px;">${showAllQuestions ? "Show less" : `View all questions (${latestQuestions.length})`}</button>`
    : "";

  container.innerHTML = cards + toggle;

  const toggleBtn = document.getElementById("toggleQuestionsBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      showAllQuestions = !showAllQuestions;
      renderQuestions();
    });
  }

  container.querySelectorAll(".sendAnswerBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const wrap = btn.closest(".qa-answer-form");
      const qid = wrap.dataset.qid;
      const input = wrap.querySelector(".answerInput");
      const text = input.value.trim();
      if (!text) return;
      btn.disabled = true;
      try {
        await tripRef().collection("questions").doc(qid).update({
          answerText: text,
          answeredBy: currentUser.uid,
          answeredByName: currentProfile?.name || "User",
          answeredAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) {
        showToast("Couldn't post answer: " + err.message, "error");
        btn.disabled = false;
      }
    });
  });
}

document.getElementById("questionForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = document.getElementById("questionText").value.trim();
  if (!text) return;
  const btn = document.getElementById("saveQuestionBtn");
  setButtonLoading(btn, true);
  try {
    await tripRef().collection("questions").add({
      question: text,
      askedBy: currentUser.uid,
      askedByName: currentProfile?.name || "User",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      answerText: null
    });
    e.target.reset();
    questionSheet.classList.remove("open");
    showToast("Question posted!", "success");
  } catch (err) {
    showToast("Couldn't post question: " + err.message, "error");
  } finally {
    setButtonLoading(btn, false, "Post Question");
  }
});

/* ---------------- Poll ---------------- */
let currentPoll = null;

function loadPoll() {
  tripRef().collection("polls").orderBy("createdAt", "desc").limit(1).onSnapshot(
    (snap) => {
      if (snap.empty) {
        currentPoll = null;
        document.getElementById("pollArea").innerHTML = `<div class="empty-state">No poll yet. Create one to help the group decide!</div>`;
        return;
      }
      const doc = snap.docs[0];
      currentPoll = { id: doc.id, ...doc.data() };
      renderPoll();
    },
    (err) => console.error(err)
  );
}

function renderPoll() {
  if (!currentPoll) return;
  const options = currentPoll.options || [];
  const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0);
  const voters = currentPoll.voters || {};
  const myVote = voters[currentUser.uid];

  const rows = options.map((opt, idx) => {
    const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
    const checked = myVote === idx ? "checked" : "";
    return `
      <label class="poll-option">
        <div class="row">
          <input type="radio" name="pollOption" value="${idx}" ${checked}>
          <span class="opt-label">${escapeHtml(opt.text)}</span>
          <span class="opt-votes">${opt.votes || 0} vote${(opt.votes || 0) === 1 ? "" : "s"}</span>
        </div>
        <div class="poll-bar-track"><div class="poll-bar-fill" style="width:${pct}%"></div></div>
      </label>`;
  }).join("");

  document.getElementById("pollArea").innerHTML = `
    <div class="poll-card">
      <div class="q">${escapeHtml(currentPoll.question)}</div>
      ${rows}
      <button class="btn btn-primary btn-sm" id="submitVoteBtn" style="width:100%;margin-top:6px;">
        ${myVote !== undefined ? "Update Vote" : "Submit Vote"}
      </button>
    </div>`;

  document.getElementById("submitVoteBtn").addEventListener("click", async () => {
    const selected = document.querySelector('input[name="pollOption"]:checked');
    if (!selected) {
      showToast("Please select an option first.", "error");
      return;
    }
    await castVote(parseInt(selected.value, 10));
  });
}

async function castVote(optionIndex) {
  const pollDocRef = tripRef().collection("polls").doc(currentPoll.id);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(pollDocRef);
      if (!snap.exists) throw new Error("Poll no longer exists.");
      const data = snap.data();
      const options = data.options || [];
      const voters = data.voters || {};
      const previous = voters[currentUser.uid];

      if (previous === optionIndex) return; // no change

      if (previous !== undefined && options[previous]) {
        options[previous].votes = Math.max(0, (options[previous].votes || 0) - 1);
      }
      if (options[optionIndex]) {
        options[optionIndex].votes = (options[optionIndex].votes || 0) + 1;
      }
      voters[currentUser.uid] = optionIndex;

      tx.update(pollDocRef, { options, voters });
    });
    showToast("Vote recorded!", "success");
  } catch (err) {
    showToast("Couldn't submit vote: " + err.message, "error");
  }
}

document.getElementById("addPollOptionBtn").addEventListener("click", () => {
  const wrap = document.getElementById("pollOptionsWrap");
  const count = wrap.querySelectorAll(".pollOptionInput").length + 1;
  const div = document.createElement("div");
  div.className = "field";
  div.innerHTML = `<span class="fi"><i class="fa-solid fa-circle-dot"></i></span><input type="text" class="pollOptionInput" placeholder="Option ${count}">`;
  wrap.appendChild(div);
});

document.getElementById("pollForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = document.getElementById("pollQuestion").value.trim();
  const optionInputs = Array.from(document.querySelectorAll(".pollOptionInput"));
  const options = optionInputs
    .map((i) => i.value.trim())
    .filter((v) => v.length > 0)
    .map((text) => ({ text, votes: 0 }));

  if (!question || options.length < 2) {
    showToast("Please add a question and at least 2 options.", "error");
    return;
  }

  const btn = document.getElementById("savePollBtn");
  setButtonLoading(btn, true);
  try {
    await tripRef().collection("polls").add({
      question,
      options,
      voters: {},
      createdBy: currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    e.target.reset();
    // Reset dynamic options back to 2
    document.getElementById("pollOptionsWrap").innerHTML = `
      <div class="field"><span class="fi"><i class="fa-solid fa-circle-dot"></i></span><input type="text" class="pollOptionInput" placeholder="Option 1" required></div>
      <div class="field"><span class="fi"><i class="fa-solid fa-circle-dot"></i></span><input type="text" class="pollOptionInput" placeholder="Option 2" required></div>`;
    pollSheet.classList.remove("open");
    showToast("Poll created!", "success");
  } catch (err) {
    showToast("Couldn't create poll: " + err.message, "error");
  } finally {
    setButtonLoading(btn, false, "Create Poll");
  }
});

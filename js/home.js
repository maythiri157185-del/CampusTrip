/* ============================================================
   CampusTrip — Home / My Trips
   ============================================================ */

const fabBtn = document.getElementById("fabBtn");
const sheetBackdrop = document.getElementById("sheetBackdrop");

fabBtn.addEventListener("click", () => sheetBackdrop.classList.add("open"));
sheetBackdrop.addEventListener("click", (e) => {
  if (e.target === sheetBackdrop) sheetBackdrop.classList.remove("open");
});

document.getElementById("logoutBtn").addEventListener("click", logout);

const menuSheetBackdrop = document.getElementById("menuSheetBackdrop");
document.getElementById("menuBtn").addEventListener("click", () => menuSheetBackdrop.classList.add("open"));
menuSheetBackdrop.addEventListener("click", (e) => {
  if (e.target === menuSheetBackdrop) menuSheetBackdrop.classList.remove("open");
});
document.getElementById("logoutMenuOption").addEventListener("click", logout);

const tripsList = document.getElementById("tripsList");

function tripCardHtml(trip) {
  const dateLabel = escapeHtml(trip.dateLabel || "Dates TBD");
  const memberCount = (trip.memberIds || []).length;
  return `
    <a class="trip-card" href="trip.html?id=${trip.id}">
      <div class="info">
        <h3>${escapeHtml(trip.name)}</h3>
        <div class="meta"><i class="fa-regular fa-calendar"></i> ${dateLabel}</div>
        <div class="meta"><i class="fa-solid fa-user-group"></i> ${memberCount} member${memberCount === 1 ? "" : "s"}</div>
      </div>
      <div class="chev"><i class="fa-solid fa-chevron-right"></i></div>
    </a>`;
}

requireAuth((user) => {
  db.collection("trips")
    .where("memberIds", "array-contains", user.uid)
    .onSnapshot(
      (snap) => {
        if (snap.empty) {
          tripsList.innerHTML = `
            <div class="empty-state">
              <span class="fi"><i class="fa-regular fa-map"></i></span>
              No trips yet. Tap the <strong>+</strong> button below to create or join one!
            </div>`;
          return;
        }
        const trips = [];
        snap.forEach((doc) => trips.push({ id: doc.id, ...doc.data() }));
        trips.sort((a, b) => {
          const ta = tsToDate(a.createdAt)?.getTime() || 0;
          const tb = tsToDate(b.createdAt)?.getTime() || 0;
          return tb - ta;
        });
        tripsList.innerHTML = trips.map(tripCardHtml).join("");
      },
      (err) => {
        console.error(err);
        tripsList.innerHTML = `<div class="empty-state">Couldn't load your trips. ${escapeHtml(err.message)}</div>`;
      }
    );
});

/* ============================================================
   CampusTrip — Create Trip
   ============================================================ */

let currentUser = null;
let currentProfile = null;

requireAuth((user, profile) => {
  currentUser = user;
  currentProfile = profile;
});

async function generateUniqueTripCode() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateTripCode();
    const existing = await db.collection("tripCodes").doc(code).get();
    if (!existing.exists) return code;
  }
  // Extremely unlikely fallback
  return generateTripCode() + Date.now().toString(36).slice(-2).toUpperCase();
}

document.getElementById("createTripForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("createTripError");
  errorEl.classList.add("hidden");

  const name = document.getElementById("tripName").value.trim();
  const destination = document.getElementById("tripDestination").value.trim();
  const dateLabel = document.getElementById("tripDates").value.trim();
  const description = document.getElementById("tripDescription").value.trim();

  if (!name || !destination || !dateLabel) {
    errorEl.textContent = "Please fill in the trip name, destination, and dates.";
    errorEl.classList.remove("hidden");
    return;
  }

  const btn = document.getElementById("createTripBtn");
  setButtonLoading(btn, true);

  try {
    if (!currentUser) throw new Error("You must be signed in.");

    const code = await generateUniqueTripCode();
    const organizerName = currentProfile?.name || currentUser.displayName || currentUser.email;

    const tripRef = db.collection("trips").doc();
    const batch = db.batch();

    batch.set(tripRef, {
      name,
      destination,
      dateLabel,
      description,
      organizerId: currentUser.uid,
      organizerName,
      code,
      memberIds: [currentUser.uid],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    batch.set(tripRef.collection("members").doc(currentUser.uid), {
      name: organizerName,
      email: currentUser.email,
      role: "Organizer",
      joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    batch.set(db.collection("tripCodes").doc(code), {
      tripId: tripRef.id
    });

    await batch.commit();

    window.location.href = `trip.html?id=${tripRef.id}&created=1`;
  } catch (err) {
    console.error(err);
    errorEl.textContent = err.message || "Couldn't create the trip. Please try again.";
    errorEl.classList.remove("hidden");
    setButtonLoading(btn, false, "Create Trip");
  }
});

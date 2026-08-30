/* ============================================================
   CampusTrip — Join Trip
   ============================================================ */

let currentUser = null;
let currentProfile = null;

requireAuth((user, profile) => {
  currentUser = user;
  currentProfile = profile;
});

document.getElementById("tripCode").addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase();
});

document.getElementById("joinTripForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("joinTripError");
  errorEl.classList.add("hidden");

  const code = document.getElementById("tripCode").value.trim().toUpperCase();
  if (!code) {
    errorEl.textContent = "Please enter a trip code.";
    errorEl.classList.remove("hidden");
    return;
  }

  const btn = document.getElementById("joinTripBtn");
  setButtonLoading(btn, true);

  try {
    const codeDoc = await db.collection("tripCodes").doc(code).get();
    if (!codeDoc.exists) {
      throw new Error("No trip found with that code. Double-check with your organizer.");
    }
    const tripId = codeDoc.data().tripId;
    const tripRef = db.collection("trips").doc(tripId);
    const tripSnap = await tripRef.get();
    if (!tripSnap.exists) {
      throw new Error("This trip no longer exists.");
    }
    const trip = tripSnap.data();

    if ((trip.memberIds || []).includes(currentUser.uid)) {
      window.location.href = `trip.html?id=${tripId}`;
      return;
    }

    const name = currentProfile?.name || currentUser.displayName || currentUser.email;
    const batch = db.batch();
    batch.update(tripRef, {
      memberIds: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
    });
    batch.set(tripRef.collection("members").doc(currentUser.uid), {
      name,
      email: currentUser.email,
      role: "Member",
      joinedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await batch.commit();

    window.location.href = `trip.html?id=${tripId}&joined=1`;
  } catch (err) {
    console.error(err);
    errorEl.textContent = err.message || "Couldn't join that trip. Please try again.";
    errorEl.classList.remove("hidden");
    setButtonLoading(btn, false, "Join");
  }
});

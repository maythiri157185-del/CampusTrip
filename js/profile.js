/* ============================================================
   CampusTrip — Profile
   ============================================================ */

let currentUser = null;

requireAuth((user, profile) => {
  currentUser = user;

  document.getElementById("profileAvatar").textContent = initials(profile.name);
  document.getElementById("profileName").textContent = profile.name || "User";
  document.getElementById("profileEmail").textContent = profile.email || user.email || "";

  document.getElementById("profileNameInput").value = profile.name || "";
  document.getElementById("profileEmailInput").value = profile.email || user.email || "";

  document.getElementById("profileLoading").classList.add("hidden");
  document.getElementById("profileContent").classList.remove("hidden");
});

document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("profileNameInput").value.trim();
  if (!name) return;

  const btn = document.getElementById("saveProfileBtn");
  setButtonLoading(btn, true);
  try {
    await db.collection("users").doc(currentUser.uid).set(
      { name },
      { merge: true }
    );
    await currentUser.updateProfile({ displayName: name });

    document.getElementById("profileAvatar").textContent = initials(name);
    document.getElementById("profileName").textContent = name;
    showToast("Profile updated!", "success");
  } catch (err) {
    showToast("Couldn't update profile: " + err.message, "error");
  } finally {
    setButtonLoading(btn, false, "Save Changes");
  }
});

document.getElementById("myTripsBtn").addEventListener("click", () => {
  window.location.href = "home.html";
});

document.getElementById("logoutProfileBtn").addEventListener("click", logout);

/* ============================================================
   CampusTrip — Auth Logic (Login + Sign Up)
   ============================================================ */

// If already logged in, skip straight to Home
auth.onAuthStateChanged((user) => {
  if (user && (location.pathname.endsWith("index.html") || location.pathname.endsWith("signup.html") || location.pathname === "/")) {
    window.location.href = "home.html";
  }
});

// Password show/hide toggles
document.querySelectorAll(".toggle-visibility").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    const icon = btn.querySelector("i");
    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      input.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });
});

function friendlyAuthError(code) {
  const map = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "An account already exists with that email.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/missing-password": "Please enter a password.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again."
  };
  return map[code] || "Something went wrong. Please try again.";
}

// ---------- LOGIN ----------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errorEl = document.getElementById("loginError");
    const btn = document.getElementById("loginBtn");

    errorEl.classList.add("hidden");
    setButtonLoading(btn, true);

    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = "home.html";
    } catch (err) {
      errorEl.textContent = friendlyAuthError(err.code);
      errorEl.classList.remove("hidden");
      setButtonLoading(btn, false, "Log In");
    }
  });
}

// ---------- SIGN UP ----------
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const errorEl = document.getElementById("signupError");
    const btn = document.getElementById("signupBtn");

    errorEl.classList.add("hidden");

    if (!name) {
      errorEl.textContent = "Please enter your name.";
      errorEl.classList.remove("hidden");
      return;
    }

    setButtonLoading(btn, true);

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });
      await db.collection("users").doc(cred.user.uid).set({
        name,
        email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      window.location.href = "home.html";
    } catch (err) {
      errorEl.textContent = friendlyAuthError(err.code);
      errorEl.classList.remove("hidden");
      setButtonLoading(btn, false, "Create Account");
    }
  });
}

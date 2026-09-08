/* ============================================================
   CampusTrip — Shared Utilities
   ============================================================ */

function showToast(message, type = "") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.querySelector(".app").appendChild(toast);
  }
  toast.textContent = message;
  toast.className = "toast show" + (type ? " " + type : "");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.className = "toast" + (type ? " " + type : "");
  }, 2600);
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const map = [
    ["year", 31536000], ["month", 2592000], ["week", 604800],
    ["day", 86400], ["hour", 3600], ["minute", 60]
  ];
  for (const [label, secs] of map) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val} ${label}${val > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return new Date(ts);
}

function generateTripCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function setButtonLoading(btn, loading, label) {
  if (loading) {
    btn.dataset.label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
  } else {
    btn.disabled = false;
    btn.innerHTML = label || btn.dataset.label || btn.innerHTML;
  }
}

/**
 * Guards a page: redirects to index.html if no user is signed in.
 * Calls onReady(user, profile) once auth state + user profile doc are known.
 */
function requireAuth(onReady) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    let profile = null;

    try {
      const snap = await db.collection("users").doc(user.uid).get();

      if (snap.exists) {
        profile = snap.data();
      } else {
        profile = {
          name: user.displayName || "User",
          email: user.email
        };
      }

    } catch (e) {
      console.error("PROFILE LOAD ERROR:", e);

      profile = {
        name: user.displayName || "User",
        email: user.email
      };
    }

    onReady(user, profile);
  });
}

async function logout() {
  await auth.signOut();
  window.location.href = "index.html";
}

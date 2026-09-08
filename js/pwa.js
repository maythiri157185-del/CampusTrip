// CampusTrip PWA helpers
(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js", { scope: "./" })
        .then(function (registration) {
          console.log("CampusTrip service worker registered.", registration.scope);
        })
        .catch(function (error) {
          console.error("CampusTrip service worker registration failed:", error);
        });
    });
  }

  function showOfflineStatus() {
    var existing = document.getElementById("offlineStatus");
    if (existing) return existing;

    var banner = document.createElement("div");
    banner.id = "offlineStatus";
    banner.setAttribute("role", "status");
    banner.textContent = "You're offline. Cached app screens are available; live Firebase data may be unavailable.";
    Object.assign(banner.style, {
      position: "fixed",
      left: "12px",
      right: "12px",
      bottom: "12px",
      zIndex: "99999",
      padding: "12px 14px",
      borderRadius: "12px",
      background: "#1f2937",
      color: "#fff",
      fontFamily: "Inter, sans-serif",
      fontSize: "13px",
      lineHeight: "1.4",
      boxShadow: "0 8px 24px rgba(0,0,0,.18)"
    });
    document.body.appendChild(banner);
    return banner;
  }

  function updateOnlineState() {
    var banner = document.getElementById("offlineStatus");
    if (!navigator.onLine) {
      showOfflineStatus();
    } else if (banner) {
      banner.remove();
    }
  }

  window.addEventListener("online", updateOnlineState);
  window.addEventListener("offline", updateOnlineState);
  window.addEventListener("load", updateOnlineState);
})();

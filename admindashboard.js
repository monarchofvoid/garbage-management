// admindashboard.js
// citizendashboard.js — CleanTrack Citizen Dashboard logic
import { auth, db } from "./firebaseconfig.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { collection, onSnapshot, query, where, getDocs, setDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Helpers
function $(id) { return document.getElementById(id); }
// =============== Utility Functions ===============

// Set current year in footer
document.addEventListener("DOMContentLoaded", () => {
  const yearNow = document.getElementById("yearNow");
  if (yearNow) yearNow.textContent = new Date().getFullYear();
});

// Smooth scroll for "Back to top"
document.querySelectorAll("[data-scroll]").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
// ========== AUTH GUARD ==========
let currentUser = null;
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    setTimeout(() => {
      if (!auth.currentUser) {
        window.location.href = "login.html";
      }
    }, 500);
    return;
  }

  if (currentUser && currentUser.uid === user.uid) return;

  currentUser = user;
  $("userWelcome").textContent = user.email.split("@")[0];
  await loadReports(user.uid);
});

// =============== KPI Animations ===============
function animateKPI(id, target, suffix = "") {
  const el = document.getElementById(id);
  if (!el) return;
  let count = 0;
  const step = Math.ceil(target / 60); // animate ~1s at 60fps
  const interval = setInterval(() => {
    count += step;
    if (count >= target) {
      el.textContent = target + suffix;
      clearInterval(interval);
    } else {
      el.textContent = count + suffix;
    }
  }, 16);
}

// Example KPI animation
animateKPI("kpiTotalBins", 256);
animateKPI("kpiComplaints", 43);
animateKPI("kpiWorkers", 18);
animateKPI("kpiResolved", 87, "%");

// =============== Charts ===============
function initCharts() {
  const complaintCtx = document.getElementById("complaintChart");
  if (complaintCtx) {
    new Chart(complaintCtx, {
      type: "bar",
      data: {
        labels: ["Pending", "Resolved"],
        datasets: [{
          data: [12, 31],
          backgroundColor: ["#ef4444", "#10b981"]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }

  const binCtx = document.getElementById("binChart");
  if (binCtx) {
    new Chart(binCtx, {
      type: "doughnut",
      data: {
        labels: ["Full", "Normal", "Empty"],
        datasets: [{
          data: [5, 18, 10],
          backgroundColor: ["#f59e0b", "#22d3ee", "#8bc34a"]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }
}
initCharts();

// =============== Map ===============
// ========== MAP ==========
document.addEventListener("DOMContentLoaded", () => {
  const map = L.map("city-map").setView([28.4595, 77.0266], 12); // Default Gurgaon

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const createIcon = (iconHtml, cls = "") =>
    L.divIcon({
      html: `<i class="bi ${iconHtml} ${cls}"></i>`,
      className: "custom-marker",
      iconSize: [30, 30],
      popupAnchor: [0, -10]
    });

  const binIcon = createIcon("bi-trash2-fill", "marker-bin");
  const plantIcon = createIcon("bi-recycle", "marker-plant");
  const reportIcon = createIcon("bi-exclamation-triangle-fill", "marker-report");

  const binsRef = collection(db, "bins");
  const plantsRef = collection(db, "plants");
  const reportsRef = collection(db, "reports");

  const markers = { bins: [], plants: [], reports: [] };

  const clearMarkers = (type) => {
    markers[type].forEach(m => map.removeLayer(m));
    markers[type] = [];
  };

  // ========== Firestore Sync ==========

  // Bins
  onSnapshot(binsRef, (snapshot) => {
    clearMarkers("bins");
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.location || data.location.lat == null || data.location.lng == null) return;
      const lat = parseFloat(data.location.lat);
      const lng = parseFloat(data.location.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], { icon: binIcon })
        .bindPopup(`
          <strong>Bin ID:</strong> ${data.binId || "-"}<br>
          <strong>Fill:</strong> ${data.filledPercentage || 0}%<br>
          <strong>Area:</strong> ${data.coveredArea || "-"} km²
        `);
      markers.bins.push(marker);
    });
    updateLayers();
  });

  // Plants
  onSnapshot(plantsRef, (snapshot) => {
    clearMarkers("plants");
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.location || data.location.lat == null || data.location.lng == null) return;
      const lat = parseFloat(data.location.lat);
      const lng = parseFloat(data.location.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], { icon: plantIcon })
        .bindPopup(`
          <strong>Plant:</strong> ${data.plantId || "-"}<br>
          <strong>City:</strong> ${data.city || "-"}<br>
          <strong>Trucks:</strong> ${data.trucksAvailable || 0}/${data.numTrucks || 0}<br>
          <strong>Bins:</strong> ${data.numBins || 0}
        `);
      markers.plants.push(marker);
    });
    updateLayers();
  });

  // Reports
  onSnapshot(reportsRef, (snapshot) => {
    clearMarkers("reports");
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.location || data.location.lat == null || data.location.lng == null) return;
      const lat = parseFloat(data.location.lat);
      const lng = parseFloat(data.location.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], { icon: reportIcon })
        .bindPopup(`
          <strong>Report:</strong> ${data.title || "Issue"}<br>
          <strong>Status:</strong> ${data.status || "Open"}<br>
          <strong>Details:</strong> ${data.description || ""}
        `);
      markers.reports.push(marker);
    });
    updateLayers();
  });
    // ========== Locate Me ==========
  $("btnLocate").addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 15);
          L.marker([latitude, longitude], {
            icon: createIcon("bi-geo-alt-fill", "text-danger")
          }).addTo(map)
            .bindPopup("📍 You are here")
            .openPopup();
        },
        () => alert("Location access denied")
      );
    } else {
      alert("Geolocation not supported");
    }
  });
});

  // ========== Layer Toggle ==========
  const updateLayers = () => {
    ["bins", "plants", "reports"].forEach(type => {
      markers[type].forEach(m => map.removeLayer(m));
    });

    if ($("layerBins").checked) markers.bins.forEach(m => m.addTo(map));
    if ($("layerPlants").checked) markers.plants.forEach(m => m.addTo(map));
    if ($("layerComplaints").checked) markers.reports.forEach(m => m.addTo(map));
  };

  document.querySelectorAll("input[name='mapLayer']").forEach(radio => {
    radio.addEventListener("change", updateLayers);
  });

const notificationBtn = document.getElementById("notificationBtn");
const notificationsPanel = document.getElementById("notifications"); // this is your section

notificationBtn.addEventListener("click", (e) => {
  e.preventDefault();
  notificationsPanel.classList.toggle("d-none"); // hides/shows section
  notificationsPanel.scrollIntoView({ behavior: "smooth" }); // scroll to it
});

// profile button 
const profileBtn = document.getElementById("profileBtn");
const profilePanel = document.getElementById("profile");

profileBtn.addEventListener("click", (e) => {
  e.preventDefault();
  profilePanel.classList.toggle("d-none"); // hides/shows section
  profilePanel.scrollIntoView({ behavior: "smooth" }); // scroll to it
});
// Profile Dropdown — Firebase Auth
const profileName = document.getElementById("adminName");
const profileUsername = document.getElementById("adminUsername");
const profileEmail = document.getElementById("adminEmail");
const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Dynamic info
    profileName.textContent = user.displayName || "Admin";
    profileUsername.textContent = "@" + (user.email.split("@")[0] || "admin");
    profileEmail.textContent = user.email;

    // Logout
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.href = "login.html";
      } catch (err) {
        console.error("Logout error:", err);
      }
    });
  }
});


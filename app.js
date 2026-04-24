// ===== CONFIG + SAMPLE DATA =====
const SAMPLE_ATHLETES = [];
const SAMPLE_UPDATES = [];
const SAMPLE_PROGRAMS = [];

// ===== UTILITIES =====
function isActive(row) {
  return String(row.active || "").toLowerCase() === "true";
}

// 🔥 NEW: Handles BOTH photo_link and photo_url
function getPhotoUrl(row) {
  const raw = row.photo_link || row.photo_url || "";

  if (!raw) return "";

  // If already direct image URL
  if (!raw.includes("drive.google.com")) return raw;

  // Extract file ID from standard share link
  const fileMatch = raw.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1200`;
  }

  // Handle alternate formats
  const idMatch = raw.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1200`;
  }

  return raw;
}

// ===== DATA LOADING =====
async function loadCSV(sheetId, tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${tabName}`;
  const res = await fetch(url);
  const text = await res.text();

  const rows = text.split("\n").map(r => r.split(","));
  const headers = rows[0];

  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = row[i]?.trim();
    });
    return obj;
  });
}

async function loadData() {
  if (window.HISD_RECRUITING_CONFIG.useSampleData) {
    return {
      athletes: SAMPLE_ATHLETES,
      updates: SAMPLE_UPDATES,
      programs: SAMPLE_PROGRAMS
    };
  }

  const sheetId = window.HISD_RECRUITING_CONFIG.sheetId;

  const athletes = await loadCSV(sheetId, "Athletes");

  return {
    athletes: athletes.filter(isActive)
  };
}

// ===== RENDERING =====
function renderAthletes(athletes) {
  const container = document.getElementById("athlete-grid");
  if (!container) return;

  container.innerHTML = "";

  athletes.forEach(a => {
    const photo = getPhotoUrl(a);

    const card = document.createElement("div");
    card.className = "athlete-card";

    card.innerHTML = `
      <div class="athlete-photo">
        ${
          photo
            ? `<img src="${photo}" alt="${a.first_name} ${a.last_name}" />`
            : `<div class="placeholder">PLAYER PHOTO</div>`
        }
      </div>
      <div class="athlete-info">
        <h3>${a.first_name} ${a.last_name}</h3>
        <p>${a.sport} • ${a.position}</p>
        <p>Class of ${a.class}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

// ===== INIT =====
(async function init() {
  const data = await loadData();
  renderAthletes(data.athletes);
})();

console.log('HISD Recruiting photo_link system active');
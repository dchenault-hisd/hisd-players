const CONFIG = window.HISD_RECRUITING_CONFIG || {};

function csvToObjects(csv) {
  const rows = csv.split("\n").map(r => r.split(","));
  const headers = rows[0].map(h => h.trim().toLowerCase());

  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = (row[i] || "").trim());
    return obj;
  });
}

function isActive(row) {
  return String(row.active || "").toLowerCase() === "true";
}

// 🔥 THIS IS THE KEY PART
function getPhotoUrl(row) {
  const raw = row.photo_link || row.photo_url || "";

  if (!raw) return "";

  if (!raw.includes("drive.google.com")) return raw;

  const fileMatch = raw.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1200`;
  }

  const idMatch = raw.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1200`;
  }

  return raw;
}

async function loadData() {
  const sheetId = CONFIG.sheetId;
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Athletes`;

  const res = await fetch(url);
  const text = await res.text();
  const data = csvToObjects(text);

  return data.filter(isActive);
}

function renderAthletes(athletes) {
  const container = document.querySelector("[data-athlete-grid]");
  if (!container) return;

  container.innerHTML = "";

  athletes.forEach(a => {
    const photo = getPhotoUrl(a);

    const card = document.createElement("div");
    card.className = "profile-card";

    card.innerHTML = `
      <div class="profile-photo">
        ${
          photo
            ? `<img src="${photo}" alt="${a.first_name} ${a.last_name}">`
            : `<span>PLAYER PHOTO</span>`
        }
      </div>
      <div class="profile-body">
        <h3>${a.first_name} ${a.last_name}</h3>
        <p>${a.sport} • ${a.position}</p>
        <p>Class of ${a.class}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const athletes = await loadData();
  renderAthletes(athletes);
});

console.log("photo_link system active");
const CONFIG = window.HISD_RECRUITING_CONFIG || {};
const SAMPLE_ATHLETES = [
  {id:"cade-thompson",first_name:"Cade",last_name:"Thompson",preferred_name:"Cade Thompson",sport:"Football",grad_year:"2027",position:"QB",height:"6'2\"",weight:"190",gpa:"3.82",hometown:"Henderson, TX",photo_link:"",photo_url:"",hudl_link:"#",one_sheet_url:"",key_stats:"2,416 passing yards|28 passing TDs|4.74 forty|First Team All-District",bio:"Three-year varsity athlete with leadership, field awareness and academic consistency.",coach_name:"Sample Head Coach",coach_email:"coach@hendersonisd.org",active:"TRUE"},
  {id:"mason-reed",first_name:"Mason",last_name:"Reed",preferred_name:"Mason Reed",sport:"Football",grad_year:"2026",position:"WR / DB",height:"5'11\"",weight:"175",gpa:"3.54",hometown:"Henderson, TX",photo_link:"",photo_url:"",hudl_link:"#",one_sheet_url:"",key_stats:"61 receptions|954 receiving yards|5 INTs|Academic All-District",bio:"Versatile skill player with production on offense, defense and special teams.",coach_name:"Sample Head Coach",coach_email:"coach@hendersonisd.org",active:"TRUE"},
  {id:"luke-henderson",first_name:"Luke",last_name:"Henderson",preferred_name:"Luke Henderson",sport:"Baseball",grad_year:"2028",position:"RHP / 1B",height:"6'3\"",weight:"205",gpa:"3.91",hometown:"Henderson, TX",photo_link:"",photo_url:"",hudl_link:"#",one_sheet_url:"",key_stats:"86 mph FB|.341 batting average|27 RBIs|Honors student",bio:"Projectable two-way player with strong work habits and classroom performance.",coach_name:"Sample Head Coach",coach_email:"coach@hendersonisd.org",active:"TRUE"}
];
const SAMPLE_UPDATES = [
  { title:"Game Day!", date:"2 hours ago", text:"Henderson ISD Athletics is proud of the work our student-athletes are putting in across multiple programs.", active:"TRUE" },
  { title:"Recruiting Updates", date:"Yesterday", text:"New film, measurables and profile updates continue to be added for current student-athletes.", active:"TRUE" },
  { title:"Program News", date:"This week", text:"College coaches can use this portal to review athlete information and connect with Henderson coaching staff.", active:"TRUE" }
];
const SAMPLE_ANNOUNCEMENTS = [
  { title:"Recruiting portal now live", date:"This week", text:"College coaches can review current Henderson ISD student-athlete information, highlight links and coach contacts in one place.", link:"", link_text:"", active:"TRUE" },
  { title:"Spring updates in progress", date:"April 2026", text:"Coaches are updating profile information, measurables and film links for student-athletes across multiple sports.", link:"", link_text:"", active:"TRUE" },
  { title:"Follow Henderson ISD Athletics", date:"Ongoing", text:"Recent posts, highlights and announcements are available through the official Henderson ISD Athletics Facebook page.", link:"https://www.facebook.com/profile.php?id=61573619793756", link_text:"Open Facebook", active:"TRUE" }
];
const SAMPLE_PROGRAMS = [
  { sport:"Football", tagline:"Tradition. Toughness. Together.", active:"TRUE" },
  { sport:"Boys Basketball", tagline:"Discipline. Effort. Relentless.", active:"TRUE" },
  { sport:"Girls Basketball", tagline:"Teamwork. Heart. Henderson.", active:"TRUE" },
  { sport:"Track & Field", tagline:"Speed. Strength. Determination.", active:"TRUE" }
];

function csvToObjects(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    const n = csv[i + 1];

    if (c === '"' && inQuotes && n === '"') {
      field += '"';
      i++;
    } else if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !inQuotes) {
      if (field || row.length) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
      if (c === "\r" && n === "\n") i++;
    } else {
      field += c;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = (rows.shift() || []).map(normalizeKey);
  return rows
    .filter(r => r.some(cell => String(cell).trim() !== ""))
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = (r[i] || "").trim());
      return obj;
    });
}

function normalizeKey(v) {
  return String(v || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function isActive(row) {
  const value = String(row.active || row.published || "TRUE").trim().toLowerCase();
  return !["false", "no", "0", "inactive", "hide"].includes(value);
}

function sheetCsvUrl(tab) {
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(CONFIG.sheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
}

async function loadTab(tab, sample) {
  if (CONFIG.useSampleData || !CONFIG.sheetId || CONFIG.sheetId.includes("PASTE_")) return sample;

  const res = await fetch(sheetCsvUrl(tab));
  if (!res.ok) throw new Error(`Could not load ${tab}`);
  const text = await res.text();
  return csvToObjects(text);
}

async function loadData() {
  const athletes = await loadTab(CONFIG.tabs?.athletes || "Athletes", SAMPLE_ATHLETES).catch(e => {
    console.error(e);
    showDataWarning("Athletes tab could not be loaded. Showing sample athlete data.");
    return SAMPLE_ATHLETES;
  });

  const updates = await loadTab(CONFIG.tabs?.updates || "Updates", SAMPLE_UPDATES).catch(e => {
    console.warn(e);
    return SAMPLE_UPDATES;
  });

  const announcements = await loadTab(CONFIG.tabs?.announcements || "Announcements", SAMPLE_ANNOUNCEMENTS).catch(e => {
    console.warn(e);
    return SAMPLE_ANNOUNCEMENTS;
  });

  const programs = await loadTab(CONFIG.tabs?.programs || "Programs", SAMPLE_PROGRAMS).catch(e => {
    console.warn(e);
    return SAMPLE_PROGRAMS;
  });

  const schoolinfo = await loadTab(CONFIG.tabs?.schoolinfo || "SchoolInfo", []).catch(e => {
    console.warn(e);
    return [];
  });
  
  return {
    athletes: athletes.filter(isActive),
    updates: updates.filter(isActive),
    announcements: announcements.filter(isActive),
    programs: programs.filter(isActive)
    schoolinfo
  };
}

function showDataWarning(msg) {
  document.querySelectorAll("[data-status]").forEach(el => {
    el.textContent = msg || "Live sheet could not be loaded.";
    el.style.display = "block";
  });
}

function driveDirectUrl(url) {
  if (!url) return "";
  const value = String(url).trim();

  if (!value.includes("drive.google.com")) return value;

  const fileMatch = value.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1200`;

  const idMatch = value.match(/[?&]id=([^&]+)/);
  if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1200`;

  return value;
}

function getPhotoUrl(a) {
  return driveDirectUrl(a.photo_link || a.photo_url || a.headshot_url || a.image_url || "");
}

function athleteName(a) {
  return a.preferred_name || `${a.first_name || ""} ${a.last_name || ""}`.trim() || "Athlete";
}

function athleteId(a) {
  return a.id || slugify(athleteName(a));
}

function slugify(v) {
  return String(v || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function initials(name) {
  return String(name || "A").split(/\s+/).filter(Boolean).slice(0,2).map(p => p[0]).join("").toUpperCase();
}

function statsArray(value) {
  return String(value || "").split("|").map(s => s.trim()).filter(Boolean);
}

function esc(v) {
  return String(v || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function photoMarkup(a, label="Player Photo") {
  const url = getPhotoUrl(a);
  const name = athleteName(a);
  return url
    ? `<img src="${esc(url)}" alt="${esc(name)}" onerror="this.parentElement.textContent='${esc(initials(name))}'">`
    : `<span>${esc(label)}</span>`;
}

function athleteCard(a) {
  const name = athleteName(a);
  const id = athleteId(a);
  return `<article class="profile-card">
    <div class="profile-photo">${photoMarkup(a)}</div>
    <div class="profile-body">
      <div class="profile-topline">
        <div>
          <h3>${esc(name)}</h3>
          <p class="meta">${esc(a.sport)} • Class of ${esc(a.grad_year)}</p>
        </div>
        <span class="badge">${esc(a.position || "Athlete")}</span>
      </div>
      <div class="profile-stats">
        <div class="stat"><span>Height</span><strong>${esc(a.height || "—")}</strong></div>
        <div class="stat"><span>Weight</span><strong>${esc(a.weight || "—")}</strong></div>
        <div class="stat"><span>GPA</span><strong>${esc(a.gpa || "—")}</strong></div>
        <div class="stat">
          <span>Film</span>
          <strong>
             ${a.hudl_link 
                 ? `<a href="${esc(a.hudl_link)}" target="_blank" rel="noopener">Hudl</a>` 
                 : "—"}
          </strong>
         </div>
      </div>
      <p class="profile-note">${esc(a.bio || "Recruiting profile information will be added soon.")}</p>
      <a class="program-link" href="athlete.html?id=${encodeURIComponent(id)}">Open Profile →</a>
    </div>
  </article>`;
}

function updateItem(u) {
  return `<article class="update-item">
    <p class="update-kicker">${esc(u.title || "Update")}</p>
    <p class="update-text">${esc(u.text || "")}</p>
    <p class="update-date">${esc(u.date || "")}</p>
  </article>`;
}

function announcementHero(a) {
  if (!a) return "";
  const link = a.link ? `<a class="program-link" href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.link_text || "Read more")} →</a>` : "";
  return `<h2 class="announcement-hero-title">${esc(a.title || "Announcement")}</h2>
    <p class="announcement-hero-date">${esc(a.date || "")}</p>
    <div class="rule" style="margin-top:14px; margin-bottom:8px; width:60px;"></div>
    <p class="announcement-hero-text">${esc(a.text || "")}</p>
    ${link}`;
}

function announcementItem(a) {
  const link = a.link ? `<a class="section-link" style="display:inline-block;margin-top:14px;" href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.link_text || "Read more")} →</a>` : "";
  return `<article class="announcement-item">
    <h3>${esc(a.title || "Announcement")}</h3>
    <div class="announcement-date">${esc(a.date || "")}</div>
    <p>${esc(a.text || "")}</p>
    ${link}
  </article>`;
}

function programCard(p) {
  const sport = p.sport || p.title || "Program";
  return `<article class="program-card">
    <div class="program-image"></div>
    <div class="program-body">
      <h3>${esc(sport)}</h3>
      <p>${esc(p.tagline || "Tradition. Excellence. Henderson.")}</p>
      <a class="program-link" href="athletes.html?sport=${encodeURIComponent(sport)}">View ${esc(sport)} →</a>
    </div>
  </article>`;
}

function renderHome(data) {
  document.querySelectorAll("[data-updates]").forEach(el => el.innerHTML = data.updates.slice(0,3).map(updateItem).join(""));

  const latestAnnouncement = document.querySelector("[data-announcement-latest]");
  if (latestAnnouncement) latestAnnouncement.innerHTML = announcementHero(data.announcements[0]);

  const announcements = document.querySelector("[data-announcements]");
  if (announcements) announcements.innerHTML = data.announcements.map(announcementItem).join("");

  const programs = document.querySelector("[data-programs]");
  if (programs) programs.innerHTML = data.programs.slice(0,4).map(programCard).join("");

  const featured = document.querySelector("[data-featured-athletes]");
  if (featured) featured.innerHTML = data.athletes.slice(0,3).map(athleteCard).join("");
}

function mapSchoolInfo(rows) {
  const obj = {};
  rows.forEach(r => {
    if (r.key) obj[r.key] = r.value;
  });
  return obj;
}

function renderDirectory(data) {
  const grid = document.querySelector("[data-athlete-grid]");
  if (!grid) return;

  const search = document.querySelector("[data-search]");
  const sport = document.querySelector("[data-sport-filter]");
  const year = document.querySelector("[data-year-filter]");

  const sports = [...new Set(data.athletes.map(a => a.sport).filter(Boolean))].sort();
  const years = [...new Set(data.athletes.map(a => a.grad_year).filter(Boolean))].sort();

  sport.innerHTML = `<option value="">All Sports</option>` + sports.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
  year.innerHTML = `<option value="">All Classes</option>` + years.map(y => `<option value="${esc(y)}">${esc(y)}</option>`).join("");

  const params = new URLSearchParams(location.search);
  if (params.get("sport")) sport.value = params.get("sport");

  function draw() {
    const q = (search.value || "").toLowerCase();
    const sv = sport.value;
    const yv = year.value;

    const filtered = data.athletes.filter(a => {
      const haystack = [athleteName(a), a.sport, a.position, a.grad_year, a.hometown].join(" ").toLowerCase();
      return haystack.includes(q) && (!sv || a.sport === sv) && (!yv || a.grad_year === yv);
    });

    grid.innerHTML = filtered.length
      ? filtered.map(athleteCard).join("")
      : `<div class="empty-state">No athlete profiles match the selected filters.</div>`;
  }

  [search, sport, year].forEach(el => el.addEventListener("input", draw));
  draw();
}

function renderProfile(data) {
  const target = document.querySelector("[data-profile]");
  if (!target) return;

  const id = new URLSearchParams(location.search).get("id");
  const a = data.athletes.find(x => athleteId(x) === id) || data.athletes[0];

  if (!a) {
    target.innerHTML = `<div class="empty-state">No athlete profile was found.</div>`;
    return;
  }

  const name = athleteName(a);
  const stats = statsArray(a.key_stats || a.stats);
  document.title = `${name} | Henderson ISD Athletics`;

  target.innerHTML = `<section class="info-grid" style="align-items:start;">
    <article class="profile-card">
      <div class="profile-photo" style="height:380px;">${photoMarkup(a)}</div>
      <div class="profile-body">
        <div class="profile-topline">
          <div><h3>${esc(name)}</h3><p class="meta">${esc(a.sport)} • Class of ${esc(a.grad_year)}</p></div>
          <span class="badge">${esc(a.position || "Athlete")}</span>
        </div>
        <div class="profile-stats">
          <div class="stat"><span>Height</span><strong>${esc(a.height || "—")}</strong></div>
          <div class="stat"><span>Weight</span><strong>${esc(a.weight || "—")}</strong></div>
          <div class="stat"><span>GPA</span><strong>${esc(a.gpa || "—")}</strong></div>
          <div class="stat"><span>Hometown</span><strong>${esc(a.hometown || "—")}</strong></div>
        </div>
        ${a.hudl_link ? `<a class="btn btn-primary" style="margin-top:18px; width:100%;" href="${esc(a.hudl_link)}" target="_blank" rel="noopener">Watch Highlights</a>` : ""}
     <a class="btn btn-secondary" style="margin-top:12px; width:100%;" href="profile-pdf.html?id=${encodeURIComponent(id)}" target="_blank">
  Download Recruiting One-Sheet
</a>
</div>
    </article>
    <div>
      <div class="box"><h3>Profile Summary</h3><p>${esc(a.bio || "Recruiting profile information will be added soon.")}</p></div>
   
 <div class="box" style="margin-top:18px;">
  <h3>Key Data Points</h3>
  <div class="profile-stats">
    ${
      stats.length
        ? stats.map(s => {
           const parts = s.split(/:\s*/);
           const label = parts[0] || "";
           const value = parts.length > 1 ? parts.slice(1).join(":") : "";
           return `
              <div class="stat">
                <span>${esc(label)}</span>
                <strong>${esc(value)}</strong>
              </div>
            `;
          }).join("")
        : `<p>Stats will be added soon.</p>`
    }
  </div>
</div>

      <div class="box" style="margin-top:18px;"><h3>Coach Contact</h3><p>${esc(a.coach_name || "Henderson ISD Athletics")}<br>${esc(a.coach_email || "athletics@hendersonisd.org")}</p><p>This section can include the athletic director, recruiting coordinator and counselor contact information.</p></div>
    </div>
  </section>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadData();
  console.log("Loaded athlete count:", data.athletes.length, data.athletes);
  console.log("Loaded announcement count:", data.announcements.length, data.announcements);

  if (document.body.dataset.page === "home") renderHome(data);
  if (document.body.dataset.page === "directory") renderDirectory(data);
  if (document.body.dataset.page === "profile") renderProfile(data);
 if (document.body.dataset.page === "profile-pdf") {
  renderProfilePDF(data);
});

console.log("HISD Recruiting live-data announcements v7 loaded");

/* MediTrack - Hospital DBMS Mini Project
   Role-based UI over a live in-browser SQLite database (sql.js). */

let db = null;
let SQLLib = null;
let currentRole = null;
let currentAccount = null;

const ROLES = {
  admin:  { title: "Administrator", icon: "&#9881;",
            accounts: [{ id: "admin", name: "System Administrator", sub: "@admin" }] },
  doctor: { title: "Doctor", icon: "&#128104;&#8205;&#9877;&#65039;",
            accounts: [
              { id: "doc1", name: "Dr. Asha Mehta", sub: "Cardiology", ref: 1, dno: 101 },
              { id: "doc2", name: "Dr. Priya Iyer", sub: "Orthopedics", ref: 3, dno: 102 },
            ] },
  patient:{ title: "Patient", icon: "&#128100;",
            accounts: [
              { id: "p1", name: "A. Shah", sub: "Cardiac ICU", ref: 1 },
              { id: "p2", name: "R. Nair", sub: "Ortho Ward", ref: 2 },
              { id: "p3", name: "S. Rao", sub: "Neuro", ref: 4 },
              { id: "p4", name: "K. Verma", sub: "Pediatric Ward", ref: 6 },
            ] },
};

const DDL_TEXT = `CREATE TABLE department (
  dno       INTEGER PRIMARY KEY,
  dname     TEXT NOT NULL UNIQUE,
  location  TEXT
);

CREATE TABLE doctor (
  doc_id          INTEGER PRIMARY KEY,
  fname           TEXT NOT NULL,
  lname           TEXT NOT NULL,
  specialization  TEXT,
  salary          NUMERIC CHECK (salary > 0),
  dno             INTEGER REFERENCES department(dno)
);

CREATE TABLE ward (
  ward_no    INTEGER PRIMARY KEY,
  ward_name  TEXT NOT NULL,
  capacity   INTEGER DEFAULT 10,
  dno        INTEGER REFERENCES department(dno)
);

CREATE TABLE patient (
  patient_id  INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  age         INTEGER,
  disease     TEXT,
  status      TEXT DEFAULT 'Stable',
  doc_id      INTEGER NOT NULL REFERENCES doctor(doc_id)
);

CREATE TABLE treats (
  doc_id       INTEGER REFERENCES doctor(doc_id),
  patient_id   INTEGER REFERENCES patient(patient_id),
  hours_spent  NUMERIC,
  PRIMARY KEY (doc_id, patient_id)
);`;

/* ---------------- sql.js bootstrap ---------------- */
async function initDb() {
  const SQL = await initSqlJs({
    locateFile: (f) => `https://cdn.jsdelivr.net/npm/sql.js@1.11.0/dist/${f}`,
  });
  SQLLib = SQL;
  db = new SQL.Database();
  const seedSql = await fetch("schema.sql").then((r) => r.text());
  db.run(seedSql);
  renderHeroStats();
  updateAccountCounts();
}

function query(sql, params = []) {
  const res = db.exec(sql, params);
  if (!res.length) return { columns: [], rows: [] };
  return { columns: res[0].columns, rows: res[0].values };
}

function run(sql) {
  db.run(sql);
}

function tableHtml({ columns, rows }) {
  if (!rows.length) return `<p class="muted small" style="padding:12px">No rows.</p>`;
  let html = "<table><thead><tr>";
  columns.forEach((c) => (html += `<th>${c}</th>`));
  html += "</tr></thead><tbody>";
  rows.forEach((r) => {
    html += "<tr>" + r.map((v) => `<td>${v === null ? "-" : v}</td>`).join("") + "</tr>";
  });
  html += "</tbody></table>";
  return html;
}

/* ---------------- role select / login ---------------- */
function renderHeroStats() {
  const dept = query("SELECT COUNT(*) FROM department").rows[0][0];
  const doc = query("SELECT COUNT(*) FROM doctor").rows[0][0];
  const pat = query("SELECT COUNT(*) FROM patient").rows[0][0];
  const crit = query("SELECT COUNT(*) FROM patient WHERE status='Critical'").rows[0][0];
  document.getElementById("heroStats").innerHTML = `
    <div class="stat"><div class="num">${dept}</div><div class="label">Departments</div></div>
    <div class="stat"><div class="num">${doc}</div><div class="label">Doctors</div></div>
    <div class="stat"><div class="num">${pat}</div><div class="label">Patients</div></div>
    <div class="stat danger"><div class="num">${crit}</div><div class="label">Critical cases</div></div>`;
}

document.querySelectorAll(".role-card").forEach((card) => {
  card.addEventListener("click", () => showAccountScreen(card.dataset.role));
});

function loadAccounts(role) {
  if (role === "doctor") {
    ROLES.doctor.accounts = query(`SELECT d.doc_id, d.fname, d.lname, dep.dname, d.dno FROM doctor d
                                   JOIN department dep ON dep.dno = d.dno ORDER BY d.doc_id`).rows
      .map(([id, f, l, dname, dno]) => ({ id: "doc" + id, name: `Dr. ${f} ${l}`, sub: dname, ref: id, dno }));
  } else if (role === "patient") {
    ROLES.patient.accounts = query(`SELECT p.patient_id, p.name, dep.dname FROM patient p
                                    JOIN doctor d ON d.doc_id = p.doc_id JOIN department dep ON dep.dno = d.dno
                                    ORDER BY p.patient_id`).rows
      .map(([id, name, dname]) => ({ id: "p" + id, name, sub: dname, ref: id }));
  }
}

function updateAccountCounts() {
  loadAccounts("doctor"); loadAccounts("patient");
  const counts = { admin: ROLES.admin.accounts.length, doctor: ROLES.doctor.accounts.length, patient: ROLES.patient.accounts.length };
  document.querySelectorAll(".role-card").forEach((c) => {
    const n = counts[c.dataset.role];
    c.querySelector(".acct-count").textContent = `${n} account${n === 1 ? "" : "s"}`;
  });
}

function showAccountScreen(role) {
  currentRole = role;
  loadAccounts(role);
  const r = ROLES[role];
  document.getElementById("accountRoleIcon").innerHTML = r.icon;
  document.getElementById("accountRoleTitle").textContent = `Welcome, ${r.title}`;
  document.getElementById("accountList").innerHTML = r.accounts
    .map(
      (a) => `<button class="account-item" data-id="${a.id}" data-name="${a.name}">
        <div class="avatar">${a.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
        <div class="meta"><strong>${a.name}</strong><span class="muted small">${a.sub}</span></div>
        <span class="go">Log in &rarr;</span>
      </button>`
    )
    .join("");
  document.querySelectorAll(".account-item").forEach((btn) => {
    btn.addEventListener("click", () => login(role, r.accounts.find((x) => x.id === btn.dataset.id)));
  });
  document.getElementById("roleScreen").classList.add("hidden");
  document.getElementById("accountScreen").classList.remove("hidden");
}

document.getElementById("backToRoles").addEventListener("click", () => {
  updateAccountCounts();
  document.getElementById("accountScreen").classList.add("hidden");
  document.getElementById("roleScreen").classList.remove("hidden");
});

function login(role, account) {
  const name = account.name;
  currentRole = role;
  currentAccount = account;
  document.getElementById("accountScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  document.getElementById("whoami").innerHTML = `<strong>${name}</strong><br><span class="muted">${ROLES[role].title}</span>`;
  applyRoleVisibility(role);
  navigate("dashboard");
}

document.getElementById("switchAccount").addEventListener("click", () => {
  document.getElementById("appShell").classList.add("hidden");
  showAccountScreen(currentRole);
});

function applyRoleVisibility(role) {
  document.querySelectorAll(".nav-link[data-role]").forEach((link) => {
    const allowed = link.dataset.role.split(",");
    link.style.display = allowed.includes(role) ? "" : "none";
  });
  document.querySelectorAll(".nav-group").forEach((g) => {
    const visible = [...g.querySelectorAll(".nav-link")].some((l) => l.style.display !== "none");
    g.style.display = visible ? "" : "none";
  });
}

/* ---------------- navigation ---------------- */
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navigate(link.dataset.page);
  });
});

function navigate(page) {
  const link = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (link && link.dataset.role && !link.dataset.role.split(",").includes(currentRole)) page = "dashboard";
  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));
  document.getElementById(`page-${page}`).classList.remove("hidden");
  document.querySelectorAll(".nav-link").forEach((l) => l.classList.toggle("active", l.dataset.page === page));
  renderPage(page);
}

function renderPage(page) {
  const renderers = {
    dashboard: renderDashboard,
    myreport: renderMyReport,
    ermodel: renderErModel,
    mapping: renderMapping,
    ddl: renderDdl,
    dml: renderDml,
    reports: renderReports,
    views: renderViews,
    access: renderAccess,
    indexing: renderIndexing,
    transactions: renderTransactions,
    sqlconsole: renderSqlConsole,
  };
  if (renderers[page]) renderers[page]();
}

/* ---------------- DASHBOARD ---------------- */
function statHtml(items) {
  return `<div class="stat-row">` + items.map(([n, l, d]) =>
    `<div class="stat${d ? " danger" : ""}"><div class="num">${n}</div><div class="label">${l}</div></div>`).join("") + `</div>`;
}

function wardRows(where) {
  const wards = query(`SELECT ward_name, capacity FROM ward ${where} ORDER BY capacity ASC`);
  return wards.rows.map(([name, cap]) => {
    const level = cap <= 6 ? "crit" : cap <= 12 ? "high" : "ok";
    const label = cap <= 6 ? "Few beds left" : cap <= 12 ? "Filling up" : "Available";
    return `<div class="risk-row"><span>${name}: ${cap} beds free</span><span class="pill ${level}">${label}</span></div>`;
  }).join("");
}

function renderDashboard() {
  document.getElementById("dashboardTitle").textContent = `${ROLES[currentRole].title} Dashboard`;
  const body = document.getElementById("dashBody");
  const n = (sql) => query(sql).rows[0][0];

  if (currentRole === "admin") {
    const summary = query(`
      SELECT d.dname AS department, COUNT(p.patient_id) AS total,
             SUM(CASE WHEN p.status='Critical' THEN 1 ELSE 0 END) AS critical,
             SUM(CASE WHEN p.status='Stable' THEN 1 ELSE 0 END) AS stable
      FROM department d JOIN doctor doc ON doc.dno = d.dno JOIN patient p ON p.doc_id = doc.doc_id
      GROUP BY d.dname`);
    body.innerHTML = statHtml([
      [n("SELECT COUNT(*) FROM department"), "Departments"],
      [n("SELECT COUNT(*) FROM doctor"), "Doctors"],
      [n("SELECT COUNT(*) FROM patient"), "Patients"],
      [n("SELECT COUNT(*) FROM patient WHERE status='Critical'"), "Critical cases", true],
    ]) + `<h3>Ward occupancy</h3><div class="risk-list">${wardRows("")}</div>
      <h3>Department-wise patient summary <span class="tag">SQL view</span></h3>
      <div class="table-wrap">${tableHtml(summary)}</div>`;
  } else if (currentRole === "doctor") {
    const me = currentAccount.ref, dno = currentAccount.dno;
    const mine = query(`SELECT patient_id, name, age, disease, status FROM patient WHERE doc_id = ${me} ORDER BY status, name`);
    body.innerHTML = statHtml([
      [n(`SELECT COUNT(*) FROM patient WHERE doc_id = ${me}`), "My patients"],
      [n(`SELECT COUNT(*) FROM patient WHERE doc_id = ${me} AND status='Critical'`), "My critical cases", true],
      [n(`SELECT COALESCE(SUM(hours_spent),0) FROM treats WHERE doc_id = ${me}`), "Hours logged"],
    ]) + `<h3>My patients</h3><div class="table-wrap">${tableHtml(mine)}</div>
      <h3>Wards in my department</h3><div class="risk-list">${wardRows(`WHERE dno = ${dno}`)}</div>`;
  } else {
    const me = currentAccount.ref;
    const rec = query(`SELECT p.name, p.age, p.disease, p.status,
                              d.fname || ' ' || d.lname AS doctor, d.specialization, dep.dname AS department
                       FROM patient p JOIN doctor d ON d.doc_id = p.doc_id
                       JOIN department dep ON dep.dno = d.dno WHERE p.patient_id = ${me}`);
    body.innerHTML = rec.rows.length
      ? `<h3>My record</h3><div class="table-wrap">${tableHtml(rec)}</div>
         <p class="muted small">Open My Report in the sidebar for your full report. Other pages are limited to staff.</p>`
      : `<p class="muted">No record found for this account.</p>`;
  }
}

/* ---------------- MY REPORT (patient) ---------------- */
function renderMyReport() {
  const me = currentAccount.ref;
  const body = document.getElementById("myReportBody");
  const rec = query(`SELECT p.patient_id, p.name, p.age, p.disease, p.status,
                            d.fname || ' ' || d.lname AS doctor, d.specialization, dep.dname AS department, dep.location
                     FROM patient p JOIN doctor d ON d.doc_id = p.doc_id
                     JOIN department dep ON dep.dno = d.dno WHERE p.patient_id = ${me}`);
  if (!rec.rows.length) { body.innerHTML = `<p class="muted">No record found for this account.</p>`; return; }
  const [id, name, age, disease, status, doctor, spec, dept, loc] = rec.rows[0];
  const level = status === "Critical" ? "crit" : "ok";
  const care = query(`SELECT 'Dr. ' || d.fname || ' ' || d.lname AS doctor, d.specialization, t.hours_spent AS hours_of_care
                      FROM treats t JOIN doctor d ON d.doc_id = t.doc_id WHERE t.patient_id = ${me}`);
  const wards = query(`SELECT w.ward_name, w.capacity AS free_beds FROM ward w
                       JOIN doctor d ON d.dno = w.dno JOIN patient p ON p.doc_id = d.doc_id
                       WHERE p.patient_id = ${me} GROUP BY w.ward_no`);
  body.innerHTML = `
    <div class="theory-box">
      <h4>${name} <span class="pill ${level}">${status}</span></h4>
      <p class="muted">Patient ID ${id} &middot; Age ${age} &middot; Diagnosis: <strong>${disease}</strong></p>
      <p class="muted">Treating doctor: <strong>Dr. ${doctor}</strong> (${spec}), ${dept} department, ${loc}.</p>
    </div>
    <h3>Treatment history <span class="tag">treats</span></h3>
    <div class="table-wrap">${tableHtml(care)}</div>
    <h3>Wards in my department</h3>
    <div class="table-wrap">${tableHtml(wards)}</div>`;
  document.getElementById("btnPrintReport").onclick = () => window.print();
}

/* ---------------- ER MODEL (Exp 1) ---------------- */
function renderErModel() {
  const box = (x, y, w, h, fill, stroke, title, lines) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
    <text x="${x + w / 2}" y="${y + 22}" text-anchor="middle" font-size="13" font-weight="700" fill="${stroke}" font-family="Inter,sans-serif">${title}</text>
    ${lines.map((l, i) => `<text x="${x + w / 2}" y="${y + 42 + i * 16}" text-anchor="middle" font-size="11" fill="#475569" font-family="Inter,sans-serif">${l}</text>`).join("")}
  `;
  const diamond = (cx, cy, w, h, label) => `
    <polygon points="${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}" fill="#fff" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="10.5" fill="#334155" font-family="Inter,sans-serif">${label}</text>
  `;
  const svg = `
  <svg viewBox="0 0 820 300" width="820" height="300">
    ${box(20, 30, 170, 90, "#eff6ff", "#1d4ed8", "DEPARTMENT", ["dno (PK)", "dname, location"])}
    ${box(20, 180, 170, 90, "#eff6ff", "#1d4ed8", "WARD", ["ward_no (PK)", "ward_name, capacity", "dno (FK)"])}
    ${box(320, 30, 170, 90, "#f0fdfa", "#0f5852", "DOCTOR", ["doc_id (PK)", "fname, lname, salary", "dno (FK)"])}
    ${box(320, 180, 170, 90, "#fef2f2", "#b91c1c", "PATIENT", ["patient_id (PK)", "name, age, disease", "doc_id (FK, total)"])}
    ${box(620, 90, 180, 90, "#f5f3ff", "#6d28d9", "TREATS", ["doc_id + patient_id (PK)", "hours_spent"])}
    <line x1="190" y1="75" x2="320" y2="75" stroke="#1d4ed8" stroke-width="1.5"/>
    <text x="255" y="68" text-anchor="middle" font-size="10.5" fill="#1d4ed8" font-family="Inter,sans-serif">1 : N</text>
    <line x1="190" y1="225" x2="320" y2="225" stroke="#1d4ed8" stroke-width="1.5"/>
    <text x="255" y="218" text-anchor="middle" font-size="10.5" fill="#1d4ed8" font-family="Inter,sans-serif">1 : N</text>
    <line x1="490" y1="110" x2="620" y2="125" stroke="#6d28d9" stroke-width="1.5"/>
    <line x1="490" y1="225" x2="620" y2="155" stroke="#6d28d9" stroke-width="1.5"/>
    <text x="555" y="105" text-anchor="middle" font-size="10.5" fill="#6d28d9" font-family="Inter,sans-serif">M : N</text>
  </svg>`;
  document.getElementById("erDiagram").innerHTML = svg;
}

/* ---------------- RELATIONAL MAPPING (Exp 2) ---------------- */
function renderMapping() {
  document.getElementById("mappingTable").innerHTML = tableHtml({
    columns: ["ER construct", "Mapping rule", "Resulting relation"],
    rows: [
      ["DEPARTMENT (strong entity)", "Relation with its own attributes", "department(dno, dname, location)"],
      ["DOCTOR (strong entity, 1:N with DEPARTMENT)", "Relation + FK to department", "doctor(doc_id, fname, lname, specialization, salary, dno)"],
      ["WARD (strong entity, 1:N with DEPARTMENT)", "Relation + FK to department", "ward(ward_no, ward_name, capacity, dno)"],
      ["PATIENT (total participation in treats)", "Relation + FK to doctor, NOT NULL", "patient(patient_id, name, age, disease, status, doc_id)"],
      ["TREATS (M:N relationship, DOCTOR&ndash;PATIENT)", "New relation with both PKs as composite PK", "treats(doc_id, patient_id, hours_spent)"],
    ],
  });
}

/* ---------------- DDL (Exp 3) ---------------- */
function renderDdl() {
  document.getElementById("ddlCode").textContent = DDL_TEXT;
  document.getElementById("btnRunDdl").onclick = () => {
    try {
      const scratch = new SQLLib.Database();
      scratch.run(DDL_TEXT);
      const tables = scratch.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")[0].values.flat();
      scratch.close();
      document.getElementById("ddlResult").textContent =
        "DDL ran without errors on a scratch database. Tables created: " + tables.join(", ") + ". Live data was not touched.";
    } catch (err) {
      document.getElementById("ddlResult").textContent = "DDL failed: " + err.message;
    }
  };
}

/* ---------------- DML (Exp 4) ---------------- */
function renderDml() {
  const isAdmin = currentRole === "admin";
  const me = currentAccount.ref;
  const docs = isAdmin
    ? query("SELECT doc_id, fname, lname FROM doctor")
    : query(`SELECT doc_id, fname, lname FROM doctor WHERE doc_id = ${me}`);
  document.getElementById("doctorSelect").innerHTML = docs.rows
    .map(([id, f, l]) => `<option value="${id}">Dr. ${f} ${l}</option>`).join("");

  const depts = query("SELECT dno, dname FROM department");
  document.getElementById("deptSelect").innerHTML = depts.rows
    .map(([id, name]) => `<option value="${id}">${name}</option>`).join("");

  document.getElementById("raiseBlock").style.display = isAdmin ? "" : "none";
  document.getElementById("doctorBlock").style.display = isAdmin ? "" : "none";
  document.getElementById("patientsHeading").firstChild.textContent = isAdmin ? "All patients " : "My patients ";

  renderPatientTable();
  if (isAdmin) renderDoctorTable();
  refreshDischargeOptions();

  document.getElementById("addPatientForm").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const nextId = query("SELECT COALESCE(MAX(patient_id),0)+1 FROM patient").rows[0][0];
    run(`INSERT INTO patient (patient_id, name, age, disease, status, doc_id)
         VALUES (${nextId}, '${f.get("name").replace(/'/g, "''")}', ${Number(f.get("age"))}, '${f.get("disease").replace(/'/g, "''")}', 'Stable', ${f.get("doc_id")})`);
    e.target.reset();
    renderPatientTable();
    refreshDischargeOptions();
  };

  document.getElementById("raiseForm").onsubmit = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const f = new FormData(e.target);
    run(`UPDATE doctor SET salary = salary + ${Number(f.get("amount"))} WHERE dno = ${f.get("dno")}`);
    renderDoctorTable();
  };

  document.getElementById("dischargeForm").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const id = Number(f.get("patient_id"));
    run(`DELETE FROM treats WHERE patient_id = ${id}`);
    run(`DELETE FROM patient WHERE patient_id = ${id}`);
    renderPatientTable();
    refreshDischargeOptions();
  };
}

function refreshDischargeOptions() {
  const scope = currentRole === "admin" ? "" : `WHERE doc_id = ${currentAccount.ref}`;
  const patients = query(`SELECT patient_id, name FROM patient ${scope} ORDER BY name`);
  document.getElementById("dischargeSelect").innerHTML = patients.rows
    .map(([id, name]) => `<option value="${id}">${name}</option>`).join("");
}

function renderPatientTable() {
  const res = query(`SELECT p.patient_id, p.name, p.age, p.disease, p.status, d.fname || ' ' || d.lname AS doctor
                      FROM patient p JOIN doctor d ON d.doc_id = p.doc_id
                      ${currentRole === "admin" ? "" : `WHERE p.doc_id = ${currentAccount.ref}`} ORDER BY p.patient_id`);
  document.getElementById("patientTable").innerHTML = tableHtml(res);
}

function renderDoctorTable() {
  const res = query(`SELECT doc.doc_id, doc.fname || ' ' || doc.lname AS doctor, doc.specialization, doc.salary, dep.dname
                      FROM doctor doc JOIN department dep ON dep.dno = doc.dno ORDER BY doc.doc_id`);
  document.getElementById("doctorTable").innerHTML = tableHtml(res);
}

/* ---------------- REPORTS (Exp 5) ---------------- */
const REPORT_QUERIES = [
  { label: "Patients per doctor (GROUP BY)", sql: `SELECT d.fname || ' ' || d.lname AS doctor, COUNT(*) AS patients
    FROM patient p JOIN doctor d ON d.doc_id = p.doc_id GROUP BY d.doc_id ORDER BY patients DESC;` },
  { label: "Doctors with 2+ patients (HAVING)", sql: `SELECT d.fname || ' ' || d.lname AS doctor, COUNT(*) AS patients
    FROM patient p JOIN doctor d ON d.doc_id = p.doc_id GROUP BY d.doc_id HAVING COUNT(*) >= 2;` },
  { label: "Average salary by department (GROUP BY)", sql: `SELECT dep.dname, AVG(doc.salary) AS avg_salary
    FROM doctor doc JOIN department dep ON dep.dno = doc.dno GROUP BY dep.dname;` },
  { label: "Patients ordered by age (ORDER BY)", sql: `SELECT name, age, disease FROM patient ORDER BY age DESC;` },
  { label: "Disease name contains 'art' (LIKE)", sql: `SELECT name, disease FROM patient WHERE disease LIKE '%art%';` },
  { label: "Name starts with 'A' (LIKE)", sql: `SELECT name FROM patient WHERE name LIKE 'A%';` },
];

function renderReports() {
  document.getElementById("reportButtons").innerHTML = REPORT_QUERIES
    .map((q, i) => `<button data-i="${i}">${q.label}</button>`).join("");
  document.querySelectorAll("#reportButtons button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#reportButtons button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const q = REPORT_QUERIES[btn.dataset.i];
      document.getElementById("reportSql").textContent = q.sql;
      document.getElementById("reportResult").innerHTML = tableHtml(query(q.sql));
    });
  });
  document.getElementById("reportButtons").firstChild && document.querySelector("#reportButtons button").click();
}

/* ---------------- VIEWS & JOINS (Exp 6) ---------------- */
const VIEW_QUERIES = [
  { label: "CREATE VIEW critical_patients", sql: `DROP VIEW IF EXISTS critical_patients;
CREATE VIEW critical_patients AS
  SELECT patient_id, name, disease FROM patient WHERE status = 'Critical';
SELECT * FROM critical_patients;` },
  { label: "INNER JOIN patient + doctor", sql: `SELECT p.name AS patient, d.fname || ' ' || d.lname AS doctor, d.specialization
FROM patient p INNER JOIN doctor d ON d.doc_id = p.doc_id;` },
  { label: "LEFT JOIN ward + department", sql: `SELECT w.ward_name, d.dname
FROM ward w LEFT JOIN department d ON d.dno = w.dno;` },
  { label: "Subquery: patients of Cardiology doctors (IN)", sql: `SELECT name, disease FROM patient
WHERE doc_id IN (SELECT doc_id FROM doctor WHERE dno = (SELECT dno FROM department WHERE dname='Cardiology'));` },
  { label: "EXISTS: doctors who treat a critical patient", sql: `SELECT fname, lname FROM doctor d
WHERE EXISTS (SELECT 1 FROM patient p WHERE p.doc_id = d.doc_id AND p.status = 'Critical');` },
];

function renderViews() {
  document.getElementById("viewButtons").innerHTML = VIEW_QUERIES
    .map((q, i) => `<button data-i="${i}">${q.label}</button>`).join("");
  document.querySelectorAll("#viewButtons button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#viewButtons button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const q = VIEW_QUERIES[btn.dataset.i];
      document.getElementById("viewSql").textContent = q.sql;
      const stmts = q.sql.split(";").map((s) => s.trim()).filter(Boolean);
      let result = { columns: [], rows: [] };
      stmts.forEach((s) => {
        if (/^select/i.test(s)) result = query(s);
        else run(s);
      });
      document.getElementById("viewResult").innerHTML = tableHtml(result);
    });
  });
  document.querySelector("#viewButtons button").click();
}

/* ---------------- ACCESS CONTROL (Exp 7) ---------------- */
function renderAccess() {
  document.getElementById("accessMatrix").innerHTML = tableHtml({
    columns: ["Page / resource", "Administrator", "Doctor", "Patient"],
    rows: [
      ["Dashboard", "Hospital-wide", "Own patients and department", "Own record only"],
      ["My Report (own diagnosis, doctors, ward)", "No", "No", "Own report only"],
      ["ER / EER Model, Relational Mapping", "Yes", "Yes", "No"],
      ["Schema (DDL)", "Yes", "No", "No"],
      ["Records: add / discharge patients", "All patients", "Own patients only", "No"],
      ["Records: salary raise, doctor list", "Yes", "No", "No"],
      ["Reports (SELECT + aggregates)", "Yes", "Yes", "No"],
      ["Views & Joins", "Yes", "Yes", "No"],
      ["Access Control, Indexing, Transactions", "Yes", "No", "No"],
      ["SQL Console (raw SQL)", "Yes", "No", "No"],
    ],
  });
}

/* ---------------- INDEXING (Exp 8) ---------------- */
function renderIndexing() {
  document.getElementById("planBefore").textContent = "";
  document.getElementById("planAfter").textContent = "";

  document.getElementById("btnExplainBefore").onclick = () => {
    run("DROP INDEX IF EXISTS idx_disease");
    const res = query("EXPLAIN QUERY PLAN SELECT * FROM patient WHERE disease = 'Fracture';");
    document.getElementById("planBefore").textContent = res.rows.map((r) => r.join(" | ")).join("\n") || "(no plan rows)";
  };
  document.getElementById("btnCreateIndex").onclick = () => {
    run("CREATE INDEX IF NOT EXISTS idx_disease ON patient(disease);");
    alert("Index created on patient(disease).");
  };
  document.getElementById("btnExplainAfter").onclick = () => {
    const res = query("EXPLAIN QUERY PLAN SELECT * FROM patient WHERE disease = 'Fracture';");
    document.getElementById("planAfter").textContent = res.rows.map((r) => r.join(" | ")).join("\n") || "(no plan rows)";
  };
}

/* ---------------- TRANSACTIONS (Exp 9) ---------------- */
function renderTransactions() {
  renderWardTable();
  document.getElementById("txResult").textContent = "";

  document.getElementById("btnTransfer").onclick = () => {
    try {
      run("BEGIN;");
      run("UPDATE ward SET capacity = capacity + 1 WHERE ward_no = 1;");
      run("UPDATE ward SET capacity = capacity - 1 WHERE ward_no = 5;");
      run("COMMIT;");
      document.getElementById("txResult").textContent = "Transaction committed: 1 patient moved from Cardiac ICU to General Ward (Cardiac ICU +1 free bed, General Ward -1).";
    } catch (e) {
      run("ROLLBACK;");
      document.getElementById("txResult").textContent = "Transaction failed and was rolled back: " + e.message;
    }
    renderWardTable();
  };

  document.getElementById("btnRollback").onclick = () => {
    const before = query("SELECT COUNT(*) FROM patient WHERE name='A. Shah'").rows[0][0];
    run("BEGIN;");
    run("DELETE FROM patient WHERE name = 'A. Shah';");
    const mid = query("SELECT COUNT(*) FROM patient WHERE name='A. Shah'").rows[0][0];
    run("ROLLBACK;");
    const after = query("SELECT COUNT(*) FROM patient WHERE name='A. Shah'").rows[0][0];
    document.getElementById("txResult").textContent =
      `Before: ${before} row(s). Mid-transaction (uncommitted DELETE): ${mid} row(s). After ROLLBACK: ${after} row(s) - change was undone.`;
  };
}

function renderWardTable() {
  document.getElementById("wardTable").innerHTML = tableHtml(query("SELECT ward_name, capacity AS free_beds FROM ward ORDER BY ward_no"));
}

/* ---------------- SQL CONSOLE ---------------- */
const CONSOLE_EXAMPLES = [
  "SELECT * FROM patient;",
  "SELECT name, disease FROM patient WHERE status = 'Critical';",
  "SELECT dname, COUNT(*) FROM department d JOIN doctor doc ON doc.dno=d.dno GROUP BY dname;",
  "PRAGMA table_info(patient);",
];

function renderSqlConsole() {
  document.getElementById("consoleButtons").innerHTML = CONSOLE_EXAMPLES
    .map((q, i) => `<button data-i="${i}">${q.length > 38 ? q.slice(0, 38) + "..." : q}</button>`).join("");
  document.querySelectorAll("#consoleButtons button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("sqlInput").value = CONSOLE_EXAMPLES[btn.dataset.i];
    });
  });

  document.getElementById("btnRunSql").onclick = () => {
    const sql = document.getElementById("sqlInput").value.trim();
    if (!sql) return;
    try {
      if (/^select|^explain|^pragma/i.test(sql)) {
        document.getElementById("sqlConsoleResult").innerHTML = tableHtml(query(sql));
      } else {
        run(sql);
        document.getElementById("sqlConsoleResult").innerHTML = `<p class="muted small" style="padding:12px">Statement executed.</p>`;
      }
    } catch (e) {
      document.getElementById("sqlConsoleResult").innerHTML = `<p class="muted small" style="padding:12px;color:#dc2626">${e.message}</p>`;
    }
  };
}

/* ---------------- boot ---------------- */
initDb();

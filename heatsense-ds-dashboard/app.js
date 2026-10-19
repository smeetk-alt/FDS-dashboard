/* HeatSense - Data Structures Mini Project (weather heatwave detection) */

/* ---------------- navigation ---------------- */
document.getElementById("enterBtn").addEventListener("click", () => {
  document.getElementById("landingScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  navigate("registry");
});
document.getElementById("backToLanding").addEventListener("click", () => {
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("landingScreen").classList.remove("hidden");
});

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navigate(link.dataset.page);
  });
});

function navigate(page) {
  T.setPage(page);
  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));
  document.getElementById(`page-${page}`).classList.remove("hidden");
  document.querySelectorAll(".nav-link").forEach((l) => l.classList.toggle("active", l.dataset.page === page));
  if (renderers[page]) renderers[page]();
}

async function loadCode(path, targetId) {
  try {
    const res = await fetch(path);
    const text = await res.text();
    document.getElementById(targetId).textContent = text;
  } catch (e) {
    document.getElementById(targetId).textContent = "Could not load source (open this page via a local web server, not file://).";
  }
}

const renderers = {
  registry: () => { renderRegistry(); loadCode("c_programs/exp1_station_registry.c", "registryCode"); },
  alertlog: () => { renderAlertLog(); loadCode("c_programs/exp2_alert_log_sll.c", "sllCode"); },
  stack: () => { loadCode("c_programs/exp3_heatindex_stack.c", "stackCode"); },
  queue: () => { renderQueue(); loadCode("c_programs/exp4_dispatch_queue.c", "queueCode"); },
  bst: () => { renderBst(); loadCode("c_programs/exp5_station_bst.c", "bstCode"); },
  graph: () => { renderGraph(); loadCode("c_programs/exp6_region_network_bfs.c", "graphCode"); },
  sortsearch: () => { if (!records.length) regenerateRecords(); renderRecords(); loadCode("c_programs/exp7_history_sort_search.c", "sortCode"); },
  hashtable: () => { renderHash(); loadCode("c_programs/exp8_station_hashtable.c", "hashCode"); },
};

/* ---------------- landing stats ---------------- */
document.getElementById("heroStats").innerHTML = `
  <div class="stat"><div class="num">8</div><div class="label">Experiments</div></div>
  <div class="stat"><div class="num">8</div><div class="label">Data structures</div></div>
  <div class="stat danger"><div class="num">1</div><div class="label">Heatwave case study</div></div>`;

/* ===================================================================
   EXP 1: Station Registry (array of structs)
   =================================================================== */
const MAX_STATIONS = 50;
let registry = [];

function registryTableHtml() {
  if (!registry.length) return `<p class="muted small" style="padding:12px">Registry empty.</p>`;
  let html = "<table><thead><tr><th>ID</th><th>Name</th><th>Temp (C)</th></tr></thead><tbody>";
  registry.forEach((s) => { html += `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.temp.toFixed(1)}</td></tr>`; });
  html += "</tbody></table>";
  return html;
}

function renderRegistry() {
  document.getElementById("registryTable").innerHTML = registryTableHtml();
}

document.getElementById("registryForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  if (registry.length >= MAX_STATIONS) { alert("Registry full (MAX 50)."); return; }
  const newStation = { id: Number(f.get("id")), name: f.get("name"), temp: Number(f.get("temp")) };
  registry.push(newStation);
  T.step(`insert ${newStation.name} at index ${registry.length - 1} (one write, no shifting)`);
  e.target.reset();
  renderRegistry();
});
document.getElementById("btnDeleteLast").addEventListener("click", () => {
  const removed = registry.pop();
  if (removed) T.step(`delete last: ${removed.name} (count decremented, slot reused later)`);
  renderRegistry();
});
document.getElementById("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = Number(new FormData(e.target).get("id"));
  let found = null;
  for (const s of registry) {
    T.count("comparisons");
    if (s.id === id) { found = s; break; }
  }
  T.step(`search ID ${id}: ${found ? "found " + found.name : "not found after " + registry.length + " comparisons"}`);
  document.getElementById("searchResult").textContent = found
    ? `Found: ${found.name}, ${found.temp.toFixed(1)}C`
    : "Station not found.";
});

/* ===================================================================
   EXP 2: Alert Log (Singly Linked List)
   =================================================================== */
let sllHead = null; // { id, region, next }

function sllInsertBegin(id, region) {
  sllHead = { id, region, next: sllHead };
  T.step(`insert ${id} at begin: new.next = old head, head = new (O(1))`);
}
function sllInsertAfter(id, region, existingId) {
  let p = sllHead;
  while (p && p.id !== existingId) { T.count("traversal steps"); p = p.next; }
  if (!p) { document.getElementById("sllResult").textContent = `Existing alert ${existingId} not found.`; return; }
  p.next = { id, region, next: p.next };
  T.step(`insert ${id} after ${existingId}: relinked next pointers`);
}
function sllDeleteBefore(existingId) {
  if (!sllHead || sllHead.id === existingId) {
    document.getElementById("sllResult").textContent = `No node before ${existingId}.`;
    return;
  }
  let prev = null, cur = sllHead;
  while (cur.next && cur.next.id !== existingId) { T.count("traversal steps"); prev = cur; cur = cur.next; }
  if (!cur.next) { document.getElementById("sllResult").textContent = `Existing alert ${existingId} not found.`; return; }
  if (!prev) sllHead = cur.next; else prev.next = cur.next;
  T.step(`unlink node ${cur.id} (prev.next now skips it)`);
  document.getElementById("sllResult").textContent = `Deleted alert ${cur.id} (${cur.region}).`;
}

function sllToArray() {
  const arr = [];
  let p = sllHead;
  while (p) { arr.push(p); p = p.next; }
  return arr;
}

function renderAlertLog() {
  const arr = sllToArray();
  document.getElementById("sllViz").innerHTML = arr.length
    ? arr.map((n, i) => `<div class="viz-cell">${n.id}<span class="sub">${n.region}</span></div>${i < arr.length - 1 ? '<span class="arrow">&rarr;</span>' : '<span class="arrow">&rarr; NULL</span>'}`).join("")
    : `<p class="muted small">Log empty (START = NULL).</p>`;
  const opts = arr.map((n) => `<option value="${n.id}">${n.id} - ${n.region}</option>`).join("");
  document.getElementById("sllExistingSelect1").innerHTML = opts || `<option value="">(no alerts yet)</option>`;
  document.getElementById("sllExistingSelect2").innerHTML = opts || `<option value="">(no alerts yet)</option>`;
}

document.getElementById("sllInsertBeginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  sllInsertBegin(Number(f.get("id")), f.get("region"));
  e.target.reset();
  renderAlertLog();
});
document.getElementById("sllInsertAfterForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  sllInsertAfter(Number(f.get("id")), f.get("region"), Number(f.get("existing")));
  e.target.reset();
  renderAlertLog();
});
document.getElementById("sllDeleteBeforeForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  sllDeleteBefore(Number(f.get("existing")));
  renderAlertLog();
});

/* ===================================================================
   EXP 3: Dynamic Stack + Infix to Postfix
   =================================================================== */
function precedence(op) {
  if (op === "+" || op === "-") return 1;
  if (op === "*" || op === "/") return 2;
  return 0;
}
function isAlnum(ch) { return /[a-zA-Z0-9]/.test(ch); }

function infixToPostfixTraced(infix) {
  const stack = [];
  let postfix = "";
  const steps = [];

  for (const ch of infix) {
    if (isAlnum(ch)) {
      postfix += ch;
    } else if (ch === "(") {
      stack.push(ch);
    } else if (ch === ")") {
      while (stack.length && stack[stack.length - 1] !== "(") postfix += stack.pop();
      stack.pop();
    } else {
      while (stack.length && precedence(stack[stack.length - 1]) >= precedence(ch)) postfix += stack.pop();
      stack.push(ch);
    }
    steps.push({ token: ch, stack: stack.join(" "), postfix });
    T.count("tokens read");
    T.step(`token '${ch}': stack [${stack.join(" ")}], output ${postfix}`);
  }
  while (stack.length) postfix += stack.pop();
  steps.push({ token: "(end)", stack: stack.join(" "), postfix });
  return { postfix, steps };
}

document.getElementById("infixForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const expr = new FormData(e.target).get("expr").replace(/\s+/g, "");
  const { postfix, steps } = infixToPostfixTraced(expr);
  let html = "<table><thead><tr><th>Token</th><th>Stack (top -&gt; right)</th><th>Postfix so far</th></tr></thead><tbody>";
  steps.forEach((s) => { html += `<tr><td>${s.token}</td><td>${s.stack || "(empty)"}</td><td>${s.postfix}</td></tr>`; });
  html += "</tbody></table>";
  document.getElementById("stackTrace").innerHTML = html;
});

/* ===================================================================
   EXP 4: Static Circular Queue (counter method)
   =================================================================== */
const Q_SIZE = 5;
let cq = new Array(Q_SIZE).fill(null);
let qFront = 0, qRear = 0, qCount = 0;

function renderQueue() {
  document.getElementById("queueViz").innerHTML = cq
    .map((v, i) => {
      const isFront = qCount > 0 && i === qFront;
      const isRear = qCount > 0 && i === (qRear - 1 + Q_SIZE) % Q_SIZE;
      const cls = v === null ? "empty" : isFront ? "active" : isRear ? "found" : "";
      const sub = isFront ? "front" : isRear ? "rear" : "";
      return `<div class="viz-cell ${cls}">${v === null ? "-" : v}<span class="sub">${i}${sub ? " " + sub : ""}</span></div>`;
    })
    .join("");
  document.getElementById("qFront").textContent = qFront;
  document.getElementById("qRear").textContent = qRear;
  document.getElementById("qCount").textContent = qCount;
}

document.getElementById("enqueueForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = Number(new FormData(e.target).get("id"));
  if (qCount === Q_SIZE) {
    document.getElementById("queueResult").textContent = `Queue full. Cannot dispatch alert ${id}.`;
  } else {
    cq[qRear] = id;
    T.count("enqueues");
    T.step(`enqueue ${id} at slot ${qRear}`);
    qRear = (qRear + 1) % Q_SIZE;
    qCount++;
    document.getElementById("queueResult").textContent = `Alert ${id} enqueued.`;
    e.target.reset();
  }
  renderQueue();
});
document.getElementById("btnDequeue").addEventListener("click", () => {
  if (qCount === 0) {
    document.getElementById("queueResult").textContent = "Queue empty.";
  } else {
    const val = cq[qFront];
    T.count("dequeues");
    T.step(`dequeue ${val} from slot ${qFront}`);
    cq[qFront] = null;
    qFront = (qFront + 1) % Q_SIZE;
    qCount--;
    document.getElementById("queueResult").textContent = `Dispatched alert ${val}.`;
  }
  renderQueue();
});

/* ===================================================================
   EXP 5: Binary Search Tree
   =================================================================== */
let bstRoot = null; // { temp, left, right }

function bstInsert(node, temp) {
  if (!node) {
    T.step(`place ${temp} as a new leaf`);
    return { temp, left: null, right: null };
  }
  T.count("comparisons");
  T.step(`compare ${temp} with ${node.temp}: go ${temp < node.temp ? "left" : temp > node.temp ? "right" : "stop (duplicate)"}`);
  if (temp < node.temp) node.left = bstInsert(node.left, temp);
  else if (temp > node.temp) node.right = bstInsert(node.right, temp);
  return node;
}
function bstSearch(node, temp) {
  if (!node) return null;
  T.count("comparisons");
  T.step(`search: compare ${temp} with ${node.temp}`);
  if (temp === node.temp) return node;
  return temp < node.temp ? bstSearch(node.left, temp) : bstSearch(node.right, temp);
}
function bstFindMin(node) { while (node.left) node = node.left; return node; }
function bstDelete(node, temp) {
  if (!node) return null;
  T.count("comparisons");
  if (temp < node.temp) node.left = bstDelete(node.left, temp);
  else if (temp > node.temp) node.right = bstDelete(node.right, temp);
  else {
    if (!node.left) return node.right;
    if (!node.right) return node.left;
    const succ = bstFindMin(node.right);
    T.step(`two children: replace ${node.temp} with inorder successor ${succ.temp}`);
    node.temp = succ.temp;
    node.right = bstDelete(node.right, succ.temp);
  }
  return node;
}
function bstInorder(node, out) {
  if (!node) return;
  bstInorder(node.left, out);
  out.push(node.temp);
  bstInorder(node.right, out);
}
function bstLevels(root) {
  const levels = [];
  let queue = root ? [root] : [];
  while (queue.length) {
    levels.push(queue.map((n) => n.temp));
    const next = [];
    queue.forEach((n) => { if (n.left) next.push(n.left); if (n.right) next.push(n.right); });
    queue = next;
  }
  return levels;
}

[40, 46.3, 36.1, 44.8, 31].forEach((t) => { bstRoot = bstInsert(bstRoot, t); });

function renderBst() {
  const levels = bstLevels(bstRoot);
  document.getElementById("bstViz").innerHTML = levels
    .map((lvl) => `<div class="viz-row">${lvl.map((t) => `<div class="viz-cell">${t}</div>`).join("")}</div>`)
    .join("") || `<p class="muted small">Tree empty.</p>`;
  const out = [];
  bstInorder(bstRoot, out);
  document.getElementById("bstInorder").innerHTML = out.length
    ? out.map((t) => `<div class="viz-cell">${t}</div>`).join("")
    : `<p class="muted small">Tree empty.</p>`;
}

document.getElementById("bstInsertForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const temp = Number(new FormData(e.target).get("temp"));
  bstRoot = bstInsert(bstRoot, temp);
  e.target.reset();
  document.getElementById("bstResult").textContent = `Inserted ${temp}.`;
  renderBst();
});
document.getElementById("bstSearchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const temp = Number(new FormData(e.target).get("temp"));
  const found = bstSearch(bstRoot, temp);
  document.getElementById("bstResult").textContent = found ? `Found station reading ${temp}.` : `Not found.`;
});
document.getElementById("bstDeleteForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const temp = Number(new FormData(e.target).get("temp"));
  bstRoot = bstDelete(bstRoot, temp);
  document.getElementById("bstResult").textContent = `Deleted ${temp} (if present).`;
  renderBst();
});

/* ===================================================================
   EXP 6: Graph Traversal (BFS), Adjacency Matrix
   =================================================================== */
const regionNames = ["Chandrapur", "Nagpur", "Akola", "Amravati", "Yavatmal", "Wardha"];
const adj = [
  [0, 1, 0, 1, 0, 0],
  [1, 0, 1, 0, 0, 1],
  [0, 1, 0, 0, 1, 0],
  [1, 0, 0, 0, 1, 1],
  [0, 0, 1, 1, 0, 0],
  [0, 1, 0, 1, 0, 0],
];

function bfs(start) {
  const visited = new Array(regionNames.length).fill(false);
  const queue = [start];
  visited[start] = true;
  const order = [];
  while (queue.length) {
    const v = queue.shift();
    T.step(`dequeue ${regionNames[v]}`);
    order.push(v);
    for (let w = 0; w < regionNames.length; w++) {
      T.count("cells checked");
      if (adj[v][w] === 1 && !visited[w]) {
        queue.push(w);
        T.step(`discover ${regionNames[w]} from ${regionNames[v]}`);
        visited[w] = true;
      }
    }
  }
  return order;
}

function renderGraph() {
  document.getElementById("bfsStartSelect").innerHTML = regionNames
    .map((n, i) => `<option value="${i}">${n}</option>`).join("");

  let html = "<table><thead><tr><th></th>" + regionNames.map((n) => `<th>${n.slice(0, 4)}</th>`).join("") + "</tr></thead><tbody>";
  regionNames.forEach((n, i) => {
    html += `<tr><th>${n}</th>` + adj[i].map((v) => `<td>${v}</td>`).join("") + "</tr>";
  });
  html += "</tbody></table>";
  document.getElementById("graphViz").innerHTML = html;
}

document.getElementById("bfsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const start = Number(new FormData(e.target).get("start"));
  const order = bfs(start);
  document.getElementById("bfsOrder").innerHTML = order
    .map((i, idx) => `<div class="viz-cell visited">${regionNames[i]}<span class="sub">step ${idx + 1}</span></div>`)
    .join("");
});

/* ===================================================================
   EXP 7: QuickSort + Binary Search
   =================================================================== */
let records = [];
let chennaiSeries = [];

function regenerateRecords() {
  records = chennaiSeries.map((d) => d.temp);
  quickSort(records, 0, records.length - 1);
}
function quickSort(arr, low, high) {
  if (low < high) {
    const pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
}
function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    T.count("comparisons");
    if (arr[j] <= pivot) { i++; [arr[i], arr[j]] = [arr[j], arr[i]]; T.count("swaps"); }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}
function binarySearchTraced(arr, key) {
  let low = 0, high = arr.length - 1;
  const steps = [];
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    steps.push(mid);
    T.count("probes");
    T.step(`probe index ${mid} (value ${arr[mid]})`);
    if (arr[mid] === key) return { index: mid, steps };
    else if (arr[mid] < key) low = mid + 1;
    else high = mid - 1;
  }
  return { index: -1, steps };
}

function renderRecords(highlightIdx = -1, visited = []) {
  document.getElementById("recordsViz").innerHTML = records
    .map((t, i) => {
      const cls = i === highlightIdx ? "found" : visited.includes(i) ? "active" : "";
      return `<div class="viz-cell mini ${cls}" title="${t} C">${t}</div>`;
    })
    .join("");
}

document.getElementById("btnResortRecords").addEventListener("click", () => {
  regenerateRecords();
  renderRecords();
  document.getElementById("searchRecordResult").textContent = "";
});
document.getElementById("searchRecordForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const key = Number(new FormData(e.target).get("temp"));
  const { index, steps } = binarySearchTraced(records, key);
  renderRecords(index, steps);
  document.getElementById("searchRecordResult").textContent = index !== -1
    ? `${key} found at sorted position ${index} (probed ${steps.length} position${steps.length === 1 ? "" : "s"}).`
    : `${key} not found (probed ${steps.length} position${steps.length === 1 ? "" : "s"}).`;
});

/* ===================================================================
   EXP 8: Hash Table (Dictionary via Circular Array, linear probing)
   =================================================================== */
const H_SIZE = 10;
const EMPTY = "empty", DELETED = "deleted";
let hashArr = new Array(H_SIZE).fill(null).map(() => ({ status: EMPTY, key: null, data: null }));

function hashCodeOf(key) { return ((key % H_SIZE) + H_SIZE) % H_SIZE; }

function hashInsert(key, data) {
  const start = hashCodeOf(key);
  let idx = start;
  for (let probes = 0; probes < H_SIZE; probes++) {
    T.count("probes");
    if (hashArr[idx].status !== "filled") {
      hashArr[idx] = { status: "filled", key, data };
      T.step(`insert ${key}: hash ${start}${idx !== start ? ", collision, probed to " + idx : ", direct hit at " + idx}`);
      return `Station ${key} (${data.toFixed(1)}C) stored at index ${idx}.`;
    }
    idx = (idx + 1) % H_SIZE;
  }
  return "Hash table full. Could not store.";
}
function hashSearch(key) {
  const start = hashCodeOf(key);
  let idx = start;
  for (let probes = 0; probes < H_SIZE; probes++) {
    T.count("probes");
    if (hashArr[idx].status === EMPTY) return null;
    if (hashArr[idx].status === "filled" && hashArr[idx].key === key) return { idx, ...hashArr[idx] };
    idx = (idx + 1) % H_SIZE;
  }
  return null;
}
function hashDelete(key) {
  const start = hashCodeOf(key);
  let idx = start;
  for (let probes = 0; probes < H_SIZE; probes++) {
    T.count("probes");
    if (hashArr[idx].status === EMPTY) return `Station ${key} not found.`;
    if (hashArr[idx].status === "filled" && hashArr[idx].key === key) {
      hashArr[idx] = { status: DELETED, key: null, data: null };
      T.step(`delete ${key} at ${idx}: tombstone left so searches continue past it`);
      return `Removed station ${key} from index ${idx}.`;
    }
    idx = (idx + 1) % H_SIZE;
  }
  return `Station ${key} not found.`;
}

function renderHash() {
  document.getElementById("hashViz").innerHTML = hashArr
    .map((slot, i) => {
      if (slot.status === EMPTY) return `<div class="viz-cell empty">-<span class="sub">${i}</span></div>`;
      if (slot.status === DELETED) return `<div class="viz-cell deleted">x<span class="sub">${i}</span></div>`;
      return `<div class="viz-cell found">${slot.key}<span class="sub">${i} &middot; ${slot.data.toFixed(1)}C</span></div>`;
    })
    .join("");
}

document.getElementById("hashInsertForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const msg = hashInsert(Number(f.get("key")), Number(f.get("data")));
  document.getElementById("hashResult").textContent = msg;
  e.target.reset();
  renderHash();
});
document.getElementById("hashSearchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const key = Number(new FormData(e.target).get("key"));
  const found = hashSearch(key);
  document.getElementById("hashResult").textContent = found
    ? `Station ${found.key}: ${found.data.toFixed(1)}C at index ${found.idx}.`
    : `Station ${key} not found.`;
});
document.getElementById("hashDeleteForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const key = Number(new FormData(e.target).get("key"));
  document.getElementById("hashResult").textContent = hashDelete(key);
  renderHash();
});

/* seed a couple of hash entries including a collision pair */
hashInsert(6, 38.2);
hashInsert(16, 41.0); /* collides with 6 -> probes to next slot */
hashInsert(23, 29.7);

fetch("weather_data.json")
  .then((r) => r.json())
  .then((data) => {
    registry = data.stations.map((s) => ({ id: s.id, name: s.name, temp: s.mean_temp }));
    chennaiSeries = data.chennai_daily;
    renderRegistry();
    regenerateRecords();
    renderRecords();
    const v = records;
    const p = (q) => v[Math.min(v.length - 1, Math.floor(q * v.length))];
    document.getElementById("searchRecordResult").textContent =
      `Chennai 2022, ${v.length} days: min ${v[0]} C, median ${p(0.5)} C, 95th percentile ${p(0.95)} C, max ${v[v.length - 1]} C.`;
  })
  .catch(() => {});

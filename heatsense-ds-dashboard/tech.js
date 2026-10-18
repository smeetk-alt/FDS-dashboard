/* Under-the-hood panels: live operation trace, counters, code walkthrough, advanced topic */

const TECH = {
  registry: {
    walk: [
      "<code>registry</code> is an array of <code>struct Station</code>: one contiguous block, so <code>registry[i]</code> is reached directly in O(1).",
      "Insert writes at <code>registry[count]</code> and increments <code>count</code>. Nothing moves, so it is O(1).",
      "<code>search()</code> starts at index 0 and compares IDs one by one until it finds a match, so it is O(n).",
      "Delete only decrements <code>count</code>. The old slot is overwritten later, so no memory is freed.",
      "<code>search()</code> returns <code>&amp;registry[i]</code>, a pointer into the array, so the caller reads the record without copying it.",
    ],
    advanced: {
      title: "Dynamic arrays",
      text: "A fixed array cannot grow. Dynamic arrays (realloc, or doubling capacity) add items cheaply on average, O(1) amortized, while keeping O(1) index access. Linked lists grow freely but need O(n) to reach index i.",
    },
  },
  alertlog: {
    walk: [
      "<code>struct Node</code> holds data plus a <code>next</code> pointer. The last node points to <code>NULL</code>, and only <code>start</code> is known from outside.",
      "<code>insertBegin</code>: allocate a node, set <code>new-&gt;next = start</code>, then <code>start = new</code>. Four pointer operations, O(1).",
      "<code>insertAfter</code> walks from <code>start</code> until it finds the given node, which is O(n), then relinks two pointers.",
      "<code>deleteBefore</code> keeps two pointers (<code>prev</code>, <code>cur</code>), because a singly linked list cannot step backwards.",
      "After unlinking, <code>free()</code> returns the node's memory to the heap.",
    ],
    advanced: {
      title: "Doubly linked lists",
      text: "A doubly linked node adds a <code>prev</code> pointer. Once a node is known, deleting it is O(1) with no walk back, at the cost of one extra pointer per node. A circular list removes the NULL end and lets you loop forever.",
    },
  },
  stack: {
    walk: [
      "<code>push</code> allocates a node at the top and <code>pop</code> removes the top node and frees it. Both are O(1) because only the head changes.",
      "Precedence: <code>*</code> and <code>/</code> (2) bind tighter than <code>+</code> and <code>-</code> (1), so they wait on the stack longer.",
      "<code>(</code> is pushed and only removed when its matching <code>)</code> arrives. It is never written to the output.",
      "Each operand is written straight to the output; operators wait on the stack until a lower or equal precedence operator arrives.",
      "At the end of input, every operator still on the stack is popped to the output.",
    ],
    advanced: {
      title: "Evaluating postfix",
      text: "Postfix needs no precedence rules to evaluate. Use a second stack: push each number, and on each operator pop two values, compute, and push the result. This is how calculators and compilers evaluate expressions.",
    },
  },
  queue: {
    walk: [
      "Enqueue writes at <code>cq[rear]</code>, then <code>rear = (rear + 1) % SIZE</code>. The modulus wraps the index back to 0.",
      "Dequeue reads at <code>cq[front]</code>, then advances <code>front</code> the same way. Freed slots are reused.",
      "<code>front == rear</code> is true for both an empty and a full queue, so the <code>count</code> variable is what tells them apart.",
      "Full test: <code>count == SIZE</code>. Empty test: <code>count == 0</code>. Both are O(1).",
      "Each operation is O(1); displaying all items walks the array once, O(n).",
    ],
    advanced: {
      title: "Deques and priority queues",
      text: "A deque (double-ended queue) allows insert and remove at both ends, as in Python's collections.deque and Java's ArrayDeque. A priority queue (usually a heap) removes the most urgent item instead of the oldest, which suits urgent heatwave alerts.",
    },
  },
  bst: {
    walk: [
      "Insert compares the new value with each node, going left if smaller and right if larger, then attaches a leaf at the first empty spot.",
      "Search follows the same path, so its cost equals the depth of the node it finds (or the depth where it would sit).",
      "Delete has three cases: leaf (remove it), one child (splice the child up), two children (copy the inorder successor's value, then delete the successor).",
      "Inorder traversal visits left subtree, node, right subtree. For a BST this prints the values in sorted order.",
      "Inserting already sorted values builds a skewed tree of depth n, turning every operation into O(n).",
    ],
    advanced: {
      title: "Self-balancing trees (AVL)",
      text: "An AVL tree tracks each node's height difference between its two subtrees. When that difference exceeds 1, it rotates the nodes to rebalance, keeping the depth at O(log n) even for sorted input. Red-black trees use colour rules to do the same job and back many standard library maps.",
    },
  },
  graph: {
    walk: [
      "Cell <code>adj[i][j] = 1</code> means regions i and j are neighbours. For an undirected graph the matrix is symmetric.",
      "The queue holds regions waiting to be expanded. <code>visited[]</code> stops a region from being queued twice.",
      "A region is marked visited when it is queued, not when it is dequeued. This keeps the queue from growing with duplicates.",
      "The visit order is the order regions leave the queue. Regions are reached in rings of increasing distance from the start.",
      "Each dequeued region scans its whole matrix row, so the total cost is O(V^2) with a matrix.",
    ],
    advanced: {
      title: "Shortest paths (Dijkstra)",
      text: "BFS finds the fewest-edge path only when every edge has equal weight. Dijkstra's algorithm handles weighted edges by always expanding the cheapest unvisited node, using a priority queue. With an adjacency list and a heap it runs in O((V + E) log V).",
    },
  },
  sortsearch: {
    walk: [
      "Partition picks the last element as the pivot and moves every smaller value to its left. Each comparison and swap is counted above.",
      "Recursion sorts the left and right parts around the pivot's final position, so each level of recursion touches each element once.",
      "Binary search probes the middle element. Each probe removes half of the remaining range, which is the reason it needs only about log2(n) probes.",
      "Binary search needs the array to be sorted. On unsorted data it can give a wrong 'not found'.",
      "The probe count shown above is the number of middle elements the search examined.",
    ],
    advanced: {
      title: "Other O(n log n) sorts",
      text: "Merge sort guarantees O(n log n) in the worst case and is stable, meaning equal items keep their order. Heap sort is also O(n log n) and uses O(1) extra memory. Counting sort is faster still for small integer ranges, because it avoids comparisons entirely.",
    },
  },
  hashtable: {
    walk: [
      "<code>hashCode(key) = key % SIZE</code> picks the starting slot. Keys that share a slot collide.",
      "The probe counter above shows how many slots an operation examined. Few probes means the table is working well.",
      "Insert on a collision moves forward (<code>(idx + 1) % SIZE</code>) until it reaches a free or deleted slot.",
      "Delete writes a tombstone, so searches keep probing past the deleted slot to reach keys stored after it.",
      "Every loop is capped at <code>SIZE</code> probes, so a full table stops the loop instead of running forever.",
    ],
    advanced: {
      title: "Separate chaining and double hashing",
      text: "Separate chaining stores a linked list in each slot, so collisions never block insertion. Double hashing uses a second hash function to set the probe step, which avoids the clustering that linear probing causes.",
    },
  },
};

const T = (() => {
  const MAX_LOG = 200;
  const logs = {};
  const counts = {};
  let page = null;

  const ensure = (p) => {
    if (!logs[p]) logs[p] = [];
    if (!counts[p]) counts[p] = {};
  };

  function render(p) {
    const box = document.querySelector(`.tech-box[data-page="${p}"]`);
    if (!box) return;
    const c = counts[p] || {};
    const chips = box.querySelector(".tech-counters");
    chips.textContent = "";
    const entries = Object.entries(c);
    if (!entries.length) {
      const m = document.createElement("span");
      m.className = "muted small";
      m.textContent = "No operations yet. Run one below.";
      chips.appendChild(m);
    } else {
      entries.forEach(([k, v]) => {
        const chip = document.createElement("span");
        chip.className = "tech-chip";
        const b = document.createElement("b");
        b.textContent = v;
        chip.appendChild(b);
        chip.appendChild(document.createTextNode(" " + k));
        chips.appendChild(chip);
      });
    }
    const ol = box.querySelector("ol");
    ol.textContent = "";
    const items = logs[p] || [];
    if (!items.length) {
      const li = document.createElement("li");
      li.className = "muted";
      li.textContent = "Run an operation to see each step here.";
      ol.appendChild(li);
    } else {
      items.forEach((msg) => {
        const li = document.createElement("li");
        li.textContent = msg;
        ol.appendChild(li);
      });
      ol.scrollTop = ol.scrollHeight;
    }
  }

  return {
    setPage(p) {
      page = p;
      ensure(p);
      render(p);
    },
    step(msg) {
      if (!page) return;
      ensure(page);
      logs[page].push(msg);
      if (logs[page].length > MAX_LOG) logs[page].shift();
      render(page);
    },
    count(name, n = 1) {
      if (!page) return;
      ensure(page);
      counts[page][name] = (counts[page][name] || 0) + n;
      render(page);
    },
    clear(p) {
      ensure(p);
      logs[p] = [];
      counts[p] = {};
      render(p);
    },
  };
})();

function buildTechPanel(key, t) {
  const box = document.createElement("div");
  box.className = "tech-box";
  box.dataset.page = key;

  const head = document.createElement("div");
  head.className = "tech-head";
  head.innerHTML = "<h3>Under the hood</h3>";
  const counters = document.createElement("div");
  counters.className = "tech-counters";
  head.appendChild(counters);
  box.appendChild(head);

  const log = document.createElement("div");
  log.className = "tech-log";
  log.innerHTML = `
    <div class="tech-log-head"><span>Live operation trace</span>
      <button type="button" class="btn-link small tech-clear">Clear</button></div>
    <ol></ol>`;
  box.appendChild(log);

  const walk = document.createElement("details");
  walk.className = "tech-details";
  walk.innerHTML = `<summary>Code walkthrough</summary><ul>${t.walk.map((w) => `<li>${w}</li>`).join("")}</ul>`;
  box.appendChild(walk);

  const adv = document.createElement("details");
  adv.className = "tech-details";
  adv.innerHTML = `<summary>Advanced topic: ${t.advanced.title}</summary><p>${t.advanced.text}</p>`;
  box.appendChild(adv);

  box.querySelector(".tech-clear").addEventListener("click", () => T.clear(key));
  return box;
}

document.querySelectorAll("section.page").forEach((section) => {
  const key = section.id.replace(/^page-/, "");
  const t = TECH[key];
  if (!t) return;
  const panel = buildTechPanel(key, t);
  const notes = section.querySelector(".notes-box");
  if (notes) notes.insertAdjacentElement("beforebegin", panel);
  else section.appendChild(panel);
});

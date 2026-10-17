# HeatSense - Data Structures Mini Project

A weather heatwave-detection dashboard (styled after a HeatGuard-style reference app)
demonstrating all 8 Data Structures lab experiments, each live and interactive in
the browser, backed by a real, downloadable C program per experiment.

## Experiments covered

1. **Station Registry** - arrays, array of structures, pointers
2. **Alert Log** - singly linked list (insertBegin / insertAfter / deleteBefore)
3. **Heat Index Stack** - dynamic stack (via linked list) + infix-to-postfix conversion
4. **Dispatch Queue** - static circular queue (counter method)
5. **Station Index** - binary search tree (insert / search / delete / inorder)
6. **Region Network** - graph traversal (BFS) over an adjacency matrix
7. **Historical Records** - quicksort + binary search
8. **Station Hash Table** - dictionary via circular array, linear probing, tombstone delete

## Run

Open `index.html` via a local web server (the C-source viewer and some assets
load over `fetch`, so `file://` won't work for the code panels):

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/heatsense-ds-dashboard/` from the repo root.

## C programs

Real, gradable C implementations (Turbo C/C++ compatible, standard library only)
for all 8 experiments are in `c_programs/`, matching the exact function
signatures from the lab's algorithm sections. The dashboard's JS logic is a
direct behavioural mirror of these C programs, applied to a shared heatwave
weather-monitoring case study instead of the lab's generic examples.

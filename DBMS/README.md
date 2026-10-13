# MediTrack — Hospital DBMS Mini Project

A role-based web dashboard (Administrator / Doctor / Patient) built around a live
in-browser SQLite database (sql.js), covering DBMS lab Experiments 1-9:

1. **ER / EER Model** — entities, relationships, participation constraints
2. **Relational Mapping** — EER to relational schema
3. **Schema (DDL)** — CREATE TABLE with PK/FK/CHECK/NOT NULL/UNIQUE/DEFAULT
4. **Records (DML)** — INSERT/UPDATE/DELETE forms against the live DB
5. **Reports** — aggregate functions, GROUP BY, HAVING, ORDER BY, LIKE
6. **Views & Joins** — CREATE VIEW, INNER/LEFT JOIN, subqueries (IN/EXISTS)
7. **Access Control** — RBAC/DAC/MAC concepts, role-gated navigation
8. **Indexing** — EXPLAIN QUERY PLAN before/after CREATE INDEX
9. **Transactions (ACID)** — BEGIN/COMMIT/ROLLBACK on a ward-transfer

The underlying schema maps the classic Elmasri & Navathe COMPANY database
(DEPARTMENT/EMPLOYEE/PROJECT/WORKS_ON/DEPENDENT) onto a hospital domain
(department/doctor/ward/treats/patient).

## Run

Just open `index.html` via a local web server (sql.js needs to fetch its wasm
file and `schema.sql` over HTTP, so opening the file directly with `file://`
will not work):

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/DBMS/` from the repo root, or
`http://localhost:8000/` if served from inside this folder.

No build step, no backend — everything runs client-side.

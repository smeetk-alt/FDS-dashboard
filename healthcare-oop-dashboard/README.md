# Healthcare OOP Dashboard

A single Tkinter desktop app that reimplements all 8 Object-Oriented Programming
in Python lab experiments using one consistent healthcare case study
(patients, ICU beds, vitals, diagnostics, hospital records).

## Run

```bash
python app.py
```

No external dependencies — uses only the Python standard library
(`tkinter`, `sqlite3`, `threading`, `abc`, `functools`).

## Tabs (one per experiment)

1. **Class & Constructor** — `Patient` class with default/parameterized constructor, instance method, `@staticmethod`, `@classmethod`.
2. **Constructors & Lists** — `ICUBed` objects stored in a list; iterate and filter.
3. **Strings & Inheritance** — string cleaning (`strip`/`replace`/`upper`) + multilevel inheritance `ParentRecord -> ChildRecord -> Child1Record`.
4. **Abstract & Polymorphism** — `DiagnosticTest(ABC)` with `@abstractmethod`, overridden by `BloodTest`, `XRayTest`, `ECGTest`.
5. **Exceptions & Threads** — custom `InvalidVitalError`, `try/except/else/finally`, concurrent vitals monitoring via `threading`.
6. **Collections & Functional** — `dict`/`set`/`tuple` of patient data processed with `map`/`filter`/`reduce`/`lambda`.
7. **GUI Shapes** — Tkinter `Canvas` drawing (`create_line`, `create_rectangle`, `create_oval`, `create_arc`, `create_polygon`, `create_text`) composing a healthcare logo.
8. **SQLite Database** — `patients` table with `INSERT` and a set of `SELECT` queries (`WHERE`, `ORDER BY`, `LIKE`, `BETWEEN`, `GROUP BY`, `AVG`/`MAX`/`MIN`).

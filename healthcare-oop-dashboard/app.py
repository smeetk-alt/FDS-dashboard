"""
Healthcare OOP Dashboard — Tkinter
Reimplements the 8 OOP-in-Python lab experiments (classes/objects/methods/constructors,
constructors+lists, string handling+inheritance, abstract classes+polymorphism,
exception handling+modules+multithreading, collections+functional programming,
Tkinter GUI shape drawing, SQLite database) using a healthcare case study.
Each tab = exactly one experiment, nothing added beyond what the experiment asks for.
"""
import sqlite3
import threading
import time
import tkinter as tk
from abc import ABC, abstractmethod
from functools import reduce
from tkinter import ttk


# ===================================================================
# Experiment 1: Class, Object, Types of methods, Constructor
# ===================================================================
class Patient:
    hospital_name = "City Care Hospital"

    def __init__(self, name="Unknown", age=0, ward="General"):
        self.name = name
        self.age = age
        self.ward = ward

    def info(self):
        return f"{self.name}, age {self.age}, ward: {self.ward}"

    @staticmethod
    def is_adult(age):
        return age >= 18

    @classmethod
    def hospital(cls):
        return cls.hospital_name


# ===================================================================
# Experiment 2: Constructors and Lists
# ===================================================================
class ICUBed:
    def __init__(self, bed_no, patient_name, critical=False):
        self.bed_no = bed_no
        self.patient_name = patient_name
        self.critical = critical

    def __str__(self):
        status = "CRITICAL" if self.critical else "stable"
        return f"Bed {self.bed_no}: {self.patient_name} ({status})"


icu_beds = [
    ICUBed(1, "A. Shah", True),
    ICUBed(2, "R. Nair", False),
    ICUBed(3, "P. Iyer", True),
    ICUBed(4, "S. Rao", False),
]


# ===================================================================
# Experiment 3: String Handling and Inheritance (multilevel)
# ===================================================================
class ParentRecord:
    def __init__(self, patient_id, name, vitals):
        self.patient_id = patient_id
        self.name = name
        self.vitals = vitals  # list of 3 numbers: heart rate, spo2, temp

    def total_vitals(self):
        return sum(self.vitals)


class ChildRecord(ParentRecord):
    def __init__(self, patient_id, name, vitals, dosage):
        ParentRecord.__init__(self, patient_id, name, vitals)
        self.dosage = dosage


class Child1Record(ChildRecord):
    def __init__(self, patient_id, name, vitals, dosage):
        ChildRecord.__init__(self, patient_id, name, vitals, dosage)

    def total(self):
        return self.total_vitals() + self.dosage

    def average(self):
        return self.total() / 4


def clean_patient_name(raw_name):
    name = raw_name.strip()
    name = name.replace("_", " ")
    name = name.upper()
    return name


# ===================================================================
# Experiment 4: Abstract Classes and Polymorphism
# ===================================================================
class DiagnosticTest(ABC):
    @abstractmethod
    def analyze(self):
        pass


class BloodTest(DiagnosticTest):
    def __init__(self, hemoglobin):
        self.hemoglobin = hemoglobin

    def analyze(self):
        if self.hemoglobin < 12:
            return f"Blood Test: Hemoglobin {self.hemoglobin} g/dL -> Low (anemia risk)"
        return f"Blood Test: Hemoglobin {self.hemoglobin} g/dL -> Normal"


class XRayTest(DiagnosticTest):
    def __init__(self, fracture_detected):
        self.fracture_detected = fracture_detected

    def analyze(self):
        if self.fracture_detected:
            return "X-Ray Test: Fracture detected"
        return "X-Ray Test: No fracture detected"


class ECGTest(DiagnosticTest):
    def __init__(self, bpm):
        self.bpm = bpm

    def analyze(self):
        if self.bpm < 60 or self.bpm > 100:
            return f"ECG Test: {self.bpm} bpm -> Abnormal rhythm"
        return f"ECG Test: {self.bpm} bpm -> Normal rhythm"


# ===================================================================
# Experiment 5: Exception Handling, Modules, Multithreading
# ===================================================================
class InvalidVitalError(Exception):
    pass


def read_vital(raw_value):
    try:
        value = float(raw_value)
        if value <= 0:
            raise InvalidVitalError(f"Invalid vital reading: {raw_value}")
    except ValueError:
        raise InvalidVitalError(f"Non-numeric vital reading: {raw_value}")
    else:
        return value
    finally:
        pass


def monitor_patient(patient_name, readings, log_list):
    for r in readings:
        try:
            value = read_vital(r)
            log_list.append(f"[{patient_name}] reading {value} OK")
        except InvalidVitalError as e:
            log_list.append(f"[{patient_name}] ERROR: {e}")
        time.sleep(0.2)


# ===================================================================
# Experiment 6: Collections and Functional Programming
# ===================================================================
patient_vitals = {
    "A. Shah": 98,
    "R. Nair": 72,
    "P. Iyer": 110,
    "S. Rao": 65,
}

ward_set = {"General", "ICU", "Pediatrics", "General"}
discharge_queue = ("A. Shah", "R. Nair", "P. Iyer")


def classify_vitals(vitals_dict):
    critical = dict(filter(lambda item: item[1] > 100 or item[1] < 60, vitals_dict.items()))
    normal = dict(filter(lambda item: 60 <= item[1] <= 100, vitals_dict.items()))
    bumped = dict(map(lambda item: (item[0], item[1] + 1), vitals_dict.items()))
    total = reduce(lambda acc, v: acc + v, vitals_dict.values(), 0)
    return critical, normal, bumped, total


# ===================================================================
# Experiment 8: Develop a Database-Driven System Using SQLite
# Activity: two tables, >=3 columns each, 50 rows inserted into both,
# at least 7 SELECT-type commands executed on them.
# ===================================================================
DB_PATH = "healthcare.db"

FIRST_NAMES = ["Aman", "Priya", "Rahul", "Sneha", "Arjun", "Neha", "Rohan", "Anjali",
               "Vikram", "Pooja", "Sakshi", "Gaurav", "Pranav", "Sonali", "Kiran",
               "Divya", "Manoj", "Riya", "Sahil", "Tanvi"]
WARDS = ["ICU", "General", "Pediatrics", "Orthopedics", "Cardiology"]
DOCTORS = ["Dr. Mehta", "Dr. Kulkarni", "Dr. Fernandes", "Dr. Bhatt", "Dr. Joshi"]
DEPARTMENTS = ["Cardiology", "Orthopedics", "Pediatrics", "Neurology", "General Medicine"]


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Table 1: patients (id, name, age, ward, heart_rate)
    cur.execute("""CREATE TABLE IF NOT EXISTS patients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    age INTEGER,
                    ward TEXT,
                    heart_rate INTEGER
                 )""")
    cur.execute("SELECT COUNT(*) FROM patients")
    if cur.fetchone()[0] == 0:
        patients = [
            (f"{FIRST_NAMES[i % len(FIRST_NAMES)]} P{i+1}",
             20 + (i * 3) % 60,
             WARDS[i % len(WARDS)],
             60 + (i * 7) % 60)
            for i in range(50)
        ]
        cur.executemany("INSERT INTO patients (name, age, ward, heart_rate) VALUES (?,?,?,?)", patients)

    # Table 2: appointments (id, patient_name, doctor, department)
    cur.execute("""CREATE TABLE IF NOT EXISTS appointments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_name TEXT NOT NULL,
                    doctor TEXT,
                    department TEXT
                 )""")
    cur.execute("SELECT COUNT(*) FROM appointments")
    if cur.fetchone()[0] == 0:
        appointments = [
            (f"{FIRST_NAMES[i % len(FIRST_NAMES)]} P{i+1}",
             DOCTORS[i % len(DOCTORS)],
             DEPARTMENTS[i % len(DEPARTMENTS)])
            for i in range(50)
        ]
        cur.executemany("INSERT INTO appointments (patient_name, doctor, department) VALUES (?,?,?)", appointments)

    conn.commit()
    conn.close()


def run_query(sql):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    try:
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description] if cur.description else []
    except sqlite3.Error:
        rows, cols = [], []
    conn.close()
    return cols, rows


# ===================================================================
# Tkinter UI
# ===================================================================
TEAL = "#0f766e"
TEAL_DARK = "#0b5a54"
CORAL = "#ef4444"
GOLD = "#f59e0b"
BG = "#f0fdfa"
CARD = "#ffffff"
INK = "#134e4a"


def draw_cross_logo(canvas, cx, cy, r):
    """Draws a healthcare cross-in-circle logo centered at (cx, cy)."""
    canvas.create_oval(cx - r, cy - r, cx + r, cy + r, fill="#ffffff", outline=CORAL, width=3)
    arm = r * 0.68
    thick = r * 0.28
    canvas.create_rectangle(cx - thick, cy - arm, cx + thick, cy + arm, fill=CORAL, outline="")
    canvas.create_rectangle(cx - arm, cy - thick, cx + arm, cy + thick, fill=CORAL, outline="")


class HealthcareDashboard:
    def __init__(self, root):
        self.root = root
        self.root.title("Healthcare OOP Dashboard")
        self.root.geometry("980x720")
        self.root.configure(bg=BG)

        self._init_style()

        header = tk.Frame(root, bg=TEAL, height=90)
        header.pack(fill="x", side="top")

        logo_canvas = tk.Canvas(header, width=70, height=70, bg=TEAL, highlightthickness=0)
        logo_canvas.pack(side="left", padx=18, pady=10)
        draw_cross_logo(logo_canvas, 35, 35, 30)

        title_box = tk.Frame(header, bg=TEAL)
        title_box.pack(side="left", pady=10)
        tk.Label(title_box, text="Healthcare OOP Dashboard", bg=TEAL, fg="white",
                 font=("Segoe UI", 18, "bold")).pack(anchor="w")
        tk.Label(title_box, text="City Care Hospital · Object-Oriented Python Case Studies", bg=TEAL,
                 fg="#ccfbf1", font=("Segoe UI", 10)).pack(anchor="w")

        notebook = ttk.Notebook(root, style="Health.TNotebook")
        notebook.pack(fill="both", expand=True, padx=12, pady=12)

        self.build_exp1(notebook)
        self.build_exp2(notebook)
        self.build_exp3(notebook)
        self.build_exp4(notebook)
        self.build_exp5(notebook)
        self.build_exp6(notebook)
        self.build_exp7(notebook)
        self.build_exp8(notebook)

    def _init_style(self):
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass

        style.configure("Health.TNotebook", background=BG, borderwidth=0)
        style.configure("Health.TNotebook.Tab", font=("Segoe UI", 10, "bold"),
                         padding=(14, 8), background="#ccfbf1", foreground=TEAL_DARK)
        style.map("Health.TNotebook.Tab",
                  background=[("selected", TEAL)],
                  foreground=[("selected", "white")])

        style.configure("Card.TFrame", background=CARD)
        style.configure("Health.TLabel", background=CARD, foreground=INK, font=("Segoe UI", 10))
        style.configure("Heading.TLabel", background=CARD, foreground=TEAL_DARK, font=("Segoe UI", 12, "bold"))
        style.configure("Health.TButton", font=("Segoe UI", 10, "bold"), padding=8,
                         background=TEAL, foreground="white")
        style.map("Health.TButton", background=[("active", TEAL_DARK)])
        style.configure("Health.TEntry", padding=4)
        style.configure("Health.TCombobox", padding=4)

    def _tab(self, notebook, title, heading="", use=""):
        outer = tk.Frame(notebook, bg=BG)
        notebook.add(outer, text=title)
        card = ttk.Frame(outer, style="Card.TFrame", padding=18)
        card.pack(fill="both", expand=True, padx=14, pady=14)
        if heading:
            ttk.Label(card, text=heading, style="Heading.TLabel").pack(anchor="w", pady=(0, 6))
        if use:
            ttk.Label(card, text=use, style="Health.TLabel", wraplength=860, justify="left").pack(anchor="w", pady=(0, 14))
        body = ttk.Frame(card, style="Card.TFrame")
        body.pack(fill="both", expand=True)
        return body

    def _output_box(self, parent, height=12, width=78):
        box = tk.Text(parent, height=height, width=width, bg="#f8fffe", fg=INK,
                       font=("Consolas", 10), relief="flat", borderwidth=1,
                       highlightbackground="#99f6e4", highlightthickness=1)
        return box

    # ---- Experiment 1 ----
    def build_exp1(self, notebook):
        frame = self._tab(notebook, "1. Class & Constructor",
                          "Class, Object, Types of Methods and Constructor",
                          "Patient records: each Patient object holds a name, age and ward. The constructor sets these when a patient is admitted, is_adult() (a static method) checks the age, and hospital() (a class method) returns the hospital name.")

        ttk.Label(frame, text="Patient name:", style="Health.TLabel").grid(row=1, column=0, sticky="w", pady=4)
        name_entry = ttk.Entry(frame, style="Health.TEntry")
        name_entry.insert(0, "J. Mehta")
        name_entry.grid(row=1, column=1, pady=4)

        ttk.Label(frame, text="Age:", style="Health.TLabel").grid(row=2, column=0, sticky="w", pady=4)
        age_entry = ttk.Entry(frame, style="Health.TEntry")
        age_entry.insert(0, "25")
        age_entry.grid(row=2, column=1, pady=4)

        ttk.Label(frame, text="Ward:", style="Health.TLabel").grid(row=3, column=0, sticky="w", pady=4)
        ward_entry = ttk.Entry(frame, style="Health.TEntry")
        ward_entry.insert(0, "General")
        ward_entry.grid(row=3, column=1, pady=4)

        output = self._output_box(frame, height=8, width=60)
        output.grid(row=5, column=0, columnspan=2, pady=10)

        def run():
            p = Patient(name_entry.get(), int(age_entry.get()), ward_entry.get())
            output.delete("1.0", tk.END)
            output.insert(tk.END, f"info(): {p.info()}\n")
            output.insert(tk.END, f"is_adult() [static method]: {Patient.is_adult(p.age)}\n")
            output.insert(tk.END, f"hospital() [class method]: {Patient.hospital()}\n")

        ttk.Button(frame, text="Create Patient Object", style="Health.TButton",
                   command=run).grid(row=4, column=0, columnspan=2, pady=6)

    # ---- Experiment 2 ----
    def build_exp2(self, notebook):
        frame = self._tab(notebook, "2. Constructors & Lists",
                          "Constructors and Lists",
                          "ICU beds: each bed is an ICUBed object created with a constructor and kept in a list. The full list shows every bed, and the filter shows only the critical beds.")

        listbox = tk.Listbox(frame, width=55, height=10, bg="#f8fffe", fg=INK,
                              font=("Consolas", 10), selectbackground=TEAL,
                              highlightbackground="#99f6e4", highlightthickness=1, relief="flat")
        listbox.pack(pady=10)

        def colorize():
            for i, bed in enumerate(icu_beds):
                listbox.itemconfig(i, fg=CORAL if bed.critical else "#15803d")

        def show_beds():
            listbox.delete(0, tk.END)
            for bed in icu_beds:
                listbox.insert(tk.END, str(bed))
            colorize()

        def show_critical():
            listbox.delete(0, tk.END)
            for bed in icu_beds:
                if bed.critical:
                    listbox.insert(tk.END, str(bed))
            colorize()

        btns = ttk.Frame(frame, style="Card.TFrame")
        btns.pack()
        ttk.Button(btns, text="Show All Beds (list of objects)", style="Health.TButton",
                   command=show_beds).pack(side="left", padx=5)
        ttk.Button(btns, text="Filter Critical Beds", style="Health.TButton",
                   command=show_critical).pack(side="left", padx=5)

    # ---- Experiment 3 ----
    def build_exp3(self, notebook):
        frame = self._tab(notebook, "3. Strings & Inheritance",
                          "String Handling and Inheritance",
                          "Patient names and records: raw names are cleaned with string methods (strip, replace, upper). A child record inherits from a parent record and adds its own fields, which is multilevel inheritance for vitals and dosage.")

        ttk.Label(frame, text="Raw patient name (try: '  ravi_shah  '):",
                  style="Health.TLabel").pack(anchor="w")
        raw_entry = ttk.Entry(frame, width=40, style="Health.TEntry")
        raw_entry.insert(0, "  ravi_shah  ")
        raw_entry.pack(anchor="w", pady=(4, 10))

        output = self._output_box(frame, height=10, width=70)
        output.pack()

        def run():
            output.delete("1.0", tk.END)
            cleaned = clean_patient_name(raw_entry.get())
            output.insert(tk.END, f"String handling -> cleaned name: '{cleaned}'\n\n")

            rec = Child1Record("P100", cleaned, [98, 97, 36], dosage=5)
            output.insert(tk.END, "Multilevel inheritance: ParentRecord -> ChildRecord -> Child1Record\n")
            output.insert(tk.END, f"Vitals (HR, SpO2, Temp): {rec.vitals}, dosage: {rec.dosage}\n")
            output.insert(tk.END, f"total() (inherited+own): {rec.total()}\n")
            output.insert(tk.END, f"average(): {rec.average():.2f}\n")

        ttk.Button(frame, text="Run", style="Health.TButton", command=run).pack(pady=5)

    # ---- Experiment 4 ----
    def build_exp4(self, notebook):
        frame = self._tab(notebook, "4. Abstract & Polymorphism",
                          "Abstract Classes and Polymorphism",
                          "Diagnostic tests: blood, X-ray and ECG tests all share one abstract DiagnosticTest base class. Each test overrides analyze(), so one call gives the right result for each type of test.")

        output = self._output_box(frame, height=12, width=70)
        output.pack(pady=10)

        def run():
            tests = [BloodTest(hemoglobin=10.5), XRayTest(fracture_detected=True), ECGTest(bpm=105)]
            output.delete("1.0", tk.END)
            output.insert(tk.END, "DiagnosticTest(ABC).analyze() overridden polymorphically:\n\n")
            for t in tests:
                output.insert(tk.END, t.analyze() + "\n")

        ttk.Button(frame, text="Run Diagnostics", style="Health.TButton", command=run).pack()

    # ---- Experiment 5 ----
    def build_exp5(self, notebook):
        frame = self._tab(notebook, "5. Exceptions & Threads",
                          "Exception Handling, Modules and Multithreading",
                          "Vitals monitoring: each reading is checked by read_vital(). A bad reading raises InvalidVitalError, and several patients are monitored at the same time using threads.")

        output = self._output_box(frame, height=15, width=80)
        output.pack(pady=10)

        def run():
            output.delete("1.0", tk.END)
            log = []
            patients_readings = {
                "A. Shah": ["98", "-5", "abc"],
                "R. Nair": ["72", "75", "70"],
            }
            threads = []
            for name, readings in patients_readings.items():
                th = threading.Thread(target=monitor_patient, args=(name, readings, log))
                threads.append(th)
                th.start()
            for th in threads:
                th.join()
            output.tag_config("ok", foreground="#15803d")
            output.tag_config("err", foreground=CORAL)
            for line in log:
                tag = "err" if "ERROR" in line else "ok"
                output.insert(tk.END, line + "\n", tag)

        ttk.Button(frame, text="Start Multithreaded Monitoring", style="Health.TButton", command=run).pack()

    # ---- Experiment 6 ----
    def build_exp6(self, notebook):
        frame = self._tab(notebook, "6. Collections & Functional",
                          "Collections and Functional Programming",
                          "Ward and vitals data: patient vitals are kept in a dict, unique wards in a set, and the discharge queue in a tuple. filter() finds critical patients, map() adjusts the readings, and reduce() totals the heart rates.")

        output = self._output_box(frame, height=15, width=80)
        output.pack(pady=10)

        def run():
            output.delete("1.0", tk.END)
            output.insert(tk.END, f"dict (heart rates): {patient_vitals}\n")
            output.insert(tk.END, f"set (wards, duplicates removed): {ward_set}\n")
            output.insert(tk.END, f"tuple (discharge queue): {discharge_queue}\n\n")

            critical, normal, bumped, total = classify_vitals(patient_vitals)
            output.insert(tk.END, f"filter() -> critical patients: {critical}\n")
            output.insert(tk.END, f"filter() -> normal patients: {normal}\n")
            output.insert(tk.END, f"map()+lambda -> bumped readings: {bumped}\n")
            output.insert(tk.END, f"reduce()+lambda -> total heart rate: {total}\n")

        ttk.Button(frame, text="Run", style="Health.TButton", command=run).pack()

    # ---- Experiment 7: Tkinter GUI shape drawing ----
    def build_exp7(self, notebook):
        frame = self._tab(notebook, "7. GUI Shapes",
                          "GUI Applications Development to Draw Geometric Shapes",
                          "Hospital logo: the Canvas draws line, rectangle, oval, arc, polygon and text shapes to build the healthcare logo shown at the top of this dashboard.")

        canvas = tk.Canvas(frame, width=420, height=320, bg="white",
                            highlightbackground="#99f6e4", highlightthickness=2)
        canvas.pack(pady=10)

        def draw_logo():
            canvas.delete("all")
            # healthcare cross-in-circle logo, colourful, built from Canvas primitives
            canvas.create_rectangle(0, 0, 420, 320, fill="#ecfeff", outline="")
            canvas.create_oval(160, 40, 260, 140, outline=CORAL, width=3, fill="white")
            canvas.create_rectangle(190, 60, 230, 120, fill=CORAL, outline="")
            canvas.create_rectangle(170, 80, 250, 100, fill=CORAL, outline="")
            canvas.create_line(40, 260, 380, 260, width=3, fill=TEAL)
            canvas.create_arc(180, 170, 240, 230, start=0, extent=180, style="chord", fill="#38bdf8", outline="")
            canvas.create_polygon(200, 240, 220, 240, 210, 205, fill="#22c55e", outline="")
            canvas.create_oval(70, 150, 110, 190, fill=GOLD, outline="")
            canvas.create_oval(310, 150, 350, 190, fill=GOLD, outline="")
            canvas.create_text(210, 290, text="Healthcare Logo", font=("Segoe UI", 13, "bold"), fill=TEAL_DARK)

        ttk.Button(frame, text="Draw Healthcare Logo", style="Health.TButton", command=draw_logo).pack(pady=4)

    # ---- Experiment 8 ----
    def build_exp8(self, notebook):
        frame = self._tab(notebook, "8. SQLite Database",
                          "Develop a Database-Driven System Using SQLite",
                          "Patient and appointment records: patients and appointments are stored in SQLite tables. SELECT queries with WHERE, ORDER BY, LIKE, BETWEEN, GROUP BY and aggregate functions answer staff questions.")

        init_db()

        queries = {
            "All patients": "SELECT * FROM patients",
            "WHERE ward='ICU'": "SELECT * FROM patients WHERE ward='ICU'",
            "ORDER BY age": "SELECT name, age FROM patients ORDER BY age",
            "LIKE '%Shah%'": "SELECT * FROM patients WHERE name LIKE '%Shah%'",
            "BETWEEN 30 AND 55": "SELECT * FROM patients WHERE age BETWEEN 30 AND 55",
            "GROUP BY ward": "SELECT ward, COUNT(*) FROM patients GROUP BY ward",
            "AVG(heart_rate)": "SELECT AVG(heart_rate) FROM patients",
            "MAX/MIN age": "SELECT MAX(age), MIN(age) FROM patients",
        }

        combo = ttk.Combobox(frame, values=list(queries.keys()), state="readonly", width=30,
                              style="Health.TCombobox")
        combo.current(0)
        combo.pack(pady=5)

        output = self._output_box(frame, height=12, width=80)
        output.pack(pady=10)

        def run():
            sql = queries[combo.get()]
            cols, rows = run_query(sql)
            output.delete("1.0", tk.END)
            output.insert(tk.END, f"SQL: {sql}\n\n")
            output.insert(tk.END, " | ".join(cols) + "\n")
            output.insert(tk.END, "-" * 40 + "\n")
            for row in rows:
                output.insert(tk.END, " | ".join(str(v) for v in row) + "\n")

        ttk.Button(frame, text="Run Query", style="Health.TButton", command=run).pack()


if __name__ == "__main__":
    root = tk.Tk()
    app = HealthcareDashboard(root)
    root.mainloop()

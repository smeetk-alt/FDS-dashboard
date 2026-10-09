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
# Experiment 8: SQLite Database
# ===================================================================
DB_PATH = "healthcare.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS patients (
                    id INTEGER PRIMARY KEY,
                    name TEXT,
                    age INTEGER,
                    ward TEXT,
                    heart_rate INTEGER
                 )""")
    cur.execute("SELECT COUNT(*) FROM patients")
    if cur.fetchone()[0] == 0:
        sample = [
            (1, "A. Shah", 45, "ICU", 98),
            (2, "R. Nair", 29, "General", 72),
            (3, "P. Iyer", 61, "ICU", 110),
            (4, "S. Rao", 34, "Pediatrics", 65),
            (5, "M. Desai", 50, "General", 80),
        ]
        cur.executemany("INSERT INTO patients VALUES (?,?,?,?,?)", sample)
    conn.commit()
    conn.close()


def run_query(sql):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    conn.close()
    return cols, rows


# ===================================================================
# Tkinter UI
# ===================================================================
class HealthcareDashboard:
    def __init__(self, root):
        self.root = root
        self.root.title("Healthcare OOP Dashboard")
        self.root.geometry("900x650")

        notebook = ttk.Notebook(root)
        notebook.pack(fill="both", expand=True)

        self.build_exp1(notebook)
        self.build_exp2(notebook)
        self.build_exp3(notebook)
        self.build_exp4(notebook)
        self.build_exp5(notebook)
        self.build_exp6(notebook)
        self.build_exp7(notebook)
        self.build_exp8(notebook)

    # ---- Experiment 1 ----
    def build_exp1(self, notebook):
        frame = ttk.Frame(notebook, padding=15)
        notebook.add(frame, text="1. Class & Constructor")

        ttk.Label(frame, text="Patient name:").grid(row=0, column=0, sticky="w")
        name_entry = ttk.Entry(frame)
        name_entry.insert(0, "J. Mehta")
        name_entry.grid(row=0, column=1)

        ttk.Label(frame, text="Age:").grid(row=1, column=0, sticky="w")
        age_entry = ttk.Entry(frame)
        age_entry.insert(0, "25")
        age_entry.grid(row=1, column=1)

        ttk.Label(frame, text="Ward:").grid(row=2, column=0, sticky="w")
        ward_entry = ttk.Entry(frame)
        ward_entry.insert(0, "General")
        ward_entry.grid(row=2, column=1)

        output = tk.Text(frame, height=8, width=60)
        output.grid(row=4, column=0, columnspan=2, pady=10)

        def run():
            p = Patient(name_entry.get(), int(age_entry.get()), ward_entry.get())
            output.delete("1.0", tk.END)
            output.insert(tk.END, f"info(): {p.info()}\n")
            output.insert(tk.END, f"is_adult() [static method]: {Patient.is_adult(p.age)}\n")
            output.insert(tk.END, f"hospital() [class method]: {Patient.hospital()}\n")

        ttk.Button(frame, text="Create Patient Object", command=run).grid(row=3, column=0, columnspan=2)

    # ---- Experiment 2 ----
    def build_exp2(self, notebook):
        frame = ttk.Frame(notebook, padding=15)
        notebook.add(frame, text="2. Constructors & Lists")

        listbox = tk.Listbox(frame, width=50, height=10)
        listbox.pack(pady=10)

        def show_beds():
            listbox.delete(0, tk.END)
            for bed in icu_beds:
                listbox.insert(tk.END, str(bed))

        def show_critical():
            listbox.delete(0, tk.END)
            for bed in icu_beds:
                if bed.critical:
                    listbox.insert(tk.END, str(bed))

        btns = ttk.Frame(frame)
        btns.pack()
        ttk.Button(btns, text="Show All Beds (list of objects)", command=show_beds).pack(side="left", padx=5)
        ttk.Button(btns, text="Filter Critical Beds", command=show_critical).pack(side="left", padx=5)

    # ---- Experiment 3 ----
    def build_exp3(self, notebook):
        frame = ttk.Frame(notebook, padding=15)
        notebook.add(frame, text="3. Strings & Inheritance")

        ttk.Label(frame, text="Raw patient name (try: '  ravi_shah  '):").pack(anchor="w")
        raw_entry = ttk.Entry(frame, width=40)
        raw_entry.insert(0, "  ravi_shah  ")
        raw_entry.pack(anchor="w", pady=(0, 10))

        output = tk.Text(frame, height=10, width=70)
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

        ttk.Button(frame, text="Run", command=run).pack(pady=5)

    # ---- Experiment 4 ----
    def build_exp4(self, notebook):
        frame = ttk.Frame(notebook, padding=15)
        notebook.add(frame, text="4. Abstract & Polymorphism")

        output = tk.Text(frame, height=12, width=70)
        output.pack(pady=10)

        def run():
            tests = [BloodTest(hemoglobin=10.5), XRayTest(fracture_detected=True), ECGTest(bpm=105)]
            output.delete("1.0", tk.END)
            output.insert(tk.END, "DiagnosticTest(ABC).analyze() overridden polymorphically:\n\n")
            for t in tests:
                output.insert(tk.END, t.analyze() + "\n")

        ttk.Button(frame, text="Run Diagnostics", command=run).pack()

    # ---- Experiment 5 ----
    def build_exp5(self, notebook):
        frame = ttk.Frame(notebook, padding=15)
        notebook.add(frame, text="5. Exceptions & Threads")

        output = tk.Text(frame, height=15, width=80)
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
            for line in log:
                output.insert(tk.END, line + "\n")

        ttk.Button(frame, text="Start Multithreaded Monitoring", command=run).pack()

    # ---- Experiment 6 ----
    def build_exp6(self, notebook):
        frame = ttk.Frame(notebook, padding=15)
        notebook.add(frame, text="6. Collections & Functional")

        output = tk.Text(frame, height=15, width=80)
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

        ttk.Button(frame, text="Run", command=run).pack()

    # ---- Experiment 7: Tkinter GUI shape drawing ----
    def build_exp7(self, notebook):
        frame = ttk.Frame(notebook, padding=15)
        notebook.add(frame, text="7. GUI Shapes")

        canvas = tk.Canvas(frame, width=400, height=300, bg="white")
        canvas.pack(pady=10)

        def draw_logo():
            canvas.delete("all")
            # healthcare cross logo built from Canvas primitives
            canvas.create_oval(150, 50, 250, 150, outline="red", width=2)
            canvas.create_rectangle(180, 70, 220, 130, fill="red")
            canvas.create_rectangle(160, 90, 240, 110, fill="red")
            canvas.create_line(50, 250, 350, 250, width=2)
            canvas.create_arc(170, 160, 230, 220, start=0, extent=180, style="chord", fill="lightblue")
            canvas.create_polygon(190, 230, 210, 230, 200, 200, fill="green")
            canvas.create_text(200, 270, text="Healthcare Logo", font=("Arial", 12))

        ttk.Button(frame, text="Draw Healthcare Logo (line/rect/oval/arc/polygon/text)", command=draw_logo).pack()

    # ---- Experiment 8 ----
    def build_exp8(self, notebook):
        frame = ttk.Frame(notebook, padding=15)
        notebook.add(frame, text="8. SQLite Database")

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

        combo = ttk.Combobox(frame, values=list(queries.keys()), state="readonly", width=30)
        combo.current(0)
        combo.pack(pady=5)

        output = tk.Text(frame, height=12, width=80)
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

        ttk.Button(frame, text="Run Query", command=run).pack()


if __name__ == "__main__":
    root = tk.Tk()
    app = HealthcareDashboard(root)
    root.mainloop()

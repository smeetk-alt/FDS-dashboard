-- MediTrack Hospital DB
-- Relational mapping of the classic COMPANY ER model (Elmasri & Navathe)
-- onto a hospital domain, as used across Experiments 1-9:
--   DEPARTMENT -> DEPARTMENT   EMPLOYEE -> DOCTOR   PROJECT -> WARD
--   WORKS_ON   -> TREATS       DEPENDENT -> PATIENT

CREATE TABLE department (
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
);

-- ===================== seed data =====================

INSERT INTO department (dno, dname, location) VALUES
  (101, 'Cardiology', 'Block A'),
  (102, 'Orthopedics', 'Block B'),
  (103, 'Pediatrics', 'Block C'),
  (104, 'Neurology', 'Block D');

INSERT INTO doctor (doc_id, fname, lname, specialization, salary, dno) VALUES
  (1, 'Asha', 'Mehta', 'Cardiologist', 180000, 101),
  (2, 'Rohan', 'Nair', 'Cardiac Surgeon', 220000, 101),
  (3, 'Priya', 'Iyer', 'Orthopedic Surgeon', 190000, 102),
  (4, 'Kabir', 'Rao', 'Orthopedist', 150000, 102),
  (5, 'Sneha', 'Desai', 'Pediatrician', 140000, 103),
  (6, 'Arjun', 'Shah', 'Pediatric Surgeon', 160000, 103),
  (7, 'Neha', 'Joshi', 'Neurologist', 210000, 104),
  (8, 'Vikram', 'Kulkarni', 'Neurosurgeon', 250000, 104);

INSERT INTO ward (ward_no, ward_name, capacity, dno) VALUES
  (1, 'Cardiac ICU', 8, 101),
  (2, 'Ortho Ward', 15, 102),
  (3, 'Pediatric Ward', 12, 103),
  (4, 'Neuro ICU', 6, 104),
  (5, 'General Ward', 20, 101);

INSERT INTO patient (patient_id, name, age, disease, status, doc_id) VALUES
  (1, 'A. Shah', 45, 'Arrhythmia', 'Critical', 1),
  (2, 'R. Nair', 29, 'Fracture', 'Stable', 3),
  (3, 'P. Iyer', 61, 'Heart Block', 'Critical', 2),
  (4, 'S. Rao', 34, 'Migraine', 'Stable', 7),
  (5, 'M. Desai', 50, 'Hypertension', 'Stable', 1),
  (6, 'K. Verma', 8, 'Fever', 'Stable', 5),
  (7, 'T. Pillai', 72, 'Stroke', 'Critical', 8),
  (8, 'G. Kapoor', 39, 'ACL Tear', 'Stable', 4),
  (9, 'J. Mathew', 55, 'Epilepsy', 'Stable', 7),
  (10, 'D. Bose', 6, 'Asthma', 'Stable', 6),
  (11, 'L. Fernandes', 67, 'Angina', 'Critical', 2),
  (12, 'N. Bhatt', 41, 'Spine Injury', 'Stable', 3),
  (13, 'C. Menon', 19, 'Concussion', 'Stable', 8),
  (14, 'O. Khan', 58, 'Bypass Recovery', 'Critical', 1),
  (15, 'W. Dsouza', 12, 'Fracture', 'Stable', 4);

INSERT INTO treats (doc_id, patient_id, hours_spent) VALUES
  (1, 1, 12), (1, 5, 4), (1, 14, 20),
  (2, 3, 18), (2, 11, 15),
  (3, 2, 6), (3, 12, 9),
  (4, 8, 5), (4, 15, 7),
  (5, 6, 3),
  (6, 10, 4),
  (7, 4, 2), (7, 9, 6),
  (8, 7, 25), (8, 13, 3);

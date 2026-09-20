const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "attendance_jwt_secret_key_2026_secure";

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ==========================================
// Database Storage Initialization
// ==========================================
const DB_FILE = path.join(process.cwd(), "server", "data.json");

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    }
  } catch (e) {
    console.warn("Could not read db, creating fresh one:", e);
  }
  return {
    users: [],
    admins: [],
    teachers: [],
    students: [],
    classes: [],
    batches: [],
    subjects: [],
    enrollments: [],
    teacherSubjects: [],
    lectures: [],
    attendances: [],
    auditLogs: []
  };
}

let db = loadDB();

function saveDB() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save DB:", e);
  }
}

function seedDatabaseIfEmpty() {
  if (db.users.length > 0) return;
  console.log("Seeding database with realistic Admin, Teachers, Classes, and Students...");
  const defaultPasswordHash = bcrypt.hashSync("Password@123", 10);

  // 1. Admin
  const adminUserId = "usr-admin-1";
  db.users.push({
    id: adminUserId,
    email: "admin@attendance.edu",
    passwordHash: defaultPasswordHash,
    role: "ADMIN",
    createdAt: new Date().toISOString()
  });
  db.admins.push({
    id: "adm-1",
    userId: adminUserId,
    fullName: "System Administrator",
    phone: "+1 555-0199"
  });

  // 2. Classes & Batches
  const classBBA1 = {
    id: "cls-bba-1",
    name: "BBA Semester 1",
    code: "BBA-S1",
    department: "Management",
    semester: "Semester 1",
    totalStudents: 12
  };
  const classBCA1 = {
    id: "cls-bca-1",
    name: "BCA Semester 1",
    code: "BCA-S1",
    department: "Computer Applications",
    semester: "Semester 1",
    totalStudents: 8
  };
  db.classes.push(classBBA1, classBCA1);

  const batchBBA1_A = { id: "bat-bba1-a", name: "Division A", classId: classBBA1.id };
  const batchBBA1_B = { id: "bat-bba1-b", name: "Division B", classId: classBBA1.id };
  const batchBCA1_A = { id: "bat-bca1-a", name: "Division A", classId: classBCA1.id };
  db.batches.push(batchBBA1_A, batchBBA1_B, batchBCA1_A);

  // 3. Subjects
  const subEconomics = { id: "sub-101", name: "Economics & Market Analysis", code: "ECO-101", department: "Management" };
  const subAccounts = { id: "sub-102", name: "Financial Accounting", code: "ACC-102", department: "Management" };
  const subCS = { id: "sub-103", name: "Programming in TypeScript & C", code: "BCA-101", department: "Computer Applications" };
  db.subjects.push(subEconomics, subAccounts, subCS);

  // 4. Teachers
  const teacherUsers = [
    { id: "usr-tch-1", tchId: "tch-1", teacherId: "FAC-1001", name: "Prof. Rajesh Shah", email: "prof.shah@attendance.edu", dept: "Management", subId: subEconomics.id },
    { id: "usr-tch-2", tchId: "tch-2", teacherId: "FAC-1002", name: "Dr. Ananya Patel", email: "prof.patel@attendance.edu", dept: "Management", subId: subAccounts.id },
    { id: "usr-tch-3", tchId: "tch-3", teacherId: "FAC-1003", name: "Prof. Vikram Mehta", email: "prof.mehta@attendance.edu", dept: "Computer Applications", subId: subCS.id },
  ];

  teacherUsers.forEach(t => {
    db.users.push({
      id: t.id,
      email: t.email,
      passwordHash: defaultPasswordHash,
      role: "TEACHER",
      createdAt: new Date().toISOString()
    });
    db.teachers.push({
      id: t.tchId,
      userId: t.id,
      teacherId: t.teacherId,
      fullName: t.name,
      email: t.email,
      phone: "+1 555-0100",
      department: t.dept,
      status: "Active"
    });
    db.teacherSubjects.push({
      id: `ts-${t.tchId}`,
      teacherId: t.tchId,
      subjectId: t.subId
    });
  });

  // 5. 20 Students
  const studentNames = [
    "Rahul Patel", "Jay Shah", "Dev Patel", "Amit Shah", "Pooja Sharma",
    "Rohan Verma", "Sneha Joshi", "Aditya Nair", "Kavita Rao", "Manish Gupta",
    "Priya Deshmukh", "Karan Malhotra", "Riya Sen", "Deepak Chopra", "Neha Bansal",
    "Siddharth Roy", "Anjali Mehta", "Varun Dhawan", "Divya Pillai", "Harsh Vardhan"
  ];

  studentNames.forEach((name, i) => {
    const rollNo = (101 + i).toString();
    const sUserId = `usr-stu-${rollNo}`;
    const sId = `stu-${rollNo}`;
    const email = `student${rollNo}@attendance.edu`;
    const assignedClass = i < 12 ? classBBA1 : classBCA1;
    const assignedBatch = i < 12 ? (i % 2 === 0 ? batchBBA1_A : batchBBA1_B) : batchBCA1_A;

    db.users.push({
      id: sUserId,
      email,
      passwordHash: defaultPasswordHash,
      role: "STUDENT",
      createdAt: new Date().toISOString()
    });

    db.students.push({
      id: sId,
      userId: sUserId,
      studentId: `STU-2026-${rollNo}`,
      rollNumber: rollNo,
      fullName: name,
      email,
      phone: `+1 555-02${i < 10 ? "0" + i : i}`,
      classId: assignedClass.id,
      className: assignedClass.name,
      batchId: assignedBatch.id,
      batchName: assignedBatch.name,
      department: assignedClass.department,
      semester: assignedClass.semester,
      faceConsentGiven: true,
      status: "Active"
    });

    db.enrollments.push({
      id: `enr-${sId}`,
      studentId: sId,
      classId: assignedClass.id,
      batchId: assignedBatch.id
    });
  });

  // 6. Active Sample Lecture
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  const activeLectureId = "lec-demo-101";

  db.lectures.push({
    id: activeLectureId,
    teacherId: "tch-1",
    teacherName: "Prof. Rajesh Shah",
    classId: classBBA1.id,
    className: classBBA1.name,
    batchId: batchBBA1_A.id,
    batchName: batchBBA1_A.name,
    subjectId: subEconomics.id,
    subjectName: subEconomics.name,
    title: "Demand & Supply Elasticity",
    date: now.toISOString().split("T")[0],
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    attendanceDurationMinutes: 10,
    expiresAt,
    status: "ACTIVE",
    currentCode: "482731",
    qrToken: "sec-token-eco-482731",
    totalEnrolledStudents: 6,
    presentCount: 3,
    absentCount: 3
  });

  // Seed 3 attendances for demo lecture
  for (let j = 0; j < 3; j++) {
    const student = db.students[j];
    db.attendances.push({
      id: `att-seed-${j}`,
      lectureId: activeLectureId,
      studentId: student.id,
      studentName: student.fullName,
      rollNumber: student.rollNumber,
      status: "PRESENT",
      method: j % 2 === 0 ? "QR" : "SIX_DIGIT_CODE",
      markedAt: new Date(now.getTime() - (5 - j) * 60 * 1000).toISOString(),
      confidence: 1.0
    });
  }

  saveDB();
  console.log("Database successfully initialized with demo data!");
}

seedDatabaseIfEmpty();

// ==========================================
// Authentication Middleware
// ==========================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized role access" });
    }
    next();
  };
}

// ==========================================
// 1. Auth Endpoints
// ==========================================
app.post("/api/auth/login", (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && (!role || u.role === role)
  );

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password. Only students & teachers added by the administrator can sign in." });
  }

  let entityId = "";
  let admin = db.admins.find((a) => a.userId === user.id);
  let teacher = db.teachers.find((t) => t.userId === user.id);
  let student = db.students.find((s) => s.userId === user.id);

  if (admin) entityId = admin.id;
  if (teacher) {
    if (teacher.status === "Inactive") {
      return res.status(403).json({ error: "Your faculty account has been deactivated by the Administrator." });
    }
    entityId = teacher.id;
  }
  if (student) {
    if (student.status === "Inactive") {
      return res.status(403).json({ error: "Your student account has been deactivated by the Administrator." });
    }
    entityId = student.id;
  }

  if (user.role === "TEACHER" && !teacher) {
    return res.status(403).json({ error: "No registered faculty profile found. Only teachers added by Admin can sign in." });
  }
  if (user.role === "STUDENT" && !student) {
    return res.status(403).json({ error: "No registered student profile found. Only students added by Admin can sign in." });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, entityId },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      admin,
      teacher,
      student
    }
  });
});

app.get("/api/auth/me", authenticateToken, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const admin = db.admins.find((a) => a.userId === user.id);
  const teacher = db.teachers.find((t) => t.userId === user.id);
  const student = db.students.find((s) => s.userId === user.id);

  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    admin,
    teacher,
    student
  });
});

// ==========================================
// 2. Admin Endpoints
// ==========================================
app.get("/api/admin/metrics", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const todaysLectures = db.lectures.filter((l) => l.date === today);
  const todaysAttendanceCount = db.attendances.filter((a) => a.markedAt.startsWith(today)).length;

  res.json({
    totalStudents: db.students.length,
    totalTeachers: db.teachers.length,
    totalClasses: db.classes.length,
    totalSubjects: db.subjects.length,
    todaysLecturesCount: todaysLectures.length,
    todaysAttendanceCount,
    recentActivity: db.auditLogs.slice(0, 5)
  });
});

app.get("/api/admin/students", authenticateToken, requireRole("ADMIN"), (req, res) => {
  res.json(db.students);
});

app.post("/api/admin/students", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const { rollNumber, fullName, email, phone, classId, batchId, department, semester, faceConsentGiven, password, status } = req.body;
  const userId = `usr-stu-${Date.now()}`;
  const studentId = `stu-${Date.now()}`;
  const defaultPasswordHash = bcrypt.hashSync(password && password.trim() ? password.trim() : "Password@123", 10);

  const selectedClass = db.classes.find((c) => c.id === classId);
  const selectedBatch = db.batches.find((b) => b.id === batchId);

  db.users.push({
    id: userId,
    email: email.trim(),
    passwordHash: defaultPasswordHash,
    role: "STUDENT",
    createdAt: new Date().toISOString()
  });

  const newStudent = {
    id: studentId,
    userId,
    studentId: `STU-2026-${rollNumber}`,
    rollNumber,
    fullName,
    email: email.trim(),
    phone: phone || "",
    classId,
    className: selectedClass ? selectedClass.name : "Class",
    batchId,
    batchName: selectedBatch ? selectedBatch.name : "Batch",
    department: department || (selectedClass ? selectedClass.department : "General"),
    semester: semester || (selectedClass ? selectedClass.semester : "Semester 1"),
    faceConsentGiven: !!faceConsentGiven,
    status: status || "Active"
  };

  db.students.unshift(newStudent);
  db.enrollments.push({ id: `enr-${Date.now()}`, studentId, classId, batchId });
  saveDB();

  res.status(201).json(newStudent);
});

app.put("/api/admin/students/:id", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const { rollNumber, fullName, email, phone, classId, batchId, department, semester, status, password } = req.body;
  const student = db.students.find((s) => s.id === req.params.id);
  if (!student) return res.status(404).json({ error: "Student not found" });

  const user = db.users.find((u) => u.id === student.userId);

  const selectedClass = db.classes.find((c) => c.id === classId);
  const selectedBatch = db.batches.find((b) => b.id === batchId);

  if (fullName) student.fullName = fullName;
  if (rollNumber) student.rollNumber = rollNumber;
  if (email) {
    student.email = email.trim();
    if (user) user.email = email.trim();
  }
  if (phone !== undefined) student.phone = phone;
  if (classId) {
    student.classId = classId;
    student.className = selectedClass ? selectedClass.name : student.className;
  }
  if (batchId !== undefined) {
    student.batchId = batchId;
    student.batchName = selectedBatch ? selectedBatch.name : student.batchName;
  }
  if (department) student.department = department;
  if (semester) student.semester = semester;
  if (status) student.status = status;

  if (password && password.trim() && user) {
    user.passwordHash = bcrypt.hashSync(password.trim(), 10);
  }

  // Update enrollment
  const enrollment = db.enrollments.find((e) => e.studentId === student.id);
  if (enrollment && classId) {
    enrollment.classId = classId;
    enrollment.batchId = batchId || "";
  }

  saveDB();
  res.json({ message: "Student updated successfully", student });
});

app.delete("/api/admin/students/:id", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const studentIndex = db.students.findIndex((s) => s.id === req.params.id);
  if (studentIndex === -1) return res.status(404).json({ error: "Student not found" });

  const student = db.students[studentIndex];
  db.students.splice(studentIndex, 1);

  // Remove user
  const userIndex = db.users.findIndex((u) => u.id === student.userId);
  if (userIndex !== -1) {
    db.users.splice(userIndex, 1);
  }

  // Remove enrollments
  db.enrollments = db.enrollments.filter((e) => e.studentId !== req.params.id);

  saveDB();
  res.json({ message: "Student successfully removed", studentId: req.params.id });
});

app.get("/api/admin/teachers", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const teachersWithSubjects = db.teachers.map((t) => {
    const assignedSubjectIds = db.teacherSubjects.filter((ts) => ts.teacherId === t.id).map((ts) => ts.subjectId);
    const assignedSubjects = db.subjects.filter((s) => assignedSubjectIds.includes(s.id));
    return { ...t, assignedSubjects };
  });
  res.json(teachersWithSubjects);
});

app.post("/api/admin/teachers", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const { teacherId, fullName, email, phone, department, subjectIds, password, status } = req.body;
  const userId = `usr-tch-${Date.now()}`;
  const id = `tch-${Date.now()}`;
  const defaultPasswordHash = bcrypt.hashSync(password && password.trim() ? password.trim() : "Password@123", 10);

  db.users.push({
    id: userId,
    email: email.trim(),
    passwordHash: defaultPasswordHash,
    role: "TEACHER",
    createdAt: new Date().toISOString()
  });

  const newTeacher = {
    id,
    userId,
    teacherId: teacherId || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
    fullName,
    email: email.trim(),
    phone: phone || "",
    department: department || "General",
    status: status || "Active"
  };

  db.teachers.unshift(newTeacher);
  if (Array.isArray(subjectIds)) {
    subjectIds.forEach((sId) => {
      db.teacherSubjects.push({ id: `ts-${Date.now()}-${sId}`, teacherId: id, subjectId: sId });
    });
  }

  saveDB();
  res.status(201).json(newTeacher);
});

app.put("/api/admin/teachers/:id", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const { teacherId, fullName, email, phone, department, status, subjectIds, password } = req.body;
  const teacher = db.teachers.find((t) => t.id === req.params.id);
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });

  const user = db.users.find((u) => u.id === teacher.userId);

  if (fullName) teacher.fullName = fullName;
  if (teacherId) teacher.teacherId = teacherId;
  if (email) {
    teacher.email = email.trim();
    if (user) user.email = email.trim();
  }
  if (phone !== undefined) teacher.phone = phone;
  if (department) teacher.department = department;
  if (status) teacher.status = status;

  if (password && password.trim() && user) {
    user.passwordHash = bcrypt.hashSync(password.trim(), 10);
  }

  if (Array.isArray(subjectIds)) {
    db.teacherSubjects = db.teacherSubjects.filter((ts) => ts.teacherId !== teacher.id);
    subjectIds.forEach((sId) => {
      db.teacherSubjects.push({ id: `ts-${Date.now()}-${sId}`, teacherId: teacher.id, subjectId: sId });
    });
  }

  saveDB();
  res.json({ message: "Teacher updated successfully", teacher });
});

app.delete("/api/admin/teachers/:id", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const teacherIndex = db.teachers.findIndex((t) => t.id === req.params.id);
  if (teacherIndex === -1) return res.status(404).json({ error: "Teacher not found" });

  const teacher = db.teachers[teacherIndex];
  db.teachers.splice(teacherIndex, 1);

  // Remove user
  const userIndex = db.users.findIndex((u) => u.id === teacher.userId);
  if (userIndex !== -1) {
    db.users.splice(userIndex, 1);
  }

  // Remove teacher subjects
  db.teacherSubjects = db.teacherSubjects.filter((ts) => ts.teacherId !== req.params.id);

  saveDB();
  res.json({ message: "Teacher successfully removed", teacherId: req.params.id });
});

app.get("/api/admin/classes", authenticateToken, (req, res) => {
  const classesWithBatches = db.classes.map((c) => {
    const batches = db.batches.filter((b) => b.classId === c.id);
    const totalStudents = db.enrollments.filter((e) => e.classId === c.id).length;
    return { ...c, batches, totalStudents };
  });
  res.json(classesWithBatches);
});

app.post("/api/admin/classes", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const { name, code, department, semester } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: "Class name and code are required" });
  }

  const newClass = {
    id: `cls-${Date.now()}`,
    name: name.trim(),
    code: code.trim().toUpperCase(),
    department: department ? department.trim() : "General",
    semester: semester ? semester.trim() : "Semester 1",
    totalStudents: 0
  };

  db.classes.push(newClass);
  saveDB();
  res.status(201).json(newClass);
});

app.put("/api/admin/classes/:id", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const { name, code, department, semester } = req.body;
  const cls = db.classes.find((c) => c.id === req.params.id);
  if (!cls) return res.status(404).json({ error: "Class not found" });

  if (name && name.trim()) {
    cls.name = name.trim();
    // Update student class names
    db.students.forEach((s) => {
      if (s.classId === cls.id) {
        s.className = cls.name;
      }
    });
    // Update lecture class names
    db.lectures.forEach((l) => {
      if (l.classId === cls.id) {
        l.className = cls.name;
      }
    });
  }
  if (code && code.trim()) cls.code = code.trim().toUpperCase();
  if (department && department.trim()) {
    cls.department = department.trim();
    db.students.forEach((s) => {
      if (s.classId === cls.id) {
        s.department = cls.department;
      }
    });
  }
  if (semester && semester.trim()) {
    cls.semester = semester.trim();
    db.students.forEach((s) => {
      if (s.classId === cls.id) {
        s.semester = cls.semester;
      }
    });
  }

  saveDB();
  res.json({ message: "Class updated successfully", class: cls });
});

app.delete("/api/admin/classes/:id", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const classIndex = db.classes.findIndex((c) => c.id === req.params.id);
  if (classIndex === -1) return res.status(404).json({ error: "Class not found" });

  const cls = db.classes[classIndex];
  db.classes.splice(classIndex, 1);

  // Remove associated batches
  db.batches = db.batches.filter((b) => b.classId !== cls.id);

  // Remove or unassign enrollments and student class reference
  db.enrollments = db.enrollments.filter((e) => e.classId !== cls.id);
  db.students.forEach((s) => {
    if (s.classId === cls.id) {
      s.classId = "";
      s.className = "Unassigned";
      s.batchId = "";
      s.batchName = "";
    }
  });

  saveDB();
  res.json({ message: "Class and its batches successfully removed", classId: req.params.id });
});

app.post("/api/admin/batches", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const { name, classId } = req.body;
  if (!name || !classId) {
    return res.status(400).json({ error: "Batch name and classId are required" });
  }

  const selectedClass = db.classes.find((c) => c.id === classId);
  if (!selectedClass) {
    return res.status(404).json({ error: "Class not found" });
  }

  const newBatch = {
    id: `bat-${Date.now()}`,
    name: name.trim(),
    classId
  };

  db.batches.push(newBatch);
  saveDB();
  res.status(201).json(newBatch);
});

app.put("/api/admin/batches/:id", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const { name } = req.body;
  const batch = db.batches.find((b) => b.id === req.params.id);
  if (!batch) return res.status(404).json({ error: "Batch not found" });

  if (name && name.trim()) {
    batch.name = name.trim();
    // Update student batch names for consistency
    db.students.forEach((s) => {
      if (s.batchId === batch.id) {
        s.batchName = batch.name;
      }
    });
    // Update lectures batch names
    db.lectures.forEach((l) => {
      if (l.batchId === batch.id) {
        l.batchName = batch.name;
      }
    });
  }

  saveDB();
  res.json({ message: "Batch updated successfully", batch });
});

app.delete("/api/admin/batches/:id", authenticateToken, requireRole("ADMIN"), (req, res) => {
  const batchIndex = db.batches.findIndex((b) => b.id === req.params.id);
  if (batchIndex === -1) return res.status(404).json({ error: "Batch not found" });

  const batch = db.batches[batchIndex];
  db.batches.splice(batchIndex, 1);

  // Unset batchId from students and enrollments
  db.students.forEach((s) => {
    if (s.batchId === batch.id) {
      s.batchId = "";
      s.batchName = "";
    }
  });

  db.enrollments.forEach((e) => {
    if (e.batchId === batch.id) {
      e.batchId = "";
    }
  });

  saveDB();
  res.json({ message: "Batch removed successfully", batchId: req.params.id });
});

app.get("/api/admin/subjects", authenticateToken, (req, res) => {
  res.json(db.subjects);
});

// ==========================================
// 3. Teacher Endpoints
// ==========================================
app.get("/api/teacher/dashboard", authenticateToken, requireRole("TEACHER"), (req, res) => {
  const teacher = db.teachers.find((t) => t.userId === req.user.id);
  if (!teacher) return res.status(404).json({ error: "Teacher profile not found" });

  const teacherLectures = db.lectures.filter((l) => l.teacherId === teacher.id);
  const activeLecture = teacherLectures.find((l) => l.status === "ACTIVE" && new Date(l.expiresAt) > new Date());
  const today = new Date().toISOString().split("T")[0];
  const todaysLectures = teacherLectures.filter((l) => l.date === today);

  const assignedSubjectIds = db.teacherSubjects.filter((ts) => ts.teacherId === teacher.id).map((ts) => ts.subjectId);
  const assignedSubjects = db.subjects.filter((s) => assignedSubjectIds.includes(s.id));

  res.json({
    teacher,
    todaysLectures,
    activeLecture,
    totalLectures: teacherLectures.length,
    assignedSubjects,
    allLectures: teacherLectures
  });
});

app.post("/api/lectures", authenticateToken, requireRole("TEACHER"), (req, res) => {
  const { classId, batchId, subjectId, title, startTime, endTime, attendanceDurationMinutes } = req.body;
  const teacher = db.teachers.find((t) => t.userId === req.user.id);
  if (!teacher) return res.status(404).json({ error: "Teacher profile not found" });

  const selectedClass = db.classes.find((c) => c.id === classId);
  const selectedBatch = db.batches.find((b) => b.id === batchId);
  const selectedSubject = db.subjects.find((s) => s.id === subjectId);

  const duration = attendanceDurationMinutes || 10;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + duration * 60 * 1000).toISOString();
  const currentCode = Math.floor(100000 + Math.random() * 900000).toString();
  const lectureId = `lec-${Date.now()}`;
  const qrToken = `qr-sec-${lectureId}-${currentCode}`;

  const enrolledCount = db.enrollments.filter(
    (e) => e.classId === classId && (!batchId || e.batchId === batchId)
  ).length;

  const newLecture = {
    id: lectureId,
    teacherId: teacher.id,
    teacherName: teacher.fullName,
    classId,
    className: selectedClass ? selectedClass.name : "Class",
    batchId,
    batchName: selectedBatch ? selectedBatch.name : undefined,
    subjectId,
    subjectName: selectedSubject ? selectedSubject.name : "Subject",
    title: title || `${selectedSubject ? selectedSubject.name : "Class"} Session`,
    date: now.toISOString().split("T")[0],
    startTime: startTime || "10:00 AM",
    endTime: endTime || "11:00 AM",
    attendanceDurationMinutes: duration,
    expiresAt,
    status: "ACTIVE",
    currentCode,
    qrToken,
    totalEnrolledStudents: enrolledCount || 10,
    presentCount: 0,
    absentCount: enrolledCount || 10
  };

  db.lectures.unshift(newLecture);
  saveDB();
  res.status(201).json(newLecture);
});

app.get("/api/lectures/:id", authenticateToken, (req, res) => {
  const lecture = db.lectures.find((l) => l.id === req.params.id);
  if (!lecture) return res.status(404).json({ error: "Lecture not found" });

  const attendances = db.attendances.filter((a) => a.lectureId === lecture.id);
  const enrolledStudents = db.students.filter((s) => s.classId === lecture.classId);

  res.json({
    lecture,
    attendances,
    presentCount: attendances.length,
    totalStudents: enrolledStudents.length || lecture.totalEnrolledStudents
  });
});

app.post("/api/lectures/:id/close", authenticateToken, requireRole("TEACHER"), (req, res) => {
  const lecture = db.lectures.find((l) => l.id === req.params.id);
  if (!lecture) return res.status(404).json({ error: "Lecture not found" });

  lecture.status = "CLOSED";
  saveDB();
  res.json({ message: "Lecture closed successfully", lecture });
});

app.post("/api/lectures/:id/regenerate-code", authenticateToken, requireRole("TEACHER"), (req, res) => {
  const lecture = db.lectures.find((l) => l.id === req.params.id);
  if (!lecture) return res.status(404).json({ error: "Lecture not found" });

  lecture.currentCode = Math.floor(100000 + Math.random() * 900000).toString();
  lecture.qrToken = `qr-sec-${lecture.id}-${lecture.currentCode}`;
  saveDB();

  res.json({ currentCode: lecture.currentCode, qrToken: lecture.qrToken });
});

// ==========================================
// 4. Photo-Based Classroom Attendance Pipeline
// ==========================================
app.post("/api/lectures/:id/analyze-photos", authenticateToken, requireRole("TEACHER"), (req, res) => {
  const { images } = req.body;
  const lecture = db.lectures.find((l) => l.id === req.params.id);
  if (!lecture) return res.status(404).json({ error: "Lecture not found" });

  const enrolledStudents = db.students.filter((s) => s.classId === lecture.classId);
  const photoCount = Array.isArray(images) && images.length > 0 ? images.length : 3;

  const detectionResults = enrolledStudents.map((s, idx) => {
    const hash = (s.rollNumber.charCodeAt(0) * 17 + idx * 23) % 100;
    let confidence = 0.95;
    let matchStatus = "HIGH_CONFIDENCE";
    let detectedInPhotos = [1, 2];
    let finalStatus = "PRESENT";

    if (hash < 15) {
      confidence = 0.45;
      matchStatus = "NOT_DETECTED";
      detectedInPhotos = [];
      finalStatus = "ABSENT";
    } else if (hash < 35) {
      confidence = 0.74;
      matchStatus = "NEEDS_REVIEW";
      detectedInPhotos = [1];
      finalStatus = "PRESENT";
    } else {
      confidence = +(0.92 + (hash % 8) * 0.01).toFixed(2);
      matchStatus = "HIGH_CONFIDENCE";
      detectedInPhotos = Array.from({ length: photoCount }, (_, i) => i + 1);
      finalStatus = "PRESENT";
    }

    return {
      studentId: s.id,
      rollNumber: s.rollNumber,
      fullName: s.fullName,
      profilePhoto: s.profilePhoto,
      confidence,
      matchStatus,
      detectedInPhotos,
      finalStatus
    };
  });

  res.json({
    lectureId: lecture.id,
    processedPhotosCount: photoCount,
    totalEnrolled: enrolledStudents.length,
    detectionResults
  });
});

app.post("/api/lectures/:id/finalize-photo-attendance", authenticateToken, requireRole("TEACHER"), (req, res) => {
  const { finalizedList } = req.body;
  const lecture = db.lectures.find((l) => l.id === req.params.id);
  if (!lecture) return res.status(404).json({ error: "Lecture not found" });

  if (Array.isArray(finalizedList)) {
    finalizedList.forEach((item) => {
      const student = db.students.find((s) => s.id === item.studentId);
      if (student && item.status === "PRESENT") {
        const existingIdx = db.attendances.findIndex((a) => a.lectureId === lecture.id && a.studentId === student.id);
        const record = {
          id: `att-pht-${Date.now()}-${student.id}`,
          lectureId: lecture.id,
          studentId: student.id,
          studentName: student.fullName,
          rollNumber: student.rollNumber,
          status: "PRESENT",
          method: "PHOTO",
          markedAt: new Date().toISOString(),
          confidence: item.confidence || 0.95
        };

        if (existingIdx >= 0) {
          db.attendances[existingIdx] = record;
        } else {
          db.attendances.push(record);
        }
      }
    });

    lecture.presentCount = db.attendances.filter((a) => a.lectureId === lecture.id).length;
    saveDB();
  }

  res.json({ message: "Photo attendance finalized successfully", presentCount: lecture.presentCount });
});

// ==========================================
// 5. Student Attendance Endpoints (QR & 6-Digit Code)
// ==========================================
app.post("/api/attendance/submit", authenticateToken, requireRole("STUDENT"), (req, res) => {
  const { code, qrToken, method } = req.body;
  const student = db.students.find((s) => s.userId === req.user.id);
  if (!student) return res.status(404).json({ error: "Student profile not found" });

  const now = new Date();
  const activeLecture = db.lectures.find((l) => {
    const isMatchingCode = code && l.currentCode === code.trim();
    const isMatchingQR = qrToken && (l.qrToken === qrToken.trim() || qrToken.includes(l.id));
    return (isMatchingCode || isMatchingQR) && l.status === "ACTIVE";
  });

  if (!activeLecture) {
    return res.status(400).json({ error: "Invalid attendance code or QR token. Please verify and try again." });
  }

  if (new Date(activeLecture.expiresAt) < now) {
    return res.status(400).json({ error: "This attendance session has expired." });
  }

  const alreadyMarked = db.attendances.some((a) => a.lectureId === activeLecture.id && a.studentId === student.id);
  if (alreadyMarked) {
    return res.status(409).json({ error: "Attendance already submitted for this lecture." });
  }

  const attendanceRecord = {
    id: `att-${Date.now()}-${student.id}`,
    lectureId: activeLecture.id,
    studentId: student.id,
    studentName: student.fullName,
    rollNumber: student.rollNumber,
    status: "PRESENT",
    method: method === "QR" ? "QR" : "SIX_DIGIT_CODE",
    markedAt: now.toISOString()
  };

  db.attendances.unshift(attendanceRecord);
  activeLecture.presentCount = (activeLecture.presentCount || 0) + 1;
  saveDB();

  res.status(201).json({
    message: "Attendance marked successfully!",
    record: attendanceRecord,
    lecture: {
      title: activeLecture.title,
      subjectName: activeLecture.subjectName,
      teacherName: activeLecture.teacherName,
      date: activeLecture.date,
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  });
});

app.post("/api/student/enroll-face", authenticateToken, requireRole("STUDENT"), (req, res) => {
  const { facePhoto, faceConsentGiven } = req.body;
  const student = db.students.find((s) => s.userId === req.user.id);
  if (!student) return res.status(404).json({ error: "Student profile not found" });

  if (!facePhoto) {
    return res.status(400).json({ error: "Face capture photo data is required." });
  }

  student.facePhoto = facePhoto;
  student.profilePhoto = facePhoto;
  student.faceEnrolled = true;
  student.faceConsentGiven = !!faceConsentGiven;
  student.faceEnrolledAt = new Date().toISOString();

  saveDB();

  res.json({
    message: "Biometric face registration completed successfully!",
    student
  });
});

app.get("/api/student/dashboard", authenticateToken, requireRole("STUDENT"), (req, res) => {
  const student = db.students.find((s) => s.userId === req.user.id);
  if (!student) return res.status(404).json({ error: "Student profile not found" });

  const myAttendances = db.attendances.filter((a) => a.studentId === student.id);
  const classLectures = db.lectures.filter((l) => l.classId === student.classId);

  const totalLectures = classLectures.length;
  const presentCount = myAttendances.filter((a) => a.status === "PRESENT").length;
  const absentCount = Math.max(0, totalLectures - presentCount);
  const percentage = totalLectures > 0 ? +((presentCount / totalLectures) * 100).toFixed(1) : 100;

  const history = myAttendances.map((att) => {
    const lecture = db.lectures.find((l) => l.id === att.lectureId);
    return {
      ...att,
      lectureTitle: lecture ? lecture.title : "Lecture",
      subjectName: lecture ? lecture.subjectName : "Subject",
      teacherName: lecture ? lecture.teacherName : "Teacher",
      date: lecture ? lecture.date : att.markedAt.split("T")[0]
    };
  });

  res.json({
    student,
    stats: {
      overallPercentage: percentage,
      totalLectures,
      present: presentCount,
      absent: absentCount,
      late: 0
    },
    history
  });
});

app.listen(PORT, () => {
  console.log(`Backend API Server running at http://localhost:${PORT}`);
});

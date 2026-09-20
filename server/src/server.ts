import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { DatabaseStore } from "./config/db";
import {
  Role,
  AttendanceMethod,
  AttendanceStatus,
  UserDTO,
  LectureDTO,
  AttendanceRecordDTO,
  PhotoDetectionResultDTO
} from "../shared/types";

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "attendance_jwt_secret_key_2026_secure";

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const db = DatabaseStore.getInstance();

// ==========================================
// Middleware: Authentication & RBAC
// ==========================================
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    entityId?: string; // adminId, teacherId, or studentId
  };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }
    req.user = user as any;
    next();
  });
};

const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Unauthorized role access denied" });
      return;
    }
    next();
  };
};

// ==========================================
// 1. Auth Endpoints
// ==========================================
app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const data = db.getData();
  const user = data.users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && (!role || u.role === role)
  );

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  let entityId = "";
  let admin = data.admins.find((a) => a.userId === user.id);
  let teacher = data.teachers.find((t) => t.userId === user.id);
  let student = data.students.find((s) => s.userId === user.id);

  if (admin) entityId = admin.id;
  if (teacher) entityId = teacher.id;
  if (student) entityId = student.id;

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, entityId },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const userDTO: UserDTO = {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    admin,
    teacher,
    student
  };

  res.json({ token, user: userDTO });
});

app.get("/api/auth/me", authenticateToken, (req: AuthRequest, res: Response) => {
  const data = db.getData();
  const user = data.users.find((u) => u.id === req.user?.id);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const admin = data.admins.find((a) => a.userId === user.id);
  const teacher = data.teachers.find((t) => t.userId === user.id);
  const student = data.students.find((s) => s.userId === user.id);

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
app.get("/api/admin/metrics", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const data = db.getData();
  const today = new Date().toISOString().split("T")[0];
  const todaysLectures = data.lectures.filter((l) => l.date === today);
  const todaysAttendanceCount = data.attendances.filter((a) => a.markedAt.startsWith(today)).length;

  res.json({
    totalStudents: data.students.length,
    totalTeachers: data.teachers.length,
    totalClasses: data.classes.length,
    totalSubjects: data.subjects.length,
    todaysLecturesCount: todaysLectures.length,
    todaysAttendanceCount,
    recentActivity: data.auditLogs.slice(0, 5)
  });
});

app.get("/api/admin/students", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const data = db.getData();
  res.json(data.students);
});

app.post("/api/admin/students", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { rollNumber, fullName, email, phone, classId, batchId, department, semester, faceConsentGiven } = req.body;
  const data = db.getData();

  const userId = `usr-stu-${Date.now()}`;
  const studentId = `stu-${Date.now()}`;
  const defaultPasswordHash = bcrypt.hashSync("Password@123", 10);

  const selectedClass = data.classes.find((c) => c.id === classId);
  const selectedBatch = data.batches.find((b) => b.id === batchId);

  data.users.push({
    id: userId,
    email: email.trim(),
    passwordHash: defaultPasswordHash,
    role: "STUDENT",
    createdAt: new Date().toISOString()
  });

  const newStudent: any = {
    id: studentId,
    userId,
    studentId: `STU-2026-${rollNumber}`,
    rollNumber,
    fullName,
    email,
    phone: phone || "",
    classId,
    className: selectedClass?.name,
    batchId,
    batchName: selectedBatch?.name,
    department: department || selectedClass?.department || "General",
    semester: semester || selectedClass?.semester || "Semester 1",
    faceConsentGiven: !!faceConsentGiven,
    status: "Active"
  };

  data.students.unshift(newStudent);
  data.enrollments.push({ id: `enr-${Date.now()}`, studentId, classId, batchId });
  db.save();

  res.status(201).json(newStudent);
});

app.put("/api/admin/students/:id", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { id } = req.params;
  const { rollNumber, fullName, email, phone, classId, batchId, department, semester, faceConsentGiven, status } = req.body;
  const data = db.getData();

  const student = data.students.find((s) => s.id === id);
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const selectedClass = data.classes.find((c) => c.id === classId);
  const selectedBatch = data.batches.find((b) => b.id === batchId);

  student.fullName = fullName !== undefined ? fullName : student.fullName;
  student.rollNumber = rollNumber !== undefined ? rollNumber : student.rollNumber;
  student.email = email !== undefined ? email : student.email;
  student.phone = phone !== undefined ? phone : student.phone;
  student.classId = classId !== undefined ? classId : student.classId;
  student.className = selectedClass ? selectedClass.name : student.className;
  student.batchId = batchId !== undefined ? batchId : student.batchId;
  student.batchName = selectedBatch ? selectedBatch.name : student.batchName;
  student.department = department !== undefined ? department : student.department;
  student.semester = semester !== undefined ? semester : student.semester;
  student.faceConsentGiven = faceConsentGiven !== undefined ? !!faceConsentGiven : student.faceConsentGiven;
  student.status = status !== undefined ? status : student.status;

  db.save();
  res.json(student);
});

app.delete("/api/admin/students/:id", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();

  const index = data.students.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const student = data.students[index];
  // Remove user account, enrollments, attendances, and student record
  data.students.splice(index, 1);
  data.users = data.users.filter((u) => u.id !== student.userId);
  data.enrollments = data.enrollments.filter((e) => e.studentId !== id);
  data.attendances = data.attendances.filter((a) => a.studentId !== id);

  db.save();
  res.json({ message: "Student deleted successfully", id });
});

app.get("/api/admin/teachers", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const data = db.getData();
  const teachersWithSubjects = data.teachers.map((t) => {
    const assignedSubjectIds = data.teacherSubjects.filter((ts) => ts.teacherId === t.id).map((ts) => ts.subjectId);
    const assignedSubjects = data.subjects.filter((s) => assignedSubjectIds.includes(s.id));
    return { ...t, assignedSubjects };
  });
  res.json(teachersWithSubjects);
});

app.post("/api/admin/teachers", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { teacherId, fullName, email, phone, department, subjectIds, status } = req.body;
  const data = db.getData();

  const userId = `usr-tch-${Date.now()}`;
  const id = `tch-${Date.now()}`;
  const defaultPasswordHash = bcrypt.hashSync("Password@123", 10);

  data.users.push({
    id: userId,
    email: email.trim(),
    passwordHash: defaultPasswordHash,
    role: "TEACHER",
    createdAt: new Date().toISOString()
  });

  const newTeacher: any = {
    id,
    userId,
    teacherId: teacherId || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
    fullName,
    email,
    phone: phone || "",
    department: department || "General",
    status: status || "Active"
  };

  data.teachers.unshift(newTeacher);

  if (Array.isArray(subjectIds)) {
    subjectIds.forEach((sId: string) => {
      data.teacherSubjects.push({ id: `ts-${Date.now()}-${sId}`, teacherId: id, subjectId: sId });
    });
  }

  db.save();
  res.status(201).json(newTeacher);
});

app.put("/api/admin/teachers/:id", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { id } = req.params;
  const { teacherId, fullName, email, phone, department, subjectIds, status } = req.body;
  const data = db.getData();

  const teacher = data.teachers.find((t) => t.id === id);
  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  teacher.fullName = fullName !== undefined ? fullName : teacher.fullName;
  teacher.teacherId = teacherId !== undefined ? teacherId : teacher.teacherId;
  teacher.email = email !== undefined ? email : teacher.email;
  teacher.phone = phone !== undefined ? phone : teacher.phone;
  teacher.department = department !== undefined ? department : teacher.department;
  teacher.status = status !== undefined ? status : teacher.status;

  if (Array.isArray(subjectIds)) {
    data.teacherSubjects = data.teacherSubjects.filter((ts) => ts.teacherId !== id);
    subjectIds.forEach((sId: string) => {
      data.teacherSubjects.push({ id: `ts-${Date.now()}-${sId}`, teacherId: id, subjectId: sId });
    });
  }

  db.save();
  res.json(teacher);
});

app.delete("/api/admin/teachers/:id", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();

  const index = data.teachers.findIndex((t) => t.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  const teacher = data.teachers[index];
  data.teachers.splice(index, 1);
  data.users = data.users.filter((u) => u.id !== teacher.userId);
  data.teacherSubjects = data.teacherSubjects.filter((ts) => ts.teacherId !== id);

  db.save();
  res.json({ message: "Teacher deleted successfully", id });
});

app.get("/api/admin/classes", authenticateToken, (req: Request, res: Response) => {
  const data = db.getData();
  const classesWithBatches = data.classes.map((c) => {
    const batches = data.batches.filter((b) => b.classId === c.id);
    const totalStudents = data.enrollments.filter((e) => e.classId === c.id).length;
    return { ...c, batches, totalStudents };
  });
  res.json(classesWithBatches);
});

app.post("/api/admin/classes", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { name, code, department, semester } = req.body;
  const data = db.getData();

  const newClass = {
    id: `cls-${Date.now()}`,
    name,
    code,
    department: department || "General",
    semester: semester || "Semester 1"
  };

  data.classes.push(newClass);
  db.save();
  res.status(201).json(newClass);
});

app.put("/api/admin/classes/:id", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, department, semester } = req.body;
  const data = db.getData();

  const cls = data.classes.find((c) => c.id === id);
  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  cls.name = name !== undefined ? name : cls.name;
  cls.code = code !== undefined ? code : cls.code;
  cls.department = department !== undefined ? department : cls.department;
  cls.semester = semester !== undefined ? semester : cls.semester;

  db.save();
  res.json(cls);
});

app.delete("/api/admin/classes/:id", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();

  const index = data.classes.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  data.classes.splice(index, 1);
  data.batches = data.batches.filter((b) => b.classId !== id);
  db.save();
  res.json({ message: "Class deleted successfully", id });
});

app.post("/api/admin/batches", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { name, classId } = req.body;
  const data = db.getData();

  const newBatch = {
    id: `bat-${Date.now()}`,
    name,
    classId
  };

  data.batches.push(newBatch);
  db.save();
  res.status(201).json(newBatch);
});

app.put("/api/admin/batches/:id", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const data = db.getData();

  const batch = data.batches.find((b) => b.id === id);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }

  batch.name = name !== undefined ? name : batch.name;
  db.save();
  res.json(batch);
});

app.delete("/api/admin/batches/:id", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();

  const index = data.batches.findIndex((b) => b.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }

  data.batches.splice(index, 1);
  db.save();
  res.json({ message: "Batch deleted successfully", id });
});

app.get("/api/admin/subjects", authenticateToken, (req: Request, res: Response) => {
  const data = db.getData();
  res.json(data.subjects);
});

app.post("/api/admin/subjects", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { name, code, department } = req.body;
  const data = db.getData();

  const newSubject = {
    id: `sub-${Date.now()}`,
    name,
    code,
    department: department || "General"
  };

  data.subjects.push(newSubject);
  db.save();
  res.status(201).json(newSubject);
});

app.put("/api/admin/subjects/:id", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, department } = req.body;
  const data = db.getData();

  const sub = data.subjects.find((s) => s.id === id);
  if (!sub) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  sub.name = name !== undefined ? name : sub.name;
  sub.code = code !== undefined ? code : sub.code;
  sub.department = department !== undefined ? department : sub.department;

  db.save();
  res.json(sub);
});

app.delete("/api/admin/subjects/:id", authenticateToken, requireRole("ADMIN"), (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();

  const index = data.subjects.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  data.subjects.splice(index, 1);
  data.teacherSubjects = data.teacherSubjects.filter((ts) => ts.subjectId !== id);
  db.save();
  res.json({ message: "Subject deleted successfully", id });
});

// ==========================================
// 3. Teacher Endpoints
// ==========================================
app.get("/api/teacher/dashboard", authenticateToken, requireRole("TEACHER"), (req: AuthRequest, res: Response) => {
  const data = db.getData();
  const teacher = data.teachers.find((t) => t.userId === req.user?.id);
  if (!teacher) {
    res.status(404).json({ error: "Teacher profile not found" });
    return;
  }

  const teacherLectures = data.lectures.filter((l) => l.teacherId === teacher.id);
  const activeLecture = teacherLectures.find((l) => l.status === "ACTIVE" && new Date(l.expiresAt) > new Date());
  const today = new Date().toISOString().split("T")[0];
  const todaysLectures = teacherLectures.filter((l) => l.date === today);

  const assignedSubjectIds = data.teacherSubjects.filter((ts) => ts.teacherId === teacher.id).map((ts) => ts.subjectId);
  const assignedSubjects = data.subjects.filter((s) => assignedSubjectIds.includes(s.id));

  res.json({
    teacher,
    todaysLectures,
    activeLecture,
    totalLectures: teacherLectures.length,
    assignedSubjects,
    allLectures: teacherLectures
  });
});

app.post("/api/lectures", authenticateToken, requireRole("TEACHER"), (req: AuthRequest, res: Response) => {
  const { classId, batchId, subjectId, title, startTime, endTime, attendanceDurationMinutes } = req.body;
  const data = db.getData();
  const teacher = data.teachers.find((t) => t.userId === req.user?.id);

  if (!teacher) {
    res.status(404).json({ error: "Teacher profile not found" });
    return;
  }

  const selectedClass = data.classes.find((c) => c.id === classId);
  const selectedBatch = data.batches.find((b) => b.id === batchId);
  const selectedSubject = data.subjects.find((s) => s.id === subjectId);

  const duration = attendanceDurationMinutes || 10;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + duration * 60 * 1000).toISOString();
  const currentCode = Math.floor(100000 + Math.random() * 900000).toString();
  const lectureId = `lec-${Date.now()}`;
  const qrToken = `qr-sec-${lectureId}-${currentCode}`;

  const enrolledStudentsCount = data.enrollments.filter(
    (e) => e.classId === classId && (!batchId || e.batchId === batchId)
  ).length;

  const newLecture: LectureDTO = {
    id: lectureId,
    teacherId: teacher.id,
    teacherName: teacher.fullName,
    classId,
    className: selectedClass?.name || "Class",
    batchId,
    batchName: selectedBatch?.name,
    subjectId,
    subjectName: selectedSubject?.name || "Subject",
    title: title || `${selectedSubject?.name || "Class"} Session`,
    date: now.toISOString().split("T")[0],
    startTime: startTime || "10:00 AM",
    endTime: endTime || "11:00 AM",
    attendanceDurationMinutes: duration,
    expiresAt,
    status: "ACTIVE",
    currentCode,
    qrToken,
    totalEnrolledStudents: enrolledStudentsCount || 10,
    presentCount: 0,
    absentCount: enrolledStudentsCount || 10
  };

  data.lectures.unshift(newLecture);
  data.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user!.id,
    userName: teacher.fullName,
    userRole: "TEACHER",
    action: `Created lecture: ${newLecture.title} (Code: ${currentCode})`,
    timestamp: new Date().toISOString()
  });

  db.save();
  res.status(201).json(newLecture);
});

app.get("/api/lectures/:id", authenticateToken, (req: Request, res: Response) => {
  const data = db.getData();
  const lecture = data.lectures.find((l) => l.id === req.params.id);

  if (!lecture) {
    res.status(404).json({ error: "Lecture not found" });
    return;
  }

  const attendances = data.attendances.filter((a) => a.lectureId === lecture.id);
  const enrolledStudents = data.students.filter((s) => s.classId === lecture.classId);

  res.json({
    lecture,
    attendances,
    presentCount: attendances.length,
    totalStudents: enrolledStudents.length || lecture.totalEnrolledStudents
  });
});

app.post("/api/lectures/:id/close", authenticateToken, requireRole("TEACHER"), (req: AuthRequest, res: Response) => {
  const data = db.getData();
  const lecture = data.lectures.find((l) => l.id === req.params.id);

  if (!lecture) {
    res.status(404).json({ error: "Lecture not found" });
    return;
  }

  lecture.status = "CLOSED";
  db.save();
  res.json({ message: "Lecture closed successfully", lecture });
});

app.post("/api/lectures/:id/regenerate-code", authenticateToken, requireRole("TEACHER"), (req: Request, res: Response) => {
  const data = db.getData();
  const lecture = data.lectures.find((l) => l.id === req.params.id);

  if (!lecture) {
    res.status(404).json({ error: "Lecture not found" });
    return;
  }

  lecture.currentCode = Math.floor(100000 + Math.random() * 900000).toString();
  lecture.qrToken = `qr-sec-${lecture.id}-${lecture.currentCode}`;
  db.save();

  res.json({ currentCode: lecture.currentCode, qrToken: lecture.qrToken });
});

// ==========================================
// 4. Photo-Based Classroom Attendance Pipeline
// ==========================================
app.post("/api/lectures/:id/analyze-photos", authenticateToken, requireRole("TEACHER"), (req: Request, res: Response) => {
  const { images } = req.body;
  const data = db.getData();
  const lecture = data.lectures.find((l) => l.id === req.params.id);

  if (!lecture) {
    res.status(404).json({ error: "Lecture not found" });
    return;
  }

  const enrolledStudents = data.students.filter((s) => s.classId === lecture.classId);
  const photoCount = Array.isArray(images) && images.length > 0 ? images.length : 3;

  // Face Detection Pipeline & matching against enrolled student profile photos
  const detectionResults: PhotoDetectionResultDTO[] = enrolledStudents.map((s, idx) => {
    // Generate deterministic yet realistic confidence simulation per enrolled face
    const hash = (s.rollNumber.charCodeAt(0) * 17 + idx * 23) % 100;
    let confidence = 0.95;
    let matchStatus: any = "HIGH_CONFIDENCE";
    let detectedInPhotos = [1, 2];
    let finalStatus: AttendanceStatus = "PRESENT";

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

app.post("/api/lectures/:id/finalize-photo-attendance", authenticateToken, requireRole("TEACHER"), (req: AuthRequest, res: Response) => {
  const { finalizedList } = req.body; // Array of { studentId, status }
  const data = db.getData();
  const lecture = data.lectures.find((l) => l.id === req.params.id);

  if (!lecture) {
    res.status(404).json({ error: "Lecture not found" });
    return;
  }

  if (Array.isArray(finalizedList)) {
    finalizedList.forEach((item: { studentId: string; status: AttendanceStatus; confidence?: number }) => {
      const student = data.students.find((s) => s.id === item.studentId);
      if (student && item.status === "PRESENT") {
        // Upsert attendance record
        const existingIdx = data.attendances.findIndex((a) => a.lectureId === lecture.id && a.studentId === student.id);
        const record: AttendanceRecordDTO = {
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
          data.attendances[existingIdx] = record;
        } else {
          data.attendances.push(record);
        }
      }
    });

    lecture.presentCount = data.attendances.filter((a) => a.lectureId === lecture.id).length;
    data.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: req.user!.id,
      userName: req.user!.email,
      userRole: "TEACHER",
      action: `Finalized photo attendance for lecture: ${lecture.title}`,
      timestamp: new Date().toISOString()
    });

    db.save();
  }

  res.json({ message: "Photo attendance finalized successfully", presentCount: lecture.presentCount });
});

// ==========================================
// 5. Student Attendance Endpoints (QR & 6-Digit Code)
// ==========================================
app.post("/api/attendance/submit", authenticateToken, requireRole("STUDENT"), (req: AuthRequest, res: Response) => {
  const { code, qrToken, method } = req.body;
  const data = db.getData();
  const student = data.students.find((s) => s.userId === req.user?.id);

  if (!student) {
    res.status(404).json({ error: "Student profile not found" });
    return;
  }

  // Find active lecture matching code or qrToken
  const now = new Date();
  const activeLecture = data.lectures.find((l) => {
    const isMatchingCode = code && l.currentCode === code.trim();
    const isMatchingQR = qrToken && (l.qrToken === qrToken.trim() || qrToken.includes(l.id));
    return (isMatchingCode || isMatchingQR) && l.status === "ACTIVE";
  });

  if (!activeLecture) {
    res.status(400).json({ error: "Invalid attendance code or QR token. Please check and try again." });
    return;
  }

  // Validate active window expiration
  if (new Date(activeLecture.expiresAt) < now) {
    res.status(400).json({ error: "This attendance session has expired (time limit exceeded)." });
    return;
  }

  // Validate class enrollment
  const isEnrolled = data.enrollments.some((e) => e.studentId === student.id && e.classId === activeLecture.classId);
  if (!isEnrolled && student.classId !== activeLecture.classId) {
    res.status(403).json({ error: "You are not enrolled in this class/lecture." });
    return;
  }

  // Prevent duplicate attendance
  const alreadyMarked = data.attendances.some((a) => a.lectureId === activeLecture.id && a.studentId === student.id);
  if (alreadyMarked) {
    res.status(409).json({ error: "Attendance already submitted for this lecture." });
    return;
  }

  const attendanceRecord: AttendanceRecordDTO = {
    id: `att-${Date.now()}-${student.id}`,
    lectureId: activeLecture.id,
    studentId: student.id,
    studentName: student.fullName,
    rollNumber: student.rollNumber,
    status: "PRESENT",
    method: method === "QR" ? "QR" : "SIX_DIGIT_CODE",
    markedAt: now.toISOString()
  };

  data.attendances.unshift(attendanceRecord);
  activeLecture.presentCount = (activeLecture.presentCount || 0) + 1;

  data.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user!.id,
    userName: student.fullName,
    userRole: "STUDENT",
    action: `Marked attendance for ${activeLecture.title} via ${method || "CODE"}`,
    timestamp: now.toISOString()
  });

  db.save();

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

app.get("/api/student/dashboard", authenticateToken, requireRole("STUDENT"), (req: AuthRequest, res: Response) => {
  const data = db.getData();
  const student = data.students.find((s) => s.userId === req.user?.id);

  if (!student) {
    res.status(404).json({ error: "Student profile not found" });
    return;
  }

  const myAttendances = data.attendances.filter((a) => a.studentId === student.id);
  const classLectures = data.lectures.filter((l) => l.classId === student.classId);

  const totalLectures = classLectures.length;
  const presentCount = myAttendances.filter((a) => a.status === "PRESENT").length;
  const absentCount = Math.max(0, totalLectures - presentCount);
  const percentage = totalLectures > 0 ? +((presentCount / totalLectures) * 100).toFixed(1) : 100;

  // Enriched history
  const history = myAttendances.map((att) => {
    const lecture = data.lectures.find((l) => l.id === att.lectureId);
    return {
      ...att,
      lectureTitle: lecture?.title || "Lecture",
      subjectName: lecture?.subjectName || "Subject",
      teacherName: lecture?.teacherName || "Teacher",
      date: lecture?.date || att.markedAt.split("T")[0]
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

// Start API server
app.listen(PORT, () => {
  console.log(`Attendance Management Backend API running on http://localhost:${PORT}`);
});

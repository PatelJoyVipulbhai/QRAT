import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import {
  Role,
  AttendanceMethod,
  AttendanceStatus,
  UserDTO,
  AdminDTO,
  TeacherDTO,
  StudentDTO,
  ClassDTO,
  BatchDTO,
  SubjectDTO,
  LectureDTO,
  AttendanceRecordDTO,
  AuditLogDTO,
  PhotoDetectionResultDTO
} from "../../shared/types";

export interface DBStore {
  users: Array<{ id: string; email: string; passwordHash: string; role: Role; createdAt: string }>;
  admins: AdminDTO[];
  teachers: TeacherDTO[];
  students: StudentDTO[];
  classes: ClassDTO[];
  batches: BatchDTO[];
  subjects: SubjectDTO[];
  enrollments: Array<{ id: string; studentId: string; classId: string; batchId?: string }>;
  teacherSubjects: Array<{ id: string; teacherId: string; subjectId: string }>;
  lectures: LectureDTO[];
  attendances: AttendanceRecordDTO[];
  auditLogs: AuditLogDTO[];
}

const DB_FILE = path.join(process.cwd(), "server", "data.json");

export class DatabaseStore {
  private static instance: DatabaseStore;
  private data: DBStore;

  private constructor() {
    this.data = this.load();
    if (this.data.users.length === 0) {
      this.seedInitialData();
    }
  }

  public static getInstance(): DatabaseStore {
    if (!DatabaseStore.instance) {
      DatabaseStore.instance = new DatabaseStore();
    }
    return DatabaseStore.instance;
  }

  private load(): DBStore {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(content);
      }
    } catch (e) {
      console.warn("Could not load database file, creating fresh store:", e);
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

  public save(): void {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving database file:", e);
    }
  }

  public getData(): DBStore {
    return this.data;
  }

  public async seedInitialData(): Promise<void> {
    console.log("Seeding DatabaseStore with initial demo accounts...");
    const defaultPasswordHash = bcrypt.hashSync("Password@123", 10);

    // 1. Admin
    const adminUserId = "usr-admin-1";
    this.data.users.push({
      id: adminUserId,
      email: "admin@attendance.edu",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      createdAt: new Date().toISOString()
    });
    this.data.admins.push({
      id: "adm-1",
      userId: adminUserId,
      fullName: "System Administrator",
      phone: "+1 555-0199"
    });

    // 2. Classes & Batches
    const classBBA1: ClassDTO = {
      id: "cls-bba-1",
      name: "BBA Semester 1",
      code: "BBA-S1",
      department: "Management",
      semester: "Semester 1",
      totalStudents: 12
    };
    const classBCA1: ClassDTO = {
      id: "cls-bca-1",
      name: "BCA Semester 1",
      code: "BCA-S1",
      department: "Computer Applications",
      semester: "Semester 1",
      totalStudents: 8
    };
    this.data.classes.push(classBBA1, classBCA1);

    const batchBBA1_A: BatchDTO = { id: "bat-bba1-a", name: "Division A", classId: classBBA1.id };
    const batchBBA1_B: BatchDTO = { id: "bat-bba1-b", name: "Division B", classId: classBBA1.id };
    const batchBCA1_A: BatchDTO = { id: "bat-bca1-a", name: "Division A", classId: classBCA1.id };
    this.data.batches.push(batchBBA1_A, batchBBA1_B, batchBCA1_A);

    // 3. Subjects
    const subEconomics: SubjectDTO = { id: "sub-101", name: "Economics & Market Analysis", code: "ECO-101", department: "Management" };
    const subAccounts: SubjectDTO = { id: "sub-102", name: "Financial Accounting", code: "ACC-102", department: "Management" };
    const subCS: SubjectDTO = { id: "sub-103", name: "Programming in TypeScript & C", code: "BCA-101", department: "Computer Applications" };
    this.data.subjects.push(subEconomics, subAccounts, subCS);

    // 4. Teachers
    const teacherUsers = [
      { id: "usr-tch-1", tchId: "tch-1", teacherId: "FAC-1001", name: "Prof. Rajesh Shah", email: "prof.shah@attendance.edu", dept: "Management", subId: subEconomics.id },
      { id: "usr-tch-2", tchId: "tch-2", teacherId: "FAC-1002", name: "Dr. Ananya Patel", email: "prof.patel@attendance.edu", dept: "Management", subId: subAccounts.id },
      { id: "usr-tch-3", tchId: "tch-3", teacherId: "FAC-1003", name: "Prof. Vikram Mehta", email: "prof.mehta@attendance.edu", dept: "Computer Applications", subId: subCS.id },
    ];

    teacherUsers.forEach(t => {
      this.data.users.push({
        id: t.id,
        email: t.email,
        passwordHash: defaultPasswordHash,
        role: "TEACHER",
        createdAt: new Date().toISOString()
      });
      this.data.teachers.push({
        id: t.tchId,
        userId: t.id,
        teacherId: t.teacherId,
        fullName: t.name,
        email: t.email,
        phone: "+1 555-0100",
        department: t.dept,
        status: "Active"
      });
      this.data.teacherSubjects.push({
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

      this.data.users.push({
        id: sUserId,
        email,
        passwordHash: defaultPasswordHash,
        role: "STUDENT",
        createdAt: new Date().toISOString()
      });

      this.data.students.push({
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

      this.data.enrollments.push({
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

    this.data.lectures.push({
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
      const student = this.data.students[j];
      this.data.attendances.push({
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

    this.save();
    console.log("Database successfully seeded!");
  }
}

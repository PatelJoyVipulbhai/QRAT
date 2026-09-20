import { 
  UserDTO, 
  Role, 
  ClassDTO, 
  SubjectDTO, 
  StudentDTO, 
  TeacherDTO, 
  LectureDTO, 
  AttendanceRecordDTO 
} from "../types";

const BASE_URL = (import.meta as any).env?.VITE_API_URL || (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api");

// ----------------------------------------------------
// DEFAULT SEED STATE FOR STANDALONE / VERCEL DEMO MODE
// ----------------------------------------------------
const STORAGE_KEY = "qrat_demo_store_v1";

interface DemoStore {
  users: UserDTO[];
  classes: ClassDTO[];
  subjects: SubjectDTO[];
  teachers: TeacherDTO[];
  students: StudentDTO[];
  lectures: LectureDTO[];
  attendances: AttendanceRecordDTO[];
}

function initializeStore(): DemoStore {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      // ignore
    }
  }

  const defaultClasses: ClassDTO[] = [
    {
      id: "cls-1",
      name: "BBA Semester 1",
      code: "BBA-S1",
      department: "Management",
      semester: "Semester 1",
      totalStudents: 12,
      batches: [
        { id: "bat-1", name: "Division A", classId: "cls-1" },
        { id: "bat-2", name: "Division B", classId: "cls-1" }
      ]
    },
    {
      id: "cls-2",
      name: "BBA Semester 2",
      code: "BBA-S2",
      department: "Management",
      semester: "Semester 2",
      totalStudents: 8,
      batches: [
        { id: "bat-3", name: "Division A", classId: "cls-2" }
      ]
    },
    {
      id: "cls-3",
      name: "BCA Semester 1",
      code: "BCA-S1",
      department: "Computer Applications",
      semester: "Semester 1",
      totalStudents: 8,
      batches: [
        { id: "bat-4", name: "Division A", classId: "cls-3" },
        { id: "bat-5", name: "Division B", classId: "cls-3" }
      ]
    }
  ];

  const defaultSubjects: SubjectDTO[] = [
    { id: "sub-1", name: "Economics & Market Analysis", code: "ECO-101", department: "Management" },
    { id: "sub-2", name: "Financial Accounting", code: "ACC-102", department: "Management" },
    { id: "sub-3", name: "Principles of Marketing", code: "MKT-103", department: "Management" },
    { id: "sub-4", name: "Computer Fundamentals & C", code: "BCA-101", department: "Computer Applications" },
    { id: "sub-5", name: "Discrete Mathematics", code: "MTH-102", department: "Computer Applications" }
  ];

  const defaultTeachers: TeacherDTO[] = [
    {
      id: "tch-1",
      userId: "u-tch-1",
      teacherId: "FAC-1001",
      fullName: "Prof. Rajesh Shah",
      email: "prof.shah@attendance.edu",
      phone: "+1 555-0111",
      department: "Management",
      status: "Active",
      assignedSubjects: [defaultSubjects[0]]
    },
    {
      id: "tch-2",
      userId: "u-tch-2",
      teacherId: "FAC-1002",
      fullName: "Dr. Ananya Patel",
      email: "prof.patel@attendance.edu",
      phone: "+1 555-0112",
      department: "Management",
      status: "Active",
      assignedSubjects: [defaultSubjects[1], defaultSubjects[2]]
    },
    {
      id: "tch-3",
      userId: "u-tch-3",
      teacherId: "FAC-1003",
      fullName: "Prof. Vikram Mehta",
      email: "prof.mehta@attendance.edu",
      phone: "+1 555-0113",
      department: "Computer Applications",
      status: "Active",
      assignedSubjects: [defaultSubjects[3], defaultSubjects[4]]
    }
  ];

  const studentNames = [
    "Rahul Patel", "Jay Shah", "Dev Patel", "Amit Shah", "Pooja Sharma",
    "Rohan Verma", "Sneha Joshi", "Aditya Nair", "Kavita Rao", "Manish Gupta",
    "Priya Deshmukh", "Karan Malhotra", "Riya Sen", "Deepak Chopra", "Neha Bansal",
    "Siddharth Roy", "Anjali Mehta", "Varun Dhawan", "Divya Pillai", "Harsh Vardhan"
  ];

  const defaultStudents: StudentDTO[] = studentNames.map((name, i) => {
    const rollNo = (101 + i).toString();
    const assignedClass = i < 12 ? defaultClasses[0] : defaultClasses[2];
    const assignedBatch = assignedClass.batches ? assignedClass.batches[i % assignedClass.batches.length] : undefined;
    return {
      id: `stu-${rollNo}`,
      userId: `u-stu-${rollNo}`,
      studentId: `STU-2026-${rollNo}`,
      rollNumber: rollNo,
      fullName: name,
      email: `student${rollNo}@attendance.edu`,
      phone: `+1 555-02${i < 10 ? "0" + i : i}`,
      classId: assignedClass.id,
      className: assignedClass.name,
      batchId: assignedBatch?.id,
      batchName: assignedBatch?.name,
      department: assignedClass.department,
      semester: assignedClass.semester,
      faceConsentGiven: true,
      faceEnrolled: i % 2 === 0,
      status: "Active"
    };
  });

  const now = new Date();
  const defaultLectures: LectureDTO[] = [
    {
      id: "lec-active-1",
      teacherId: defaultTeachers[0].id,
      teacherName: defaultTeachers[0].fullName,
      classId: defaultClasses[0].id,
      className: defaultClasses[0].name,
      batchId: defaultClasses[0].batches?.[0].id,
      batchName: defaultClasses[0].batches?.[0].name,
      subjectId: defaultSubjects[0].id,
      subjectName: defaultSubjects[0].name,
      title: "Demand & Supply Elasticity",
      date: now.toISOString().split("T")[0],
      startTime: "10:00 AM",
      endTime: "11:00 AM",
      attendanceDurationMinutes: 10,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
      status: "ACTIVE",
      currentCode: "482731",
      qrToken: "sec-token-eco-482731",
      totalEnrolledStudents: 12,
      presentCount: 5,
      absentCount: 7
    }
  ];

  const defaultAttendances: AttendanceRecordDTO[] = defaultStudents.slice(0, 5).map((stu, idx) => ({
    id: `att-${idx + 1}`,
    lectureId: defaultLectures[0].id,
    studentId: stu.id,
    studentName: stu.fullName,
    rollNumber: stu.rollNumber,
    status: "PRESENT",
    method: idx % 2 === 0 ? "QR" : "SIX_DIGIT_CODE",
    markedAt: new Date(now.getTime() - (5 - idx) * 60 * 1000).toISOString(),
    lectureTitle: defaultLectures[0].title,
    subjectName: defaultLectures[0].subjectName,
    teacherName: defaultLectures[0].teacherName,
    date: defaultLectures[0].date
  }));

  const defaultUsers: UserDTO[] = [
    {
      id: "u-admin-1",
      email: "admin@attendance.edu",
      role: "ADMIN",
      createdAt: now.toISOString(),
      admin: {
        id: "adm-1",
        userId: "u-admin-1",
        fullName: "System Administrator",
        phone: "+1 555-0199"
      }
    },
    ...defaultTeachers.map(t => ({
      id: t.userId,
      email: t.email,
      role: "TEACHER" as Role,
      createdAt: now.toISOString(),
      teacher: t
    })),
    ...defaultStudents.map(s => ({
      id: s.userId,
      email: s.email,
      role: "STUDENT" as Role,
      createdAt: now.toISOString(),
      student: s
    }))
  ];

  const initial: DemoStore = {
    users: defaultUsers,
    classes: defaultClasses,
    subjects: defaultSubjects,
    teachers: defaultTeachers,
    students: defaultStudents,
    lectures: defaultLectures,
    attendances: defaultAttendances
  };

  saveStore(initial);
  return initial;
}

function getStore(): DemoStore {
  return initializeStore();
}

function saveStore(store: DemoStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

// ----------------------------------------------------
// CLIENT MOCK / OFFLINE FALLBACK ROUTER
// ----------------------------------------------------
function handleMockRequest(endpoint: string, options: RequestInit): any {
  const store = getStore();
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};
  const currentToken = localStorage.getItem("auth_token") || "mock-jwt-token";

  // 1. Auth Login
  if (endpoint === "/auth/login" && method === "POST") {
    const { email, role } = body;
    let targetUser = store.users.find(u => u.email.toLowerCase() === (email || "").toLowerCase().trim());

    if (!targetUser) {
      // Create on-the-fly demo user
      const id = "u-" + Math.random().toString(36).substring(7);
      const userRole = (role || (email.includes("admin") ? "ADMIN" : email.includes("prof") ? "TEACHER" : "STUDENT")) as Role;
      targetUser = {
        id,
        email: email.trim(),
        role: userRole,
        createdAt: new Date().toISOString(),
      };
      if (userRole === "ADMIN") {
        targetUser.admin = { id: "adm-" + id, userId: id, fullName: "Administrator" };
      } else if (userRole === "TEACHER") {
        targetUser.teacher = {
          id: "tch-" + id,
          userId: id,
          teacherId: "FAC-9999",
          fullName: "Faculty Professor",
          email: email.trim(),
          department: "Management",
          status: "Active",
          assignedSubjects: store.subjects.slice(0, 2)
        };
      } else {
        targetUser.student = {
          id: "stu-" + id,
          userId: id,
          studentId: "STU-DEMO-99",
          rollNumber: "999",
          fullName: "Student Member",
          email: email.trim(),
          classId: store.classes[0]?.id || "cls-1",
          className: store.classes[0]?.name || "BBA Semester 1",
          department: "Management",
          semester: "Semester 1",
          faceConsentGiven: true,
          faceEnrolled: false,
          status: "Active"
        };
      }
      store.users.push(targetUser);
      saveStore(store);
    }

    return { token: `jwt-demo-${targetUser.id}`, user: targetUser };
  }

  // 2. Current User Profile
  if (endpoint === "/auth/me") {
    const activeEmail = localStorage.getItem("last_active_email") || "admin@attendance.edu";
    const found = store.users.find(u => u.email.toLowerCase() === activeEmail.toLowerCase()) || store.users[0];
    return found;
  }

  // 3. Admin Metrics
  if (endpoint === "/admin/metrics") {
    return {
      totalStudents: store.students.length,
      totalTeachers: store.teachers.length,
      totalClasses: store.classes.length,
      totalLectures: store.lectures.length,
      averageAttendanceRate: 88.5,
      activeLecturesCount: store.lectures.filter(l => l.status === "ACTIVE").length
    };
  }

  // 4. Admin CRUD
  if (endpoint === "/admin/classes") {
    if (method === "POST") {
      const newClass: ClassDTO = {
        id: "cls-" + Date.now(),
        name: body.name,
        code: body.code || `CLS-${Date.now().toString().slice(-4)}`,
        department: body.department,
        semester: body.semester,
        batches: []
      };
      store.classes.push(newClass);
      saveStore(store);
      return newClass;
    }
    return store.classes;
  }

  if (endpoint === "/admin/subjects") {
    if (method === "POST") {
      const newSubject: SubjectDTO = {
        id: "sub-" + Date.now(),
        name: body.name,
        code: body.code || `SUB-${Date.now().toString().slice(-4)}`,
        department: body.department
      };
      store.subjects.push(newSubject);
      saveStore(store);
      return newSubject;
    }
    return store.subjects;
  }

  if (endpoint === "/admin/teachers") {
    if (method === "POST") {
      const newTeacher: TeacherDTO = {
        id: "tch-" + Date.now(),
        userId: "u-tch-" + Date.now(),
        teacherId: body.teacherId || `FAC-${Date.now().toString().slice(-4)}`,
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        department: body.department,
        status: "Active"
      };
      store.teachers.push(newTeacher);
      saveStore(store);
      return newTeacher;
    }
    return store.teachers;
  }

  if (endpoint === "/admin/students") {
    if (method === "POST") {
      const cls = store.classes.find(c => c.id === body.classId);
      const batch = cls?.batches?.find(b => b.id === body.batchId);
      const newStudent: StudentDTO = {
        id: "stu-" + Date.now(),
        userId: "u-stu-" + Date.now(),
        studentId: body.studentId || `STU-${Date.now().toString().slice(-4)}`,
        rollNumber: body.rollNumber || (100 + store.students.length + 1).toString(),
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        classId: body.classId,
        className: cls?.name,
        batchId: body.batchId,
        batchName: batch?.name,
        department: cls?.department || "General",
        semester: cls?.semester || "Semester 1",
        faceConsentGiven: true,
        faceEnrolled: false,
        status: "Active"
      };
      store.students.push(newStudent);
      saveStore(store);
      return newStudent;
    }
    return store.students;
  }

  // 5. Teacher Dashboard
  if (endpoint === "/teacher/dashboard") {
    return {
      activeLectures: store.lectures.filter(l => l.status === "ACTIVE"),
      upcomingLectures: store.lectures.filter(l => l.status === "SCHEDULED"),
      pastLectures: store.lectures.filter(l => l.status === "CLOSED"),
      stats: {
        totalLecturesConducted: store.lectures.length,
        averageAttendancePercentage: 86.4,
        totalEnrolledStudents: store.students.length
      }
    };
  }

  // 6. Student Dashboard
  if (endpoint === "/student/dashboard") {
    return {
      enrolledClasses: store.classes.slice(0, 2),
      activeLecturesToMark: store.lectures.filter(l => l.status === "ACTIVE"),
      attendanceHistory: store.attendances,
      overallAttendancePercentage: 91.2,
      totalClassesAttended: store.attendances.length,
      totalClassesConducted: 20
    };
  }

  // 7. Lecture Details & Creation
  if (endpoint.startsWith("/lectures/") && method === "GET") {
    const lectureId = endpoint.split("/")[2];
    const lecture = store.lectures.find(l => l.id === lectureId) || store.lectures[0];
    const lectureAttendances = store.attendances.filter(a => a.lectureId === lecture?.id);
    return {
      ...lecture,
      presentCount: lectureAttendances.length,
      attendances: lectureAttendances,
      enrolledStudents: store.students.filter(s => s.classId === lecture?.classId)
    };
  }

  if (endpoint === "/lectures" && method === "POST") {
    const cls = store.classes.find(c => c.id === body.classId);
    const sub = store.subjects.find(s => s.id === body.subjectId);
    const duration = Number(body.attendanceDurationMinutes) || 10;
    const nowTime = new Date();
    const expiresAt = new Date(nowTime.getTime() + duration * 60 * 1000).toISOString();
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const newLecture: LectureDTO = {
      id: "lec-" + Date.now(),
      teacherId: body.teacherId || store.teachers[0].id,
      teacherName: store.teachers[0].fullName,
      classId: body.classId,
      className: cls?.name || "Class",
      batchId: body.batchId,
      batchName: cls?.batches?.find(b => b.id === body.batchId)?.name,
      subjectId: body.subjectId,
      subjectName: sub?.name || "Subject",
      title: body.title || `${sub?.name || "Lecture"} Session`,
      date: body.date || nowTime.toISOString().split("T")[0],
      startTime: body.startTime || "10:00 AM",
      endTime: body.endTime || "11:00 AM",
      attendanceDurationMinutes: duration,
      expiresAt,
      status: "ACTIVE",
      currentCode: code,
      qrToken: `sec-token-${code}`,
      totalEnrolledStudents: store.students.filter(s => s.classId === body.classId).length || 12,
      presentCount: 0,
      absentCount: 12
    };

    store.lectures.unshift(newLecture);
    saveStore(store);
    return newLecture;
  }

  // 8. Regenerate Code & Close Lecture
  if (endpoint.includes("/regenerate-code") && method === "POST") {
    const lectureId = endpoint.split("/")[2];
    const lecture = store.lectures.find(l => l.id === lectureId);
    if (lecture) {
      lecture.currentCode = Math.floor(100000 + Math.random() * 900000).toString();
      lecture.qrToken = `sec-token-${lecture.currentCode}`;
      saveStore(store);
      return lecture;
    }
  }

  if (endpoint.includes("/close") && method === "POST") {
    const lectureId = endpoint.split("/")[2];
    const lecture = store.lectures.find(l => l.id === lectureId);
    if (lecture) {
      lecture.status = "CLOSED";
      saveStore(store);
      return lecture;
    }
  }

  // 9. Attendance Submission (QR / Code)
  if (endpoint === "/attendance/submit" && method === "POST") {
    const { code, qrToken, method: attMethod } = body;
    const activeLec = store.lectures.find(l => 
      l.status === "ACTIVE" && (l.currentCode === code || l.qrToken === qrToken || code === "482731")
    ) || store.lectures.find(l => l.status === "ACTIVE");

    if (!activeLec) {
      throw new Error("Invalid or expired attendance session/code.");
    }

    const student = store.students[0];
    const newRecord: AttendanceRecordDTO = {
      id: "att-" + Date.now(),
      lectureId: activeLec.id,
      studentId: student.id,
      studentName: student.fullName,
      rollNumber: student.rollNumber,
      status: "PRESENT",
      method: attMethod || "SIX_DIGIT_CODE",
      markedAt: new Date().toISOString(),
      lectureTitle: activeLec.title,
      subjectName: activeLec.subjectName,
      teacherName: activeLec.teacherName,
      date: activeLec.date
    };

    // Avoid duplicates
    if (!store.attendances.some(a => a.lectureId === activeLec.id && a.studentId === student.id)) {
      store.attendances.push(newRecord);
      if (activeLec.presentCount !== undefined) activeLec.presentCount += 1;
      saveStore(store);
    }

    return {
      message: "Attendance successfully recorded!",
      attendance: newRecord,
      lecture: activeLec
    };
  }

  // 10. Photo Attendance Analysis
  if (endpoint.includes("/analyze-photos") && method === "POST") {
    const lectureId = endpoint.split("/")[2];
    const lecture = store.lectures.find(l => l.id === lectureId);
    const students = store.students.filter(s => s.classId === lecture?.classId || true).slice(0, 10);

    const matches = students.map((s, idx) => {
      const conf = Number((0.85 + Math.random() * 0.14).toFixed(2));
      return {
        studentId: s.id,
        rollNumber: s.rollNumber,
        fullName: s.fullName,
        profilePhoto: s.profilePhoto,
        confidence: conf,
        matchStatus: conf >= 0.88 ? "HIGH_CONFIDENCE" : "NEEDS_REVIEW",
        detectedInPhotos: [1],
        finalStatus: "PRESENT" as const
      };
    });

    return {
      detectedFacesCount: matches.length,
      matchedStudents: matches
    };
  }

  // 11. Finalize Photo Attendance
  if (endpoint.includes("/finalize-photo-attendance") && method === "POST") {
    const lectureId = endpoint.split("/")[2];
    const { confirmedAttendances } = body;
    if (Array.isArray(confirmedAttendances)) {
      confirmedAttendances.forEach((item: any) => {
        const student = store.students.find(s => s.id === item.studentId);
        if (student && !store.attendances.some(a => a.lectureId === lectureId && a.studentId === student.id)) {
          store.attendances.push({
            id: "att-" + Date.now() + Math.random(),
            lectureId,
            studentId: student.id,
            studentName: student.fullName,
            rollNumber: student.rollNumber,
            status: item.status || "PRESENT",
            method: "PHOTO",
            markedAt: new Date().toISOString(),
            confidence: item.confidence
          });
        }
      });
      saveStore(store);
    }
    return { success: true, count: confirmedAttendances?.length || 0 };
  }

  // 12. Student Face Enrollment
  if (endpoint === "/student/enroll-face" && method === "POST") {
    const { studentId, faceDescriptor } = body;
    const student = store.students.find(s => s.id === studentId) || store.students[0];
    student.faceEnrolled = true;
    student.faceEnrolledAt = new Date().toISOString();
    saveStore(store);
    return { message: "Face descriptor successfully enrolled and verified!", student };
  }

  // Default fallback empty object
  return { success: true };
}

// ----------------------------------------------------
// MAIN API REQUEST FUNCTION
// ----------------------------------------------------
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Track email for user session
  if (endpoint === "/auth/login" && options.body) {
    try {
      const parsed = JSON.parse(options.body as string);
      if (parsed.email) localStorage.setItem("last_active_email", parsed.email);
    } catch {
      // ignore
    }
  }

  // Attempt real API call first
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.ok) {
      return await response.json();
    }
    
    // If backend returns specific client/server error, parse it
    const data = await response.json().catch(() => null);
    if (response.status === 401 || response.status === 400 || response.status === 404) {
      throw new Error(data?.error || `Request failed with status ${response.status}`);
    }
  } catch (err: any) {
    // If it's a specific API rejection (e.g. invalid credentials with real backend), rethrow
    if (err?.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError") && !err.message.includes("failed to fetch")) {
      // If error is not a network failure, throw directly
      if (err.message.includes("Request failed with status")) {
        throw err;
      }
    }
    // Fall back to built-in Mock / Offline store seamlessly
    console.info(`[QRAT Offline/Demo Mode] Serving mock data for ${endpoint}`);
  }

  // Mock / Standalone execution
  return handleMockRequest(endpoint, options) as T;
}

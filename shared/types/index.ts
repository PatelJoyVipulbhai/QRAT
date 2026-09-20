export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export type AttendanceMethod = 'QR' | 'SIX_DIGIT_CODE' | 'PHOTO' | 'MANUAL';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type MatchConfidenceStatus = 'HIGH_CONFIDENCE' | 'NEEDS_REVIEW' | 'NOT_DETECTED';

export interface UserDTO {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  admin?: AdminDTO;
  teacher?: TeacherDTO;
  student?: StudentDTO;
}

export interface AdminDTO {
  id: string;
  userId: string;
  fullName: string;
  phone?: string;
}

export interface TeacherDTO {
  id: string;
  userId: string;
  teacherId: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  status: 'Active' | 'Inactive';
  assignedClasses?: ClassDTO[];
  assignedSubjects?: SubjectDTO[];
}

export interface StudentDTO {
  id: string;
  userId: string;
  studentId: string;
  rollNumber: string;
  fullName: string;
  email: string;
  phone?: string;
  classId: string;
  batchId?: string;
  department: string;
  semester: string;
  profilePhoto?: string;
  faceConsentGiven: boolean;
  status: 'Active' | 'Inactive';
  className?: string;
  batchName?: string;
}

export interface ClassDTO {
  id: string;
  name: string; // e.g. "BBA Sem 1"
  code: string;
  department: string;
  semester: string;
  totalStudents?: number;
  batches?: BatchDTO[];
  subjects?: SubjectDTO[];
}

export interface BatchDTO {
  id: string;
  name: string; // e.g. "Division A"
  classId: string;
}

export interface SubjectDTO {
  id: string;
  name: string;
  code: string;
  department: string;
}

export interface LectureDTO {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  batchId?: string;
  batchName?: string;
  subjectId: string;
  subjectName: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  attendanceDurationMinutes: number;
  expiresAt: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'CLOSED';
  currentCode?: string;
  qrToken?: string;
  totalEnrolledStudents?: number;
  presentCount?: number;
  absentCount?: number;
}

export interface AttendanceRecordDTO {
  id: string;
  lectureId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  markedAt: string;
  confidence?: number;
  note?: string;
}

export interface PhotoDetectionResultDTO {
  studentId: string;
  rollNumber: string;
  fullName: string;
  profilePhoto?: string;
  confidence: number; // 0.00 to 1.00
  matchStatus: MatchConfidenceStatus;
  detectedInPhotos: number[];
  finalStatus: AttendanceStatus;
}

export interface AuditLogDTO {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  details?: string;
  timestamp: string;
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
}

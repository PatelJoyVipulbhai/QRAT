import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { CheckCircle, QrCode, TrendingUp, Calendar, Clock, BookOpen, Camera, ShieldCheck, Sparkles } from "lucide-react";
import { AttendanceRecordDTO, StudentDTO } from "../types";
import { StudentFaceEnrollmentModal } from "../components/StudentFaceEnrollmentModal";

export const StudentDashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFaceEnrollment, setShowFaceEnrollment] = useState(false);

  const loadStudentDashboard = async () => {
    try {
      const res = await apiRequest("/student/dashboard");
      setData(res);
      // If student hasn't enrolled face data yet, prompt them automatically on 1st time login
      if (res?.student && !res.student.faceEnrolled && !res.student.facePhoto) {
        setShowFaceEnrollment(true);
      }
    } catch (e) {
      console.error("Student dashboard error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudentDashboard();
  }, []);

  const handleFaceEnrollmentSuccess = (updatedStudent: StudentDTO) => {
    setData((prev: any) => ({
      ...prev,
      student: updatedStudent,
    }));
    if (user) {
      updateUser({
        ...user,
        student: updatedStudent,
      });
    }
    setShowFaceEnrollment(false);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Loading student portal...</div>;
  }

  const student: StudentDTO = data?.student;
  const stats = data?.stats;
  const history: AttendanceRecordDTO[] = data?.history || [];

  const isFaceEnrolled = !!(student?.faceEnrolled || student?.facePhoto);

  return (
    <div className="space-y-6">
      {/* Student Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Hi, {student?.fullName} 👋
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {student?.className} • Roll Number: <span className="font-bold text-slate-700 dark:text-slate-300">{student?.rollNumber}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFaceEnrollment(true)}
            className={`font-bold text-xs px-4 py-3 rounded-2xl flex items-center space-x-2 border transition-all ${
              isFaceEnrolled
                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                : "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 animate-pulse"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{isFaceEnrolled ? "Update Face ID" : "Register Face ID"}</span>
          </button>

          <Link
            to="/student/mark"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-6 py-3 rounded-2xl flex items-center space-x-2 shadow-lg shadow-emerald-600/25 transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Mark Attendance Now</span>
          </Link>
        </div>
      </div>

      {/* Face ID Status Card */}
      <div className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
        isFaceEnrolled
          ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
          : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 shadow-sm"
      }`}>
        <div className="flex items-center space-x-4">
          <div className="relative">
            {student?.facePhoto ? (
              <img
                src={student.facePhoto}
                alt={student.fullName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <Camera className="w-6 h-6" />
              </div>
            )}
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
              isFaceEnrolled ? "bg-emerald-500" : "bg-amber-500"
            }`} />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Biometric Face ID Status
              </h4>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                isFaceEnrolled
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}>
                {isFaceEnrolled ? "🟢 Active & Enrolled" : "⚠️ Enrollment Needed"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isFaceEnrolled
                ? "Your face biometric signature is active for automatic classroom visual attendance."
                : "Please complete your one-time face photo capture so teachers can verify your visual attendance."}
            </p>
          </div>
        </div>

        {!isFaceEnrolled && (
          <button
            onClick={() => setShowFaceEnrollment(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow transition-all self-start sm:self-auto"
          >
            Complete Face Enrollment
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Overall Attendance
          </span>
          <p className="text-3xl font-black text-emerald-600 mt-1">
            {stats?.overallPercentage}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Classroom average</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Lectures Attended
          </span>
          <p className="text-3xl font-black text-indigo-600 mt-1">{stats?.present}</p>
          <p className="text-[11px] text-slate-400 mt-1">Present mark verified</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Missed Classes
          </span>
          <p className="text-3xl font-black text-rose-500 mt-1">{stats?.absent}</p>
          <p className="text-[11px] text-slate-400 mt-1">Absences</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Total Sessions
          </span>
          <p className="text-3xl font-black text-slate-700 dark:text-slate-300 mt-1">
            {stats?.totalLectures}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Completed lectures</p>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="text-lg font-black tracking-tight">Recent Attendance Records</h3>
            <p className="text-xs text-slate-400">Authenticated presence receipts</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No attendance records yet. Click "Mark Attendance Now" to submit your first session.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-2"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 font-bold text-base">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm">{rec.subjectName}</h4>
                    <p className="text-xs text-slate-400">
                      {rec.lectureTitle} • {rec.teacherName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md">
                    Method: {rec.method}
                  </span>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {new Date(rec.markedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-[10px] text-slate-400">{rec.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1st-Time / Onboarding Face Enrollment Modal */}
      <StudentFaceEnrollmentModal
        isOpen={showFaceEnrollment}
        onSuccess={handleFaceEnrollmentSuccess}
        onClose={() => setShowFaceEnrollment(false)}
        isMandatory={!isFaceEnrolled}
      />
    </div>
  );
};

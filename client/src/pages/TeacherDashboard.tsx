import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import { QrCode, Camera, Users, Clock, CheckCircle2, AlertCircle, ArrowRight, Play } from "lucide-react";
import { LectureDTO } from "../types";

export const TeacherDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await apiRequest("/teacher/dashboard");
      setData(res);
    } catch (e) {
      console.error("Teacher dashboard load error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Loading teacher dashboard...</div>;
  }

  const activeLecture = data?.activeLecture;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {data?.teacher?.fullName}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {data?.teacher?.department} • Faculty ID: {data?.teacher?.teacherId}
          </p>
        </div>

        <div className="flex space-x-3">
          <Link
            to="/teacher/create-lecture"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center space-x-2 shadow-md shadow-indigo-600/20"
          >
            <QrCode className="w-4 h-4" />
            <span>New Attendance QR</span>
          </Link>

          <Link
            to="/teacher/photo-attendance"
            className="bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center space-x-2"
          >
            <Camera className="w-4 h-4" />
            <span>Photo Attendance</span>
          </Link>
        </div>
      </div>

      {/* Active Lecture Spotlight Card (If any) */}
      {activeLecture && (
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-indigo-600/30 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <span className="bg-white/20 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full">
                🟢 Session Broadcast Active
              </span>
              <h3 className="text-2xl sm:text-3xl font-black mt-2">{activeLecture.title}</h3>
              <p className="text-indigo-100 text-sm font-medium">
                {activeLecture.className} • {activeLecture.subjectName}
              </p>
              <p className="text-xs text-indigo-200">
                Attendance Code: <span className="font-mono font-black text-white text-lg ml-1">{activeLecture.currentCode}</span>
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-indigo-200 font-bold uppercase">Live Presence</p>
                <p className="text-3xl font-black">{activeLecture.presentCount} Students</p>
              </div>

              <Link
                to={`/teacher/active-lecture/${activeLecture.id}`}
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-black text-sm px-6 py-3.5 rounded-2xl shadow-lg flex items-center space-x-2 transition-all"
              >
                <span>Open Projector Screen</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold">Faculty Teaching Load</h3>
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold">Today's Lectures</span>
              <span className="font-extrabold text-sm">{data?.todaysLectures?.length || 0}</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold">Total Lectures Taken</span>
              <span className="font-extrabold text-sm">{data?.totalLectures || 0}</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold">Assigned Subjects</span>
              <span className="font-extrabold text-sm">{data?.assignedSubjects?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Assigned Subjects */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold mb-4">My Teaching Subjects</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data?.assignedSubjects?.map((sub: any) => (
              <div
                key={sub.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold text-sm">{sub.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{sub.code}</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                  {sub.department}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

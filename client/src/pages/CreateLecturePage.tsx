import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import { ClassDTO, SubjectDTO, LectureDTO } from "../types";
import { QrCode, Clock, BookOpen, Layers, Camera, CheckCircle2, ArrowRight } from "lucide-react";

export const CreateLecturePage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createdLecture, setCreatedLecture] = useState<LectureDTO | null>(null);

  const [form, setForm] = useState({
    classId: "",
    batchId: "",
    subjectId: "",
    title: "",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    attendanceDurationMinutes: 10,
  });

  useEffect(() => {
    async function loadFormOptions() {
      const [cList, sList] = await Promise.all([
        apiRequest<ClassDTO[]>("/admin/classes"),
        apiRequest<SubjectDTO[]>("/admin/subjects"),
      ]);
      setClasses(cList);
      setSubjects(sList);
      if (cList.length > 0) {
        setForm((prev) => ({
          ...prev,
          classId: cList[0].id,
          batchId: cList[0].batches?.[0]?.id || "",
          subjectId: sList[0]?.id || "",
        }));
      }
    }
    loadFormOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newLecture = await apiRequest<LectureDTO>("/lectures", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setCreatedLecture(newLecture);
    } catch (err: any) {
      alert(err.message || "Failed to create lecture session");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === form.classId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Create Attendance Session</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Generate a dynamic, time-limited QR code & 6-digit attendance code for your classroom.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Class Selector */}
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 uppercase text-[10px] tracking-wider">
              Target Class
            </label>
            <select
              value={form.classId}
              onChange={(e) => {
                const cId = e.target.value;
                const cls = classes.find((c) => c.id === cId);
                setForm({
                  ...form,
                  classId: cId,
                  batchId: cls?.batches?.[0]?.id || "",
                });
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.department})
                </option>
              ))}
            </select>
          </div>

          {/* Batch Selector */}
          {selectedClass?.batches && selectedClass.batches.length > 0 && (
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 uppercase text-[10px] tracking-wider">
                Batch / Division
              </label>
              <select
                value={form.batchId}
                onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm"
              >
                {selectedClass.batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 uppercase text-[10px] tracking-wider">
              Subject
            </label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Lecture Topic */}
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 uppercase text-[10px] tracking-wider">
              Lecture Topic / Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chapter 4: Market Dynamics"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm"
            />
          </div>

          {/* Timings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 uppercase text-[10px] tracking-wider">
                Start Time
              </label>
              <input
                type="text"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 uppercase text-[10px] tracking-wider">
                End Time
              </label>
              <input
                type="text"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm"
              />
            </div>
          </div>

          {/* Attendance Window */}
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-400 block mb-1.5 uppercase text-[10px] tracking-wider">
              Attendance Window (Minutes to Expire)
            </label>
            <select
              value={form.attendanceDurationMinutes}
              onChange={(e) => setForm({ ...form, attendanceDurationMinutes: Number(e.target.value) })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm"
            >
              <option value={5}>5 Minutes (Quick)</option>
              <option value={10}>10 Minutes (Standard)</option>
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
          >
            <QrCode className="w-5 h-5" />
            <span>{isLoading ? "Generating QR..." : "Generate Lecture QR & 6-Digit Code"}</span>
          </button>
        </form>
      </div>

      {/* Success Modal: Ask for Photo Attendance */}
      {createdLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
                QR Code & 6-Digit PIN Generated
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                Attendance Session is Live!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                <span className="font-bold text-slate-700 dark:text-slate-200">{createdLecture.title}</span> ({createdLecture.className})
              </p>
            </div>

            {/* Prompt Question Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-left space-y-2">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Camera className="w-4 h-4" />
                <span>Classroom Visual Verification</span>
              </div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                Would you like to run Photo Attendance for this session now?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can capture multi-angle classroom photos to automatically detect and verify student attendance alongside QR scanning.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => navigate(`/teacher/active-lecture/${createdLecture.id}?openPhoto=true`)}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Yes, Run Photo Attendance</span>
              </button>

              <button
                onClick={() => navigate(`/teacher/active-lecture/${createdLecture.id}`)}
                className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
              >
                <span>No, Open QR Projector</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

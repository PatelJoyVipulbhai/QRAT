import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api/client";
import { LectureDTO, AttendanceRecordDTO, PhotoDetectionResultDTO } from "../types";
import { Copy, RefreshCw, XCircle, CheckCircle2, Users, Clock, Camera, Upload, Check, AlertTriangle, X } from "lucide-react";
import QRCode from "qrcode";

export const ActiveLecturePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [lecture, setLecture] = useState<LectureDTO | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRecordDTO[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Integrated Photo Attendance States
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(searchParams.get("openPhoto") === "true");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photoResults, setPhotoResults] = useState<PhotoDetectionResultDTO[]>([]);
  const [isFinalized, setIsFinalized] = useState(false);

  const fetchLecture = async () => {
    if (!id) return;
    try {
      const res = await apiRequest(`/lectures/${id}`);
      setLecture(res.lecture);
      setAttendances(res.attendances);

      if (res.lecture?.qrToken) {
        const qrUrl = await QRCode.toDataURL(res.lecture.qrToken, {
          width: 360,
          margin: 2,
          color: {
            dark: "#312e81",
            light: "#ffffff",
          },
        });
        setQrDataUrl(qrUrl);
      }
    } catch (e) {
      console.error("Failed to load lecture:", e);
    }
  };

  useEffect(() => {
    fetchLecture();
    const interval = setInterval(fetchLecture, 4000); // Polling for real-time live attendance updates
    return () => clearInterval(interval);
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!lecture || lecture.status !== "ACTIVE") return;

    const calcTime = () => {
      const diff = new Date(lecture.expiresAt).getTime() - Date.now();
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calcTime());
    const timer = setInterval(() => {
      setTimeLeft(calcTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [lecture]);

  const handleCopyCode = () => {
    if (!lecture?.currentCode) return;
    navigator.clipboard.writeText(lecture.currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    if (!id) return;
    try {
      await apiRequest(`/lectures/${id}/regenerate-code`, { method: "POST" });
      fetchLecture();
    } catch (e) {
      alert("Failed to regenerate code");
    }
  };

  const handleCloseLecture = async () => {
    if (!id) return;
    const confirm = window.confirm("Are you sure you want to end attendance for this lecture?");
    if (!confirm) return;

    try {
      await apiRequest(`/lectures/${id}/close`, { method: "POST" });
      fetchLecture();
    } catch (e) {
      alert("Failed to close lecture");
    }
  };

  // Photo Attendance Handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      urls.push(URL.createObjectURL(files[i]));
    }
    setUploadedPhotos((prev) => [...prev, ...urls]);
  };

  const handleSimulateDefaultClassroomPhotos = () => {
    setUploadedPhotos([
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80"
    ]);
  };

  const handleAnalyzePhotos = async () => {
    if (!id) return;
    setIsAnalyzing(true);
    try {
      const res = await apiRequest(`/lectures/${id}/analyze-photos`, {
        method: "POST",
        body: JSON.stringify({ images: uploadedPhotos }),
      });
      setPhotoResults(res.detectionResults);
    } catch (e) {
      alert("Photo analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleStudentStatus = (studentId: string) => {
    setPhotoResults((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          const nextStatus = item.finalStatus === "PRESENT" ? "ABSENT" : "PRESENT";
          return { ...item, finalStatus: nextStatus };
        }
        return item;
      })
    );
  };

  const handleFinalizeAttendance = async () => {
    if (!id) return;
    try {
      await apiRequest(`/lectures/${id}/finalize-photo-attendance`, {
        method: "POST",
        body: JSON.stringify({
          finalizedList: photoResults.map((r) => ({
            studentId: r.studentId,
            status: r.finalStatus,
            confidence: r.confidence,
          })),
        }),
      });
      setIsFinalized(true);
      fetchLecture();
      setTimeout(() => {
        setShowPhotoModal(false);
        setIsFinalized(false);
      }, 1500);
    } catch (e) {
      alert("Failed to finalize attendance");
    }
  };

  if (!lecture) {
    return <div className="p-8 text-center text-slate-400">Loading lecture projector...</div>;
  }

  const isExpired = timeLeft <= 0 || lecture.status === "CLOSED";

  const highConfidenceCount = photoResults.filter((r) => r.matchStatus === "HIGH_CONFIDENCE").length;
  const reviewCount = photoResults.filter((r) => r.matchStatus === "NEEDS_REVIEW").length;
  const absentCount = photoResults.filter((r) => r.matchStatus === "NOT_DETECTED").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">
              {lecture.className} • {lecture.subjectName}
            </span>
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
              !isExpired ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}>
              {!isExpired ? "🟢 Broadcasting Active" : "🔴 Session Closed"}
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight mt-1">{lecture.title}</h2>
        </div>

        <div className="flex items-center space-x-3">
          {/* Integrated Photo Attendance Button */}
          <button
            onClick={() => setShowPhotoModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center space-x-2 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Classroom Photo Attendance</span>
          </button>

          {!isExpired && (
            <button
              onClick={handleCloseLecture}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center space-x-2 shadow-sm"
            >
              <XCircle className="w-4 h-4" />
              <span>Close Lecture</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Projector Center: QR & 6-Digit Code */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Classroom Attendance QR Code
          </p>

          <div className="p-4 bg-slate-50 dark:bg-white rounded-3xl shadow-inner border border-slate-200 mb-6 relative">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Attendance QR Code"
                className={`w-64 h-64 sm:w-72 sm:h-72 object-contain transition-opacity ${
                  isExpired ? "opacity-15 grayscale" : "opacity-100"
                }`}
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-400">Generating QR...</div>
            )}

            {isExpired && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <span className="bg-rose-600 text-white font-black text-sm uppercase px-4 py-2 rounded-2xl shadow-xl">
                  Session Expired
                </span>
              </div>
            )}
          </div>

          {/* 6-Digit Code Badge */}
          <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Manual 6-Digit Code</p>
              <p className="text-3xl font-mono font-black tracking-widest text-indigo-600 dark:text-indigo-400">
                {lecture.currentCode}
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleCopyCode}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                title="Copy code"
              >
                <Copy className="w-4 h-4" />
              </button>
              {!isExpired && (
                <button
                  onClick={handleRegenerateCode}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                  title="Regenerate code"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Expiration Bar */}
          {!isExpired ? (
            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 px-4 py-2 rounded-xl">
              ⏱️ Time Remaining: {Math.floor(timeLeft / 60).toString().padStart(2, "0")}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-400">Attendance collection finalized</div>
          )}
        </div>

        {/* Live Attendance List Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base">Live Attendance Stream</h3>
              <p className="text-xs text-slate-400">Instant real-time check-ins</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {attendances.length}
              </span>
              <span className="text-xs font-bold text-slate-400"> / {lecture.totalEnrolledStudents}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[420px] space-y-2.5 pr-1">
            {attendances.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Waiting for students to scan QR, enter 6-digit code, or run photo verification...
              </div>
            ) : (
              attendances.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-xs">{rec.studentName}</p>
                      <p className="text-[10px] text-slate-400">Roll: {rec.rollNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {rec.method}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(rec.markedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Integrated Classroom Photo Attendance Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <Camera className="w-4 h-4" />
                  <span>Integrated Classroom Visual Attendance</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight">{lecture.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lecture.className} • {lecture.subjectName}
                </p>
              </div>

              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Upload & Actions */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow flex items-center space-x-2 transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Upload Classroom Photos</span>
                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>

                  <button
                    onClick={handleSimulateDefaultClassroomPhotos}
                    className="bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 transition-all"
                  >
                    Load Demo Photos
                  </button>
                </div>

                {uploadedPhotos.length > 0 && (
                  <button
                    onClick={handleAnalyzePhotos}
                    disabled={isAnalyzing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow flex items-center justify-center space-x-2 transition-all"
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <span>{isAnalyzing ? "Analyzing Classroom Angles..." : "Run Visual AI Face Detection"}</span>
                  </button>
                )}
              </div>

              {/* Uploaded Thumbnails Preview */}
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
                  {uploadedPhotos.map((url, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-700 bg-slate-950">
                      <img src={url} alt={`Classroom View ${i + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Angle {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Results Review */}
            {photoResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="font-extrabold text-sm">Visual Verification Candidates</h4>
                    <p className="text-[11px] text-slate-400">Click any card to manually toggle attendance status</p>
                  </div>

                  <div className="flex gap-2 text-xs font-bold">
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-lg">
                      {highConfidenceCount} Confirmed
                    </span>
                    <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-1 rounded-lg">
                      {reviewCount} Review
                    </span>
                    <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-2.5 py-1 rounded-lg">
                      {absentCount} Unmatched
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {photoResults.map((stu) => {
                    const isPresent = stu.finalStatus === "PRESENT";
                    const isHigh = stu.matchStatus === "HIGH_CONFIDENCE";
                    return (
                      <div
                        key={stu.studentId}
                        onClick={() => toggleStudentStatus(stu.studentId)}
                        className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                          isPresent
                            ? isHigh
                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                              : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800"
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            isPresent ? "bg-emerald-500 text-white" : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}>
                            {isPresent ? "✓" : "✕"}
                          </div>
                          <div>
                            <p className="font-bold text-xs truncate">{stu.fullName}</p>
                            <p className="text-[10px] text-slate-400">Roll: {stu.rollNumber}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {Math.round(stu.confidence * 100)}%
                          </span>
                          <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                            {isPresent ? "PRESENT" : "ABSENT"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  {isFinalized ? (
                    <div className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-6 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2">
                      <Check className="w-4 h-4" />
                      <span>Photo Attendance Finalized! Syncing...</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleFinalizeAttendance}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all"
                    >
                      Finalize & Sync with Live Attendance
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

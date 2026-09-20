import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api/client";
import { LectureDTO, PhotoDetectionResultDTO } from "../types";
import { Camera, Upload, CheckCircle, AlertTriangle, XCircle, Users, Check, RefreshCw, ArrowLeft, QrCode } from "lucide-react";

export const PhotoAttendancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryLectureId = searchParams.get("lectureId");

  const [lectures, setLectures] = useState<LectureDTO[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<string>(queryLectureId || "");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<PhotoDetectionResultDTO[]>([]);
  const [isFinalized, setIsFinalized] = useState(false);

  useEffect(() => {
    async function loadLectures() {
      try {
        const data = await apiRequest("/teacher/dashboard");
        const list = data.allLectures || [];
        setLectures(list);
        if (list.length > 0) {
          if (queryLectureId && list.some((l: LectureDTO) => l.id === queryLectureId)) {
            setSelectedLectureId(queryLectureId);
          } else if (!selectedLectureId) {
            setSelectedLectureId(list[0].id);
          }
        }
      } catch (e) {
        console.error("Error loading lectures:", e);
      }
    }
    loadLectures();
  }, [queryLectureId]);

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
    // High quality demo classroom pictures
    setUploadedPhotos([
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80"
    ]);
  };

  const handleAnalyzePhotos = async () => {
    if (!selectedLectureId) return;
    setIsAnalyzing(true);
    try {
      const res = await apiRequest(`/lectures/${selectedLectureId}/analyze-photos`, {
        method: "POST",
        body: JSON.stringify({ images: uploadedPhotos }),
      });
      setResults(res.detectionResults);
    } catch (e) {
      alert("Photo analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleStudentStatus = (studentId: string) => {
    setResults((prev) =>
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
    if (!selectedLectureId) return;
    try {
      await apiRequest(`/lectures/${selectedLectureId}/finalize-photo-attendance`, {
        method: "POST",
        body: JSON.stringify({
          finalizedList: results.map((r) => ({
            studentId: r.studentId,
            status: r.finalStatus,
            confidence: r.confidence,
          })),
        }),
      });
      setIsFinalized(true);
    } catch (e) {
      alert("Failed to finalize attendance");
    }
  };

  const highConfidenceCount = results.filter((r) => r.matchStatus === "HIGH_CONFIDENCE").length;
  const reviewCount = results.filter((r) => r.matchStatus === "NEEDS_REVIEW").length;
  const absentCount = results.filter((r) => r.matchStatus === "NOT_DETECTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Photo-Based Classroom Attendance</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Upload multi-angle classroom photos. The system detects faces and matches them securely against enrolled students for teacher review.
          </p>
        </div>

        {selectedLectureId && (
          <Link
            to={`/teacher/active-lecture/${selectedLectureId}`}
            className="bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center space-x-2 shadow-sm hover:bg-slate-800 transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Open QR Projector</span>
          </Link>
        )}
      </div>

      {/* Configuration & Upload Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Attendance Session
            </label>
            <select
              value={selectedLectureId}
              onChange={(e) => {
                setSelectedLectureId(e.target.value);
                setResults([]);
                setIsFinalized(false);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm"
            >
              {lectures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} ({l.className} • {l.date})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end space-x-3">
            <label className="flex-1 cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-3 flex items-center justify-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Upload className="w-4 h-4" />
              <span>Choose Classroom Photos</span>
              <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>

            <button
              onClick={handleSimulateDefaultClassroomPhotos}
              className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs px-4 py-3 rounded-2xl border border-indigo-200 dark:border-indigo-800"
            >
              Load Demo Photos
            </button>
          </div>
        </div>

        {/* Uploaded Photos Preview */}
        {uploadedPhotos.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500">
                Uploaded Classroom Angles ({uploadedPhotos.length} photos)
              </p>
              <button
                onClick={handleAnalyzePhotos}
                disabled={isAnalyzing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <span>{isAnalyzing ? "Detecting & Matching Faces..." : "Analyze Classroom Photos"}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {uploadedPhotos.map((url, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden aspect-video border border-slate-200 shadow-sm bg-slate-900">
                  <img src={url} alt={`Classroom Angle ${i + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    Photo {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Section */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Summary Status Badges */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-extrabold">Visual Verification Review</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review candidate face detections. Click any student card to toggle attendance status.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{highConfidenceCount} Confirmed</span>
              </span>
              <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-xl flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{reviewCount} Review</span>
              </span>
              <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-3 py-1.5 rounded-xl flex items-center space-x-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>{absentCount} Unmatched</span>
              </span>
            </div>
          </div>

          {/* Student Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map((stu) => {
              const isPresent = stu.finalStatus === "PRESENT";
              const isHigh = stu.matchStatus === "HIGH_CONFIDENCE";
              const isReview = stu.matchStatus === "NEEDS_REVIEW";

              return (
                <div
                  key={stu.studentId}
                  onClick={() => toggleStudentStatus(stu.studentId)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isPresent
                      ? isHigh
                        ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                        : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isPresent
                          ? isHigh
                            ? "bg-emerald-500 text-white"
                            : "bg-amber-500 text-white"
                          : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {isPresent ? "✓" : "✕"}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {stu.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-400">Roll: {stu.rollNumber}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isHigh
                          ? "bg-emerald-200/80 text-emerald-900"
                          : isReview
                          ? "bg-amber-200/80 text-amber-900"
                          : "bg-rose-200/80 text-rose-900"
                      }`}
                    >
                      {Math.round(stu.confidence * 100)}% Match
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                      {isPresent ? "🟢 PRESENT" : "🔴 ABSENT"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Finalize Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            {isFinalized ? (
              <div className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-6 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Attendance Verified and Finalized Successfully!</span>
              </div>
            ) : (
              <button
                onClick={handleFinalizeAttendance}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                Finalize & Save Attendance
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

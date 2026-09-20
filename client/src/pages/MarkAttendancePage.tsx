import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import { firestore } from "../api/firebase";
import { doc, setDoc } from "firebase/firestore";
import jsQR from "jsqr";
import {
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Camera,
  RefreshCw,
  SwitchCamera,
  ShieldAlert,
  Sparkles,
  Check
} from "lucide-react";

export const MarkAttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"code" | "qr">("code");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  // Live Camera Scanner States
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPermissionRequested, setIsPermissionRequested] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const submitAttendance = async (payload: { code?: string; qrToken?: string; method: string }) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setError(null);
    setIsLoading(true);

    try {
      // 1. Submit through backend API
      const res = await apiRequest("/attendance/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // 2. Persist attendance record directly into Firestore
      if (res.record) {
        try {
          const attendanceDocRef = doc(firestore, "attendances", res.record.id);
          await setDoc(attendanceDocRef, res.record, { merge: true });
        } catch (fbErr) {
          console.warn("Firestore attendance save warning:", fbErr);
        }
      }

      setSuccessData(res);
      stopCamera();
    } catch (err: any) {
      setError(err.message || "Failed to mark attendance. Session might be expired or code is invalid.");
      isSubmittingRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSuccess = useCallback((qrData: string) => {
    if (isSubmittingRef.current) return;
    setScannedResult(qrData);
    submitAttendance({ qrToken: qrData, method: "QR" });
  }, []);

  // Continuous frame scanner loop using jsQR and/or BarcodeDetector
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || !cameraActive || isSubmittingRef.current) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data && code.data.trim().length > 0) {
          handleScanSuccess(code.data.trim());
          return;
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
  }, [cameraActive, handleScanSuccess]);

  const startCamera = useCallback(async (facing: "environment" | "user" = cameraFacing) => {
    stopCamera();
    setCameraError(null);
    setIsPermissionRequested(true);
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera access is not supported by your browser. Please use the 6-digit code tab instead.");
        return;
      }

      // Explicitly request video stream with permission popup
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Fallback to any available video device if specific facing mode is unavailable on localhost / laptop webcam
        console.warn("Could not acquire facing mode, trying default video...", firstErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setCameraError(null);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Camera permission was blocked or denied in localhost. Please click the lock/camera icon in your browser address bar and select 'Allow' for camera access."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera device found on this system. You can mark attendance using the 6-digit code.");
      } else {
        setCameraError(`Camera error: ${err.message || "Could not start camera feed."}`);
      }
      setCameraActive(false);
    }
  }, [cameraFacing, stopCamera]);

  useEffect(() => {
    if (activeTab === "qr" && !successData) {
      startCamera(cameraFacing);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, cameraFacing, successData]);

  useEffect(() => {
    if (cameraActive && !scannedResult && !isLoading) {
      animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
    }
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraActive, scannedResult, isLoading, scanVideoFrame]);

  const handleToggleFacing = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) {
      setError("Please enter a valid 6-digit lecture code.");
      return;
    }
    submitAttendance({ code: code.trim(), method: "SIX_DIGIT_CODE" });
  };

  const handleSimulateScan = (scannedToken: string) => {
    handleScanSuccess(scannedToken);
  };

  if (successData) {
    return (
      <div className="max-w-md mx-auto py-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Attendance Verified!
            </h3>
            <p className="text-slate-400 text-xs mt-1">Your presence has been saved to Firebase and recorded.</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Lecture:</span>
              <span className="font-extrabold">{successData.lecture?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Subject:</span>
              <span className="font-extrabold">{successData.lecture?.subjectName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Faculty:</span>
              <span className="font-extrabold">{successData.lecture?.teacherName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Marked At:</span>
              <span className="font-extrabold text-emerald-600">{successData.lecture?.time}</span>
            </div>
            {scannedResult && (
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-semibold">Verified Token:</span>
                <span className="font-mono text-[11px] text-indigo-500 font-bold truncate max-w-[180px]">{scannedResult}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/student")}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <button
        onClick={() => {
          stopCamera();
          navigate("/student");
        }}
        className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 flex items-center space-x-1 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Student Portal</span>
      </button>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight">Mark Lecture Attendance</h2>
          <p className="text-slate-400 text-xs mt-1">
            Choose to enter the teacher's 6-digit code or scan the broadcasted QR code via live camera.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab("code");
              setError(null);
            }}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === "code"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>6-Digit Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("qr");
              setError(null);
            }}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === "qr"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-500"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR Code</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center space-x-2.5 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: 6-Digit Code */}
        {activeTab === "code" && (
          <form onSubmit={handleSubmitCode} className="space-y-4">
            <div>
              <label className="block text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Enter Active 6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="482731"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center font-mono font-black text-3xl tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Submit Attendance</span>}
            </button>
          </form>
        )}

        {/* Tab 2: Real-time Live Camera QR Scanner */}
        {activeTab === "qr" && (
          <div className="space-y-4">
            {/* Viewfinder Frame */}
            <div className="aspect-square bg-slate-950 rounded-3xl relative overflow-hidden border-2 border-emerald-500/30 flex flex-col items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraFacing === "user" ? "scale-x-[-1]" : ""} ${
                  cameraActive ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Scanning HUD Overlay when camera is active */}
              {cameraActive && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6">
                  {/* Targeting Reticle */}
                  <div className="w-56 h-56 border-2 border-emerald-400/70 rounded-2xl relative shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    {/* Reticle Corners */}
                    <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400 absolute -top-1 -left-1" />
                    <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400 absolute -top-1 -right-1" />
                    <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400 absolute -bottom-1 -left-1" />
                    <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400 absolute -bottom-1 -right-1" />

                    {/* Animated Scanning Laser Line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce top-1/2 -translate-y-1/2 shadow-[0_0_10px_#10b981]" />
                  </div>

                  <p className="text-[11px] text-emerald-300 font-bold mt-4 bg-slate-950/80 backdrop-blur-xs px-3 py-1 rounded-full border border-emerald-500/40">
                    Align Teacher's Projected QR Code
                  </p>
                </div>
              )}

              {/* Loading / Submitting State */}
              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 p-6 text-center">
                  <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                  <p className="text-white font-black text-sm">Validating Scanned QR Code...</p>
                  <p className="text-xs text-slate-400">Authenticating attendance session</p>
                </div>
              )}

              {/* Camera Error or Permission Denied State */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-extrabold text-white">Camera Permission Needed</h4>
                  <p className="text-[11px] text-slate-300 max-w-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => startCamera(cameraFacing)}
                    className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Request Camera Permission</span>
                  </button>
                </div>
              )}

              {/* Initializing / Requesting Permission State */}
              {!cameraActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-3 p-6">
                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                    <Camera className="w-7 h-7 animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-slate-200">Requesting Camera Access...</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Please allow camera permission in your browser prompt to scan attendance QR codes.
                  </p>
                </div>
              )}
            </div>

            {/* Controls under scanner */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleToggleFacing}
                disabled={!cameraActive}
                className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <SwitchCamera className="w-4 h-4 text-slate-500" />
                <span>Flip Camera ({cameraFacing === "environment" ? "Back" : "Front"})</span>
              </button>

              <button
                type="button"
                onClick={() => startCamera(cameraFacing)}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                title="Restart Camera"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
                <span>Restart</span>
              </button>
            </div>

            {/* Localhost quick simulation fallback button for developer convenience */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Local testing demo:</span>
              </span>
              <button
                type="button"
                onClick={() => handleSimulateScan("sec-token-eco-482731")}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Simulate QR Token
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

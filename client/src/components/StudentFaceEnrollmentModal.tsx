import React, { useState, useRef, useEffect, useCallback } from "react";
import { apiRequest } from "../api/client";
import { StudentDTO } from "../types";
import { Camera, RefreshCw, CheckCircle2, ShieldCheck, Upload, AlertCircle, Sparkles, X, SwitchCamera } from "lucide-react";

interface FaceEnrollmentModalProps {
  isOpen: boolean;
  onSuccess: (updatedStudent: StudentDTO) => void;
  onClose?: () => void;
  isMandatory?: boolean;
}

export const StudentFaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  isMandatory = false,
}) => {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async (facing: "user" | "environment" = facingMode) => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera access is not supported on this browser. You can upload a photo instead.");
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch (modeErr) {
        console.warn("Retrying with default video device:", modeErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play interrupted/handled:", playErr);
        }
        setIsCameraActive(true);
        setCameraError(null);
      }
    } catch (err: any) {
      console.warn("Camera stream error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Camera permission was blocked. Please click the camera/lock icon in your browser address bar to allow camera access."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No webcam found on this device. You can upload a photo file directly below.");
      } else {
        setCameraError("Camera unavailable. You can click 'Retry Camera' or upload a photo below.");
      }
      setIsCameraActive(false);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      // Small timeout to guarantee video element is mounted in DOM
      const timer = setTimeout(() => {
        startCamera(facingMode);
      }, 100);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedPhoto, facingMode, startCamera, stopCamera]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCapturedPhoto(ev.target.result as string);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleToggleFacing = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
  };

  const handleSubmit = async () => {
    if (!capturedPhoto) {
      alert("Please capture or upload your face photo first.");
      return;
    }
    if (!consentGiven) {
      alert("Please check the consent box to proceed with attendance face verification.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest<{ message: string; student: StudentDTO }>("/student/enroll-face", {
        method: "POST",
        body: JSON.stringify({
          facePhoto: capturedPhoto,
          faceConsentGiven: consentGiven,
        }),
      });

      onSuccess(res.student);
    } catch (err: any) {
      alert(err.message || "Failed to register face biometric data");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Close Button if not mandatory */}
        {!isMandatory && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Badge */}
        <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Student Biometric Profile Enrollment</span>
        </div>

        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Register Your Face ID
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
          First-time setup: Capture a clear, front-facing headshot to enable automated visual attendance during classroom lectures.
        </p>

        {/* Viewfinder / Capture Box */}
        <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700 mb-4 flex items-center justify-center">
          {/* Always rendered video element so ref is never null */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""} ${
              isCameraActive && !capturedPhoto ? "block" : "hidden"
            }`}
          />

          {/* Captured Photo Preview */}
          {capturedPhoto && (
            <div className="relative w-full h-full">
              <img
                src={capturedPhoto}
                alt="Enrolled Face"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Face Captured</span>
              </div>
            </div>
          )}

          {/* Face Alignment Reticle overlay when camera is running */}
          {isCameraActive && !capturedPhoto && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-60 border-2 border-dashed border-indigo-400/80 rounded-[50%] animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.3)] flex flex-col items-center justify-end pb-4">
                <span className="bg-black/60 backdrop-blur-xs text-[10px] text-indigo-200 font-bold px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                  Align Face Here
                </span>
              </div>
            </div>
          )}

          {/* Placeholder / Error when camera is not running and no photo is captured */}
          {!isCameraActive && !capturedPhoto && (
            <div className="p-6 text-center text-slate-400 space-y-3">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Camera className="w-7 h-7" />
              </div>
              <p className="text-xs max-w-xs mx-auto">
                {cameraError || "Requesting camera permission from browser..."}
              </p>
            </div>
          )}
        </div>

        {/* Capture Controls */}
        <div className="flex items-center space-x-3 mb-5">
          {!capturedPhoto && isCameraActive ? (
            <>
              <button
                onClick={handleCapture}
                className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Face Photo</span>
              </button>
              <button
                onClick={handleToggleFacing}
                className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                title="Switch Camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </>
          ) : capturedPhoto ? (
            <button
              onClick={handleRetake}
              className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>
          ) : (
            <button
              onClick={() => startCamera(facingMode)}
              className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Allow & Start Camera</span>
            </button>
          )}

          {/* Upload fallback button */}
          <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition-all">
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Biometric Consent */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-5 flex items-start space-x-3">
          <input
            type="checkbox"
            id="consent"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <label htmlFor="consent" className="text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <span className="font-bold flex items-center space-x-1 text-slate-900 dark:text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Biometric Attendance Authorization</span>
            </span>
            I consent to using my face photograph for automated classroom attendance and verification purposes.
          </label>
        </div>

        {/* Submit Action */}
        <button
          onClick={handleSubmit}
          disabled={!capturedPhoto || !consentGiven || isSubmitting}
          className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all shadow-lg flex items-center justify-center space-x-2 ${
            capturedPhoto && consentGiven && !isSubmitting
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 cursor-pointer"
              : "bg-slate-400 dark:bg-slate-700 cursor-not-allowed shadow-none"
          }`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving Face Profile...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Complete Enrollment</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

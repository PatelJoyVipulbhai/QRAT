import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Role } from "../types";
import { Shield, GraduationCap, Users, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>("ADMIN");
  const [email, setEmail] = useState("admin@attendance.edu");
  const [password, setPassword] = useState("Password@123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setError(null);
    if (selectedRole === "ADMIN") {
      setEmail("admin@attendance.edu");
    } else if (selectedRole === "TEACHER") {
      setEmail("prof.shah@attendance.edu");
    } else {
      setEmail("student101@attendance.edu");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password, role);
      if (role === "ADMIN") navigate("/admin");
      else if (role === "TEACHER") navigate("/teacher");
      else navigate("/student");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-600/30 mb-4">
            QR
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Attendance Platform
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
            Enterprise QR, Code & Photo Attendance Verification
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => handleRoleSelect("ADMIN")}
              className={`flex flex-col items-center py-2.5 rounded-xl font-bold text-xs transition-all ${
                role === "ADMIN"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Shield className="w-4 h-4 mb-1" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("TEACHER")}
              className={`flex flex-col items-center py-2.5 rounded-xl font-bold text-xs transition-all ${
                role === "TEACHER"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <GraduationCap className="w-4 h-4 mb-1" />
              <span>Teacher</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("STUDENT")}
              className={`flex flex-col items-center py-2.5 rounded-xl font-bold text-xs transition-all ${
                role === "STUDENT"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4 mb-1" />
              <span>Student</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center space-x-2.5 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="name@attendance.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center space-x-2 ${
                role === "STUDENT"
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
              }`}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In as {role}</span>}
            </button>
          </form>

          {/* Quick Demo Credentials Reminder */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-400">
              Demo accounts pre-configured. Password: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">Password@123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

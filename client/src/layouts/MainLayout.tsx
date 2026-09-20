import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Users,
  GraduationCap,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  QrCode,
  Camera,
  History,
  CheckCircle,
  Menu,
  X
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isDarkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  if (!user) return <>{children}</>;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Role based navigations
  const getNavLinks = () => {
    switch (user.role) {
      case "ADMIN":
        return [
          { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
          { label: "Students", href: "/admin/students", icon: Users },
          { label: "Teachers", href: "/admin/teachers", icon: GraduationCap },
          { label: "Classes & Batches", href: "/admin/classes", icon: BookOpen },
        ];
      case "TEACHER":
        return [
          { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
          { label: "Create Lecture", href: "/teacher/create-lecture", icon: QrCode },
          { label: "Photo Attendance", href: "/teacher/photo-attendance", icon: Camera },
          { label: "Lecture History", href: "/teacher/history", icon: History },
        ];
      case "STUDENT":
        return [
          { label: "My Dashboard", href: "/student", icon: LayoutDashboard },
          { label: "Mark Attendance", href: "/student/mark", icon: CheckCircle },
          { label: "Attendance History", href: "/student/history", icon: History },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6">
        {/* Brand */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
            QR
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-tight tracking-tight">Smart Attend</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {user.role} Portal
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            {user.role === "ADMIN" ? "🛡️" : user.role === "TEACHER" ? "👨‍🏫" : "🎓"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-bold text-xs truncate">
              {user.admin?.fullName || user.teacher?.fullName || user.student?.fullName || user.email}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/admin" || link.href === "/teacher" || link.href === "/student"
                ? location.pathname === link.href || location.pathname === `${link.href}/`
                : location.pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs font-semibold"
          >
            <span className="flex items-center space-x-2">
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
            QR
          </div>
          <span className="font-extrabold text-sm">{user.role} Portal</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <link.icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-rose-600 text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

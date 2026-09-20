import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client";
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  Key,
  X,
  Check,
  AlertCircle
} from "lucide-react";
import { StudentDTO, TeacherDTO, ClassDTO, SubjectDTO } from "../types";

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<any>(null);
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [teachers, setTeachers] = useState<TeacherDTO[]>([]);
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("");

  const getActiveTab = (): "overview" | "students" | "teachers" | "classes" => {
    if (location.pathname.includes("/admin/students")) return "students";
    if (location.pathname.includes("/admin/teachers")) return "teachers";
    if (location.pathname.includes("/admin/classes")) return "classes";
    return "overview";
  };

  const activeTab = getActiveTab();

  const handleTabSelect = (tab: "overview" | "students" | "teachers" | "classes") => {
    if (tab === "overview") navigate("/admin");
    else if (tab === "students") navigate("/admin/students");
    else if (tab === "teachers") navigate("/admin/teachers");
    else if (tab === "classes") navigate("/admin/classes");
  };

  // Modals state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentDTO | null>(null);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherDTO | null>(null);

  // Batch Modal & Form State
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [selectedClassForBatch, setSelectedClassForBatch] = useState<ClassDTO | null>(null);
  const [editingBatch, setEditingBatch] = useState<{ id: string; name: string; classId: string } | null>(null);
  const [batchNameInput, setBatchNameInput] = useState("");

  // Class Modal & Form State
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassDTO | null>(null);
  const [classForm, setClassForm] = useState({
    name: "",
    code: "",
    department: "Management",
    semester: "Semester 1",
  });

  // Student Form State
  const [studentForm, setStudentForm] = useState({
    rollNumber: "",
    fullName: "",
    email: "",
    classId: "",
    batchId: "",
    phone: "",
    department: "Management",
    semester: "Semester 1",
    status: "Active" as "Active" | "Inactive",
    password: "",
    faceConsentGiven: true,
  });

  // Teacher Form State
  const [teacherForm, setTeacherForm] = useState({
    teacherId: "",
    fullName: "",
    email: "",
    phone: "",
    department: "Management",
    status: "Active" as "Active" | "Inactive",
    subjectIds: [] as string[],
    password: "",
  });

  const fetchData = async () => {
    try {
      const [m, s, t, c, subs] = await Promise.all([
        apiRequest("/admin/metrics"),
        apiRequest("/admin/students"),
        apiRequest("/admin/teachers"),
        apiRequest("/admin/classes"),
        apiRequest("/admin/subjects"),
      ]);
      setMetrics(m);
      setStudents(s);
      setTeachers(t);
      setClasses(c);
      setSubjects(subs);
      if (c.length > 0 && !studentForm.classId) {
        setStudentForm((prev) => ({
          ...prev,
          classId: c[0].id,
          batchId: c[0].batches?.[0]?.id || "",
        }));
      }
    } catch (e) {
      console.error("Error fetching admin data:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ----------------------------------------------------
  // Student Actions
  // ----------------------------------------------------
  const handleOpenAddStudent = () => {
    setStudentForm({
      rollNumber: "",
      fullName: "",
      email: "",
      classId: classes[0]?.id || "",
      batchId: classes[0]?.batches?.[0]?.id || "",
      phone: "",
      department: classes[0]?.department || "Management",
      semester: "Semester 1",
      status: "Active",
      password: "",
      faceConsentGiven: true,
    });
    setShowAddStudentModal(true);
  };

  const handleOpenEditStudent = (stu: StudentDTO) => {
    setEditingStudent(stu);
    setStudentForm({
      rollNumber: stu.rollNumber,
      fullName: stu.fullName,
      email: stu.email,
      classId: stu.classId,
      batchId: stu.batchId || "",
      phone: stu.phone || "",
      department: stu.department || "Management",
      semester: stu.semester || "Semester 1",
      status: stu.status,
      password: "",
      faceConsentGiven: stu.faceConsentGiven,
    });
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        // Update existing
        await apiRequest(`/admin/students/${editingStudent.id}`, {
          method: "PUT",
          body: JSON.stringify(studentForm),
        });
        setEditingStudent(null);
      } else {
        // Create new
        await apiRequest("/admin/students", {
          method: "POST",
          body: JSON.stringify(studentForm),
        });
        setShowAddStudentModal(false);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save student");
    }
  };

  const handleDeleteStudent = async (stu: StudentDTO) => {
    const confirm = window.confirm(
      `Are you sure you want to completely remove student "${stu.fullName}" (Roll: ${stu.rollNumber})? This will delete their login and attendance records.`
    );
    if (!confirm) return;

    try {
      await apiRequest(`/admin/students/${stu.id}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to remove student");
    }
  };

  // ----------------------------------------------------
  // Teacher Actions
  // ----------------------------------------------------
  const handleOpenAddTeacher = () => {
    setTeacherForm({
      teacherId: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: "",
      email: "",
      phone: "",
      department: "Management",
      status: "Active",
      subjectIds: subjects[0] ? [subjects[0].id] : [],
      password: "",
    });
    setShowAddTeacherModal(true);
  };

  const handleOpenEditTeacher = (tch: TeacherDTO) => {
    setEditingTeacher(tch);
    const assignedSubIds = tch.assignedSubjects?.map((s) => s.id) || [];
    setTeacherForm({
      teacherId: tch.teacherId,
      fullName: tch.fullName,
      email: tch.email,
      phone: tch.phone || "",
      department: tch.department,
      status: tch.status,
      subjectIds: assignedSubIds,
      password: "",
    });
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        // Update existing
        await apiRequest(`/admin/teachers/${editingTeacher.id}`, {
          method: "PUT",
          body: JSON.stringify(teacherForm),
        });
        setEditingTeacher(null);
      } else {
        // Create new
        await apiRequest("/admin/teachers", {
          method: "POST",
          body: JSON.stringify(teacherForm),
        });
        setShowAddTeacherModal(false);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save faculty member");
    }
  };

  const handleDeleteTeacher = async (tch: TeacherDTO) => {
    const confirm = window.confirm(
      `Are you sure you want to completely remove faculty member "${tch.fullName}" (${tch.teacherId})? This will revoke their portal access.`
    );
    if (!confirm) return;

    try {
      await apiRequest(`/admin/teachers/${tch.id}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to remove teacher");
    }
  };

  // ----------------------------------------------------
  // Batch Actions (Add, Edit, Remove)
  // ----------------------------------------------------
  const handleOpenAddBatch = (cls: ClassDTO) => {
    setSelectedClassForBatch(cls);
    setEditingBatch(null);
    setBatchNameInput("");
    setShowAddBatchModal(true);
  };

  const handleOpenEditBatch = (cls: ClassDTO, batch: { id: string; name: string; classId: string }) => {
    setSelectedClassForBatch(cls);
    setEditingBatch(batch);
    setBatchNameInput(batch.name);
    setShowAddBatchModal(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNameInput.trim()) return;

    try {
      if (editingBatch) {
        await apiRequest(`/admin/batches/${editingBatch.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: batchNameInput.trim() }),
        });
      } else if (selectedClassForBatch) {
        await apiRequest("/admin/batches", {
          method: "POST",
          body: JSON.stringify({
            name: batchNameInput.trim(),
            classId: selectedClassForBatch.id,
          }),
        });
      }
      setShowAddBatchModal(false);
      setEditingBatch(null);
      setBatchNameInput("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save batch");
    }
  };

  const handleDeleteBatch = async (batch: { id: string; name: string }) => {
    const confirm = window.confirm(
      `Are you sure you want to remove batch "${batch.name}"? Students in this batch will be moved to general division.`
    );
    if (!confirm) return;

    try {
      await apiRequest(`/admin/batches/${batch.id}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to remove batch");
    }
  };

  // ----------------------------------------------------
  // Class Actions (Add, Edit, Remove)
  // ----------------------------------------------------
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassForm({
      name: "",
      code: "",
      department: "Management",
      semester: "Semester 1",
    });
    setShowAddClassModal(true);
  };

  const handleOpenEditClass = (cls: ClassDTO) => {
    setEditingClass(cls);
    setClassForm({
      name: cls.name,
      code: cls.code,
      department: cls.department,
      semester: cls.semester,
    });
    setShowAddClassModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim() || !classForm.code.trim()) return;

    try {
      if (editingClass) {
        await apiRequest(`/admin/classes/${editingClass.id}`, {
          method: "PUT",
          body: JSON.stringify(classForm),
        });
      } else {
        await apiRequest("/admin/classes", {
          method: "POST",
          body: JSON.stringify(classForm),
        });
      }
      setShowAddClassModal(false);
      setEditingClass(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save class");
    }
  };

  const handleDeleteClass = async (cls: ClassDTO) => {
    const confirm = window.confirm(
      `Are you sure you want to completely remove class "${cls.name}" (${cls.code}) and all its batches?`
    );
    if (!confirm) return;

    try {
      await apiRequest(`/admin/classes/${cls.id}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to remove class");
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.includes(searchQuery) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = !selectedClassFilter || s.classId === selectedClassFilter;
    const matchesBatch = !selectedBatchFilter || s.batchId === selectedBatchFilter;
    const matchesStatus = !selectedStatusFilter || s.status === selectedStatusFilter;
    return matchesSearch && matchesClass && matchesBatch && matchesStatus;
  });

  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.teacherId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClass = classes.find((c) => c.id === studentForm.classId);
  const filterClassObj = classes.find((c) => c.id === selectedClassFilter);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Administrator Portal
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Full user control: Manage, add, edit, and remove authorized students and faculty members.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/70 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => handleTabSelect("overview")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabSelect("students")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "students"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => handleTabSelect("teachers")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "teachers"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Teachers ({teachers.length})
          </button>
          <button
            onClick={() => handleTabSelect("classes")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "classes"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Classes & Batches ({classes.length})
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Students</span>
            </div>
            <p className="text-3xl font-black">{metrics.totalStudents}</p>
            <p className="text-[11px] text-slate-400 mt-1">Authorized logins</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400 mb-2">
              <GraduationCap className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faculty Members</span>
            </div>
            <p className="text-3xl font-black">{metrics.totalTeachers}</p>
            <p className="text-[11px] text-slate-400 mt-1">Authorized teachers</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400 mb-2">
              <BookOpen className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Classes</span>
            </div>
            <p className="text-3xl font-black">{metrics.totalClasses}</p>
            <p className="text-[11px] text-slate-400 mt-1">{metrics.totalSubjects} Subjects</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-3 text-violet-600 dark:text-violet-400 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Today</span>
            </div>
            <p className="text-3xl font-black">{metrics.todaysAttendanceCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Verified records</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classes Overview */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Configured Classes & Batches</h3>
            <div className="space-y-3">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-extrabold text-sm">{cls.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cls.department} • Code: {cls.code}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full">
                      {cls.totalStudents || 0} Students
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Access Control Policy */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold mb-3">Access Control & Security</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Only students and teachers registered in this directory by an administrator can log in. Inactive accounts are immediately denied login access.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold">Strict Role Authentication</span>
                <span className="text-xs font-bold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold">Admin Account Removal</span>
                <span className="text-xs font-bold text-indigo-600">Enabled</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold">Biometric Registration</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">1st-Time Mandatory</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === "students" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          {/* Class Filter Pills */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Filter by Class / Program
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedClassFilter("");
                  setSelectedBatchFilter("");
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  selectedClassFilter === ""
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>All Classes</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 dark:bg-white/20">
                  {students.length}
                </span>
              </button>

              {classes.map((cls) => {
                const count = students.filter((s) => s.classId === cls.id).length;
                const isSelected = selectedClassFilter === cls.id;
                return (
                  <button
                    key={cls.id}
                    onClick={() => {
                      setSelectedClassFilter(cls.id);
                      setSelectedBatchFilter("");
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{cls.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 dark:bg-white/20">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search and Secondary Filter Dropdowns */}
          <div className="flex flex-col lg:flex-row justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-wrap flex-1 gap-2.5 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name, roll no, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Batch Selector (If Class Filter Selected) */}
              {filterClassObj?.batches && filterClassObj.batches.length > 0 && (
                <select
                  value={selectedBatchFilter}
                  onChange={(e) => setSelectedBatchFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 font-semibold"
                >
                  <option value="">All Divisions / Batches</option>
                  {filterClassObj.batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>

              {/* Clear Filters button */}
              {(selectedClassFilter || selectedBatchFilter || selectedStatusFilter || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedClassFilter("");
                    setSelectedBatchFilter("");
                    setSelectedStatusFilter("");
                    setSearchQuery("");
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold px-2 py-1"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400 font-medium">
                Showing <strong className="text-slate-700 dark:text-slate-200">{filteredStudents.length}</strong> of {students.length} students
              </span>

              <button
                onClick={handleOpenAddStudent}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Face ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {stu.rollNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">{stu.fullName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{stu.className}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{stu.email}</td>
                    <td className="py-3.5 px-4">
                      {stu.facePhoto || stu.faceEnrolled ? (
                        <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          ✓ Enrolled
                        </span>
                      ) : (
                        <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          stu.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {stu.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEditStudent(stu)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 transition-all"
                          title="Edit Student"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(stu)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all"
                          title="Remove Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teachers Tab */}
      {activeTab === "teachers" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search faculty by name, ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleOpenAddTeacher}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center space-x-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Teacher</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((tch) => (
              <div
                key={tch.id}
                className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600">
                      👨‍🏫
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm">{tch.fullName}</h4>
                      <p className="text-[11px] text-slate-400">{tch.teacherId}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      tch.status === "Active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {tch.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium">{tch.email}</p>
                <p className="text-[11px] text-slate-400">Dept: {tch.department}</p>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-1">
                  {tch.assignedSubjects?.map((sub) => (
                    <span
                      key={sub.id}
                      className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[10px] font-bold"
                    >
                      {sub.name}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-2">
                  <button
                    onClick={() => handleOpenEditTeacher(tch)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-100 flex items-center space-x-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(tch)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 text-xs font-bold border border-rose-200 dark:border-rose-900 hover:bg-rose-100 flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classes & Batches Tab */}
      {activeTab === "classes" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold">Academic Programs & Classes</h3>
              <p className="text-xs text-slate-400">Manage classroom cohorts, divisions, and linked student groups.</p>
            </div>
            <button
              onClick={handleOpenAddClass}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Class</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classes.map((cls) => {
              const classStudents = students.filter((s) => s.classId === cls.id);
              return (
                <div
                  key={cls.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-md">
                        {cls.department} • {cls.semester}
                      </span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        {cls.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">Class Code: {cls.code}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-xl">
                        {classStudents.length} Students
                      </span>
                      <button
                        onClick={() => handleOpenEditClass(cls)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 transition-all"
                        title="Edit Class"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all"
                        title="Remove Class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Batches / Divisions */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-bold uppercase text-slate-400">
                        Configured Batches / Divisions
                      </h4>
                      <button
                        onClick={() => handleOpenAddBatch(cls)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center space-x-1 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Batch</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {cls.batches && cls.batches.length > 0 ? (
                        cls.batches.map((b) => (
                          <div
                            key={b.id}
                            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-2 group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                          >
                            <span>🏷️ {b.name}</span>
                            <div className="flex items-center space-x-1 pl-1 border-l border-slate-200 dark:border-slate-700">
                              <button
                                onClick={() => handleOpenEditBatch(cls, b)}
                                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                title="Edit Batch"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteBatch(b)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
                                title="Remove Batch"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">Single General Division</span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action: View Enrolled Students */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedClassFilter(cls.id);
                        handleTabSelect("students");
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                    >
                      <span>View All {classStudents.length} Enrolled Students</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subjects Directory */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-lg font-bold">Curriculum Subjects Directory</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                    {sub.code}
                  </span>
                  <h4 className="font-bold text-sm mt-0.5">{sub.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{sub.department}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {(showAddStudentModal || editingStudent) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black">
                {editingStudent ? "Edit Student Details" : "Add New Student"}
              </h3>
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setEditingStudent(null);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={studentForm.fullName}
                    onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-500 block mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={studentForm.rollNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                    placeholder="e.g. 101"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                  placeholder="student101@attendance.edu"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Class / Program</label>
                  <select
                    value={studentForm.classId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      const cls = classes.find((c) => c.id === cId);
                      setStudentForm({
                        ...studentForm,
                        classId: cId,
                        batchId: cls?.batches?.[0]?.id || "",
                        department: cls?.department || studentForm.department,
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-500 block mb-1">Batch / Division</label>
                  <select
                    value={studentForm.batchId}
                    onChange={(e) => setStudentForm({ ...studentForm, batchId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                  >
                    {selectedClass?.batches?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Account Status</label>
                  <select
                    value={studentForm.status}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, status: e.target.value as "Active" | "Inactive" })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                  >
                    <option value="Active">Active (Can Login)</option>
                    <option value="Inactive">Inactive (Login Blocked)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-500 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                    placeholder="+1 555-0100"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">
                  {editingStudent ? "Reset Password (leave blank to keep current)" : "Set Password"}
                </label>
                <input
                  type="password"
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                  placeholder={editingStudent ? "•••••••• (Unchanged)" : "Default: Password@123"}
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setEditingStudent(null);
                  }}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
                >
                  {editingStudent ? "Save Changes" : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Teacher Modal */}
      {(showAddTeacherModal || editingTeacher) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black">
                {editingTeacher ? "Edit Faculty Details" : "Add New Teacher"}
              </h3>
              <button
                onClick={() => {
                  setShowAddTeacherModal(false);
                  setEditingTeacher(null);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.fullName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                    placeholder="e.g. Prof. Rajesh Shah"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-500 block mb-1">Faculty ID</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.teacherId}
                    onChange={(e) => setTeacherForm({ ...teacherForm, teacherId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                    placeholder="FAC-1001"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                  placeholder="prof.shah@attendance.edu"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Department</label>
                  <input
                    type="text"
                    value={teacherForm.department}
                    onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                    placeholder="Management"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-500 block mb-1">Account Status</label>
                  <select
                    value={teacherForm.status}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, status: e.target.value as "Active" | "Inactive" })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                  >
                    <option value="Active">Active (Can Login)</option>
                    <option value="Inactive">Inactive (Login Blocked)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">Assigned Teaching Subjects</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  {subjects.map((sub) => {
                    const isSelected = teacherForm.subjectIds.includes(sub.id);
                    return (
                      <label key={sub.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTeacherForm({
                                ...teacherForm,
                                subjectIds: [...teacherForm.subjectIds, sub.id],
                              });
                            } else {
                              setTeacherForm({
                                ...teacherForm,
                                subjectIds: teacherForm.subjectIds.filter((id) => id !== sub.id),
                              });
                            }
                          }}
                          className="rounded text-indigo-600 w-3.5 h-3.5"
                        />
                        <span className="text-xs">
                          {sub.name} ({sub.code})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">
                  {editingTeacher ? "Reset Password (leave blank to keep current)" : "Set Password"}
                </label>
                <input
                  type="password"
                  value={teacherForm.password}
                  onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                  placeholder={editingTeacher ? "•••••••• (Unchanged)" : "Default: Password@123"}
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTeacherModal(false);
                    setEditingTeacher(null);
                  }}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
                >
                  {editingTeacher ? "Save Changes" : "Create Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Batch Modal */}
      {(showAddBatchModal || editingBatch) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black">
                  {editingBatch ? "Edit Batch / Division" : "Add New Batch / Division"}
                </h3>
                {selectedClassForBatch && (
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    For class: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedClassForBatch.name}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowAddBatchModal(false);
                  setEditingBatch(null);
                  setBatchNameInput("");
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-500 block mb-1">Batch / Division Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={batchNameInput}
                  onChange={(e) => setBatchNameInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
                  placeholder="e.g. Division A, Batch 1, Group C"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBatchModal(false);
                    setEditingBatch(null);
                    setBatchNameInput("");
                  }}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition-all"
                >
                  {editingBatch ? "Save Changes" : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Class Modal */}
      {(showAddClassModal || editingClass) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black">
                {editingClass ? "Edit Class Details" : "Add New Academic Class"}
              </h3>
              <button
                onClick={() => {
                  setShowAddClassModal(false);
                  setEditingClass(null);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-500 block mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                  placeholder="e.g. BBA Semester 1, BCA Final Year"
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">Class Code</label>
                <input
                  type="text"
                  required
                  value={classForm.code}
                  onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                  placeholder="e.g. BBA-S1, BCA-S5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={classForm.department}
                    onChange={(e) => setClassForm({ ...classForm, department: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                    placeholder="Management, CS..."
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-500 block mb-1">Semester / Term</label>
                  <input
                    type="text"
                    required
                    value={classForm.semester}
                    onChange={(e) => setClassForm({ ...classForm, semester: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                    placeholder="Semester 1"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddClassModal(false);
                    setEditingClass(null);
                  }}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition-all"
                >
                  {editingClass ? "Save Changes" : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

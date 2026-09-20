import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  updateDoc
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  fullName: string;
  facultyId?: string;
  department?: string;
  rollNumber?: string;
  className?: string;
  createdAt: number;
}

export interface AttendanceSession {
  sessionId: string;
  facultyName: string;
  subjectName: string;
  className: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM AM/PM
  endTime: string; // HH:MM AM/PM
  status: 'Active' | 'Ended';
  createdAt: number;
  facultyUid?: string;
}

export interface AttendanceRecord {
  attendanceId: string;
  sessionId: string;
  studentName: string;
  rollNumber: string;
  markedAt: string; // HH:MM AM/PM
  status: 'Present';
  studentUid?: string;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCAEXGMfEyn19Jq6xTW0uoj_jrq2D86DkI",
  authDomain: "hisab-14.firebaseapp.com",
  projectId: "hisab-14",
  storageBucket: "hisab-14.firebasestorage.app",
  messagingSenderId: "696479861155",
  appId: "1:696479861155:web:14bfa0ada311fde2fd7216"
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Cached current user profile
let currentUserProfile: UserProfile | null = null;
const authListeners = new Set<(user: UserProfile | null) => void>();

const defaultSession: AttendanceSession = {
  sessionId: "1234",
  facultyName: "Dr. ABC",
  subjectName: "Financial Management",
  className: "BBA Semester 1 - Division A",
  date: new Date().toISOString().split('T')[0],
  startTime: "12:00 AM",
  endTime: "11:59 PM",
  status: "Active",
  createdAt: Date.now()
};

// Local cache database store
let sessionsCache: AttendanceSession[] = [defaultSession];
let recordsCache: AttendanceRecord[] = [];
const listeners = new Set<() => void>();

// Helper functions for localStorage backup
const loadLocalBackup = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const savedUser = window.localStorage.getItem('attendance_auth_user');
      if (savedUser) {
        currentUserProfile = JSON.parse(savedUser);
      }
      const savedSessions = window.localStorage.getItem('attendance_sessions');
      if (savedSessions) {
        sessionsCache = JSON.parse(savedSessions);
      }
      const savedRecords = window.localStorage.getItem('attendance_records');
      if (savedRecords) {
        recordsCache = JSON.parse(savedRecords);
      }
    } catch (e) {
      console.warn("Failed to load local storage backup:", e);
    }
  }
  if (!sessionsCache.some(s => s.sessionId === "1234")) {
    sessionsCache.push(defaultSession);
  }
};

const saveLocalBackup = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (currentUserProfile) {
        window.localStorage.setItem('attendance_auth_user', JSON.stringify(currentUserProfile));
      } else {
        window.localStorage.removeItem('attendance_auth_user');
      }
      window.localStorage.setItem('attendance_sessions', JSON.stringify(sessionsCache));
      window.localStorage.setItem('attendance_records', JSON.stringify(recordsCache));
    } catch (e) {
      console.warn("Failed to save local storage backup:", e);
    }
  }
};

loadLocalBackup();

// Real-time Auth state sync
onAuthStateChanged(auth, async (fbUser) => {
  if (fbUser) {
    try {
      const userDocRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        currentUserProfile = userSnap.data() as UserProfile;
      } else if (!currentUserProfile || currentUserProfile.uid !== fbUser.uid) {
        currentUserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || "",
          role: 'student',
          fullName: fbUser.displayName || fbUser.email?.split('@')[0] || "User",
          createdAt: Date.now()
        };
      }
    } catch (err) {
      console.warn("Error fetching user profile:", err);
    }
  } else {
    // If not authenticated in firebase, check if we keep local user or clear
    if (typeof window !== 'undefined' && !window.localStorage.getItem('attendance_auth_user')) {
      currentUserProfile = null;
    }
  }
  saveLocalBackup();
  authListeners.forEach(cb => cb(currentUserProfile));
});

// Authentication APIs
export const registerUser = async (data: {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  facultyId?: string;
  department?: string;
  rollNumber?: string;
  className?: string;
}): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
    const profile: UserProfile = {
      uid: cred.user.uid,
      email: data.email.trim(),
      role: data.role,
      fullName: data.fullName.trim(),
      facultyId: data.facultyId?.trim(),
      department: data.department?.trim(),
      rollNumber: data.rollNumber?.trim(),
      className: data.className?.trim(),
      createdAt: Date.now()
    };

    currentUserProfile = profile;
    saveLocalBackup();
    authListeners.forEach(cb => cb(profile));

    // Save profile to Firestore
    setDoc(doc(db, "users", cred.user.uid), profile).catch(err => {
      console.warn("Failed to sync profile to Firestore:", err);
    });

    return { success: true, user: profile };
  } catch (err: any) {
    console.error("Registration error:", err);
    let message = "Registration failed. Please try again.";
    if (err.code === "auth/email-already-in-use") {
      message = "This email is already registered. Please sign in.";
    } else if (err.code === "auth/invalid-email") {
      message = "Please provide a valid email address.";
    } else if (err.code === "auth/weak-password") {
      message = "Password should be at least 6 characters.";
    } else if (err.message) {
      message = err.message;
    }
    return { success: false, error: message };
  }
};

export const loginUser = async (
  email: string, 
  password: string
): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    let profile: UserProfile;

    try {
      const userSnap = await getDoc(doc(db, "users", cred.user.uid));
      if (userSnap.exists()) {
        profile = userSnap.data() as UserProfile;
      } else {
        profile = {
          uid: cred.user.uid,
          email: cred.user.email || email,
          role: 'teacher',
          fullName: cred.user.displayName || email.split('@')[0],
          createdAt: Date.now()
        };
      }
    } catch {
      profile = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        role: 'teacher',
        fullName: cred.user.displayName || email.split('@')[0],
        createdAt: Date.now()
      };
    }

    currentUserProfile = profile;
    saveLocalBackup();
    authListeners.forEach(cb => cb(profile));

    return { success: true, user: profile };
  } catch (err: any) {
    console.error("Login error:", err);
    let message = "Sign in failed. Please check your credentials.";
    if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
      message = "Invalid email or password.";
    } else if (err.code === "auth/invalid-email") {
      message = "Invalid email format.";
    } else if (err.message) {
      message = err.message;
    }
    return { success: false, error: message };
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("SignOut error:", e);
  }
  currentUserProfile = null;
  saveLocalBackup();
  authListeners.forEach(cb => cb(null));
};

export const getCurrentUserProfile = (): UserProfile | null => {
  return currentUserProfile;
};

export const subscribeToAuth = (listener: (user: UserProfile | null) => void) => {
  authListeners.add(listener);
  listener(currentUserProfile);
  return () => {
    authListeners.delete(listener);
  };
};

// Seed default session '1234' if it doesn't exist
const seedDefaultSession = async () => {
  try {
    const sessionDocRef = doc(db, "sessions", "1234");
    const sessionSnap = await getDoc(sessionDocRef);
    if (!sessionSnap.exists()) {
      await setDoc(sessionDocRef, defaultSession);
    }
  } catch (error: any) {
    console.warn("Firestore seed error (falling back to local storage):", error.message);
  }
};
seedDefaultSession();

// Subscribe to Firestore collections in real-time
onSnapshot(collection(db, "sessions"), (snapshot) => {
  const dbSessions = snapshot.docs.map(doc => doc.data() as AttendanceSession);
  const mergedSessions = [...dbSessions];
  sessionsCache.forEach(localSec => {
    if (!mergedSessions.some(s => s.sessionId === localSec.sessionId)) {
      mergedSessions.push(localSec);
    }
  });
  sessionsCache = mergedSessions;
  if (!sessionsCache.some(s => s.sessionId === "1234")) {
    sessionsCache.push(defaultSession);
  }
  saveLocalBackup();
  listeners.forEach(l => l());
}, (error) => {
  console.warn("Sessions subscription permission denied - using offline memory/local storage mode.");
});

onSnapshot(collection(db, "records"), (snapshot) => {
  const dbRecords = snapshot.docs.map(doc => doc.data() as AttendanceRecord);
  const mergedRecords = [...dbRecords];
  recordsCache.forEach(localRec => {
    if (!mergedRecords.some(r => r.attendanceId === localRec.attendanceId)) {
      mergedRecords.push(localRec);
    }
  });
  recordsCache = mergedRecords;
  saveLocalBackup();
  listeners.forEach(l => l());
}, (error) => {
  console.warn("Records subscription permission denied - using offline memory/local storage mode.");
});

export const subscribeToStorage = (listener: () => void) => {
  listeners.add(listener);
  listener();
  return () => {
    listeners.delete(listener);
  };
};

export const getSessions = (): AttendanceSession[] => {
  return [...sessionsCache];
};

export const getSessionById = (id: string): AttendanceSession | undefined => {
  return sessionsCache.find(s => s.sessionId === id);
};

export const createSession = (session: Omit<AttendanceSession, 'sessionId' | 'createdAt' | 'status'>): AttendanceSession => {
  const sessionId = Math.floor(1000 + Math.random() * 9000).toString();
  const newSession: AttendanceSession = {
    ...session,
    sessionId,
    status: 'Active',
    createdAt: Date.now(),
    facultyUid: currentUserProfile?.uid
  };
  
  sessionsCache.unshift(newSession);
  saveLocalBackup();
  listeners.forEach(l => l());

  setDoc(doc(db, "sessions", sessionId), newSession).catch((err: any) => {
    console.warn("Firestore save session failed (saved locally):", err.message);
  });
  
  return newSession;
};

export const endSession = (sessionId: string): void => {
  sessionsCache = sessionsCache.map(s => s.sessionId === sessionId ? { ...s, status: 'Ended' as const } : s);
  saveLocalBackup();
  listeners.forEach(l => l());

  updateDoc(doc(db, "sessions", sessionId), { status: 'Ended' }).catch((err: any) => {
    console.warn("Firestore end session failed (ended locally):", err.message);
  });
};

export const getRecords = (sessionId?: string): AttendanceRecord[] => {
  if (sessionId) {
    return recordsCache
      .filter(r => r.sessionId === sessionId)
      .sort((a, b) => b.markedAt.localeCompare(a.markedAt));
  }
  return [...recordsCache];
};

export const addAttendanceRecord = (
  sessionId: string, 
  studentName: string, 
  rollNumber: string
): { success: boolean; error?: string; record?: AttendanceRecord } => {
  const session = getSessionById(sessionId);
  if (!session) {
    return { success: false, error: 'Session not found.' };
  }
  
  if (session.status !== 'Active') {
    return { success: false, error: 'This attendance session has ended.' };
  }

  const sessionAgeInMinutes = (Date.now() - session.createdAt) / (1000 * 60);
  if (sessionId !== "1234" && sessionAgeInMinutes > 10) {
    return { success: false, error: 'This attendance session has expired (10 minutes limit exceeded).' };
  }

  const exists = recordsCache.some(r => 
    r.sessionId === sessionId && 
    r.rollNumber.toLowerCase() === rollNumber.trim().toLowerCase()
  );
  
  if (exists) {
    return { success: false, error: `Attendance has already been recorded for Roll Number ${rollNumber} in this class.` };
  }

  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const attendanceId = `ATT-REC-${Math.floor(1000 + Math.random() * 9000)}`;
  const newRecord: AttendanceRecord = {
    attendanceId,
    sessionId,
    studentName: studentName.trim(),
    rollNumber: rollNumber.trim(),
    markedAt: timeString,
    status: 'Present',
    studentUid: currentUserProfile?.uid
  };

  recordsCache.unshift(newRecord);
  saveLocalBackup();
  listeners.forEach(l => l());

  const recordDocId = `${sessionId}_${rollNumber.trim().toLowerCase()}`;
  setDoc(doc(db, "records", recordDocId), newRecord).catch((err: any) => {
    console.warn("Firestore save record failed (marked locally):", err.message);
  });

  return { success: true, record: newRecord };
};

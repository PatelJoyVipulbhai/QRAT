import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  updateDoc
} from "firebase/firestore";

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
}

export interface AttendanceRecord {
  attendanceId: string;
  sessionId: string;
  studentName: string;
  rollNumber: string;
  markedAt: string; // HH:MM AM/PM
  status: 'Present';
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCAEXGMfEyn19Jq6xTW0uoj_jrq2D86DkI",
  authDomain: "hisab-14.firebaseapp.com",
  projectId: "hisab-14",
  storageBucket: "hisab-14.firebasestorage.app",
  messagingSenderId: "696479861155",
  appId: "1:696479861155:web:14bfa0ada311fde2fd7216"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const defaultSession: AttendanceSession = {
  sessionId: "1234",
  facultyName: "Dr. ABC",
  subjectName: "Financial Management",
  className: "BBA Semester 1 - Division A",
  date: new Date().toISOString().split('T')[0],
  startTime: "12:00 AM", // 24h window for prototype convenience
  endTime: "11:59 PM",
  status: "Active",
  createdAt: Date.now()
};

// Local cache database store
let sessionsCache: AttendanceSession[] = [defaultSession];
let recordsCache: AttendanceRecord[] = [];
const listeners = new Set<() => void>();

// Helper functions for localStorage backup (crucial for sharing state between browser tabs offline)
const loadLocalBackup = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
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
  // Ensure default session exists
  if (!sessionsCache.some(s => s.sessionId === "1234")) {
    sessionsCache.push(defaultSession);
  }
};

const saveLocalBackup = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('attendance_sessions', JSON.stringify(sessionsCache));
      window.localStorage.setItem('attendance_records', JSON.stringify(recordsCache));
    } catch (e) {
      console.warn("Failed to save local storage backup:", e);
    }
  }
};

// Run initial load from localStorage backup
loadLocalBackup();

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
  
  // Merge Firestore sessions into our local sessions
  const mergedSessions = [...dbSessions];
  sessionsCache.forEach(localSec => {
    if (!mergedSessions.some(s => s.sessionId === localSec.sessionId)) {
      mergedSessions.push(localSec);
    }
  });
  sessionsCache = mergedSessions;
  
  // Ensure default session 1234 is present
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
  
  // Merge Firestore records
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
  // Trigger initial run
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
    createdAt: Date.now()
  };
  
  // Update local memory cache immediately
  sessionsCache.unshift(newSession);
  saveLocalBackup();
  listeners.forEach(l => l());

  // Attempt to save to Firestore
  setDoc(doc(db, "sessions", sessionId), newSession).catch((err: any) => {
    console.warn("Firestore save session failed (saved locally):", err.message);
  });
  
  return newSession;
};

export const endSession = (sessionId: string): void => {
  // Update local memory cache immediately
  sessionsCache = sessionsCache.map(s => s.sessionId === sessionId ? { ...s, status: 'Ended' as const } : s);
  saveLocalBackup();
  listeners.forEach(l => l());

  // Attempt to save to Firestore
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

  // Validate time: Check if session has expired (active for 10 minutes from creation)
  const sessionAgeInMinutes = (Date.now() - session.createdAt) / (1000 * 60);
  if (sessionId !== "1234" && sessionAgeInMinutes > 10) {
    return { success: false, error: 'This attendance session has expired (10 minutes limit exceeded).' };
  }

  // Check duplicate in local cache
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
    status: 'Present'
  };

  // Add to local memory cache immediately
  recordsCache.unshift(newRecord);
  saveLocalBackup();
  listeners.forEach(l => l());

  // Save to Firestore using a composite document ID
  const recordDocId = `${sessionId}_${rollNumber.trim().toLowerCase()}`;
  setDoc(doc(db, "records", recordDocId), newRecord).catch((err: any) => {
    console.warn("Firestore save record failed (marked locally):", err.message);
  });

  return { success: true, record: newRecord };
};

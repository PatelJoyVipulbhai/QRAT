import React, { useEffect, useState } from "react";
import { Text, View, Image, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getSessionById, getRecords, endSession, subscribeToStorage, AttendanceRecord } from "../../utils/storage";

export default function TeacherSession() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState(id ? getSessionById(id) : undefined);
  const [records, setRecords] = useState<AttendanceRecord[]>(id ? getRecords(id) : []);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDashboardOnly, setShowDashboardOnly] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!id) return;
    
    const unsubscribe = subscribeToStorage(() => {
      setSession(getSessionById(id));
      setRecords(getRecords(id));
    });

    return unsubscribe;
  }, [id]);

  // Dynamic countdown timer (10 mins)
  useEffect(() => {
    if (!session || session.status !== "Active") return;

    const calculateTimeLeft = () => {
      // Mock session ID 1234 will have a sliding 10 min window from current load time for testing ease
      const creationTime = session.sessionId === "1234" 
        ? ((globalThis as any).__mockSessionCreatedAt || session.createdAt) 
        : session.createdAt;
      
      if (session.sessionId === "1234" && !(globalThis as any).__mockSessionCreatedAt) {
        (globalThis as any).__mockSessionCreatedAt = Date.now();
      }
      
      const difference = (creationTime + 10 * 60 * 1000) - Date.now();
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        if (session.status === "Active") {
          endSession(session.sessionId);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  if (!session) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 p-6">
        <Text className="text-lg text-slate-600 font-semibold">Session not found.</Text>
        <TouchableOpacity
          className="mt-4 bg-indigo-600 px-6 py-3 rounded-xl"
          onPress={() => router.replace("/")}
        >
          <Text className="text-white font-bold">Go to Welcome Screen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleEndAttendance = () => {
    if (Platform.OS === 'web') {
      const confirmEnd = window.confirm("End Attendance? Students will no longer be able to mark attendance using this QR code.");
      if (confirmEnd) {
        endSession(session.sessionId);
        setShowDashboardOnly(true);
      }
    } else {
      Alert.alert(
        "End Attendance?",
        "Students will no longer be able to mark attendance using this QR code.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "End Attendance",
            style: "destructive",
            onPress: () => {
              endSession(session.sessionId);
              setShowDashboardOnly(true);
            },
          },
        ]
      );
    }
  };

  // Filter students based on search query
  const filteredRecords = records.filter(
    (r) =>
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rollNumber.includes(searchQuery)
  );

  // QR Server generation URL
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(session.sessionId)}`;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 20 }}>
      {/* Session Title Header */}
      <View className="mb-6 mt-4">
        <Text className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{session.className}</Text>
        <Text className="text-3xl font-extrabold text-slate-800 mt-1">{session.subjectName}</Text>
        <Text className="text-slate-500 mt-1 font-medium">Faculty: {session.facultyName}</Text>
      </View>

      {/* Main Mode Toggle: QR screen or Live Dashboard (if not ended) */}
      {!showDashboardOnly && session.status === "Active" ? (
        <View className="space-y-6">
          {/* QR Display Card */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 items-center">
            <View className="flex-row items-center justify-between w-full mb-4">
              <Text className="text-lg font-bold text-slate-800">Attendance QR Code</Text>
              <View className={`${timeLeft > 0 ? "bg-emerald-100" : "bg-rose-100"} px-3 py-1 rounded-full`}>
                <Text className={`${timeLeft > 0 ? "text-emerald-700" : "text-rose-700"} font-semibold text-xs`}>
                  {timeLeft > 0 ? "🟢 Active" : "🔴 Expired"}
                </Text>
              </View>
            </View>

            <View className="p-4 bg-slate-50 rounded-2xl border border-slate-150 mb-4 relative">
              <Image
                source={{ uri: qrUrl }}
                className={`w-64 h-64 rounded-xl ${timeLeft <= 0 ? "opacity-10" : ""}`}
                style={{ resizeMode: "contain" }}
              />
              {timeLeft <= 0 && (
                <View className="absolute inset-0 items-center justify-center">
                  <Text className="text-rose-600 font-extrabold text-lg text-center uppercase tracking-wider bg-rose-50 px-4 py-2.5 rounded-2xl border border-rose-200 shadow-sm">
                    ⚠️ QR Code Expired
                  </Text>
                </View>
              )}
            </View>

            {timeLeft > 0 ? (
              <View className="bg-indigo-50 border border-indigo-100 px-5 py-2.5 rounded-2xl mb-4 w-full">
                <Text className="text-indigo-700 font-extrabold text-sm text-center">
                  ⏳ Session Expires In: {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            ) : (
              <View className="bg-rose-50 border border-rose-100 px-5 py-2.5 rounded-2xl mb-4 w-full">
                <Text className="text-rose-700 font-extrabold text-sm text-center">
                  Expired (10 min limit exceeded)
                </Text>
              </View>
            )}

            <Text className="text-slate-400 text-xs text-center mb-1">Session ID: {session.sessionId}</Text>
            <Text className="text-slate-600 text-sm font-semibold text-center">
              {session.date} | {session.startTime} – {session.endTime}
            </Text>
          </View>

          {/* Present Count Info Card */}
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex-row justify-between items-center">
            <View>
              <Text className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Students Present</Text>
              <Text className="text-3xl font-extrabold text-indigo-600 mt-1">{records.length} Students</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-indigo-50 px-4 py-2.5 rounded-xl"
              onPress={() => setShowDashboardOnly(true)}
            >
              <Text className="text-indigo-600 font-bold text-sm">View Live List</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-rose-500 rounded-2xl py-4 items-center justify-center shadow-sm"
              onPress={handleEndAttendance}
            >
              <Text className="text-white font-bold text-base">End Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-slate-200 rounded-2xl py-3.5 items-center justify-center"
              onPress={() => router.replace("/")}
            >
              <Text className="text-slate-700 font-semibold text-sm">Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Live Attendance List / Dashboard View
        <View className="space-y-6">
          {/* Header Dashboard Metrics */}
          <View className="flex-row space-x-4">
            <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <Text className="text-slate-400 text-xs font-bold uppercase">Total Present</Text>
              <Text className="text-2xl font-extrabold text-indigo-600 mt-1">{records.length}</Text>
            </View>
            <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <Text className="text-slate-400 text-xs font-bold uppercase">Session Status</Text>
              <Text className={`text-base font-extrabold mt-1.5 ${session.status === "Active" ? "text-emerald-600" : "text-rose-600"}`}>
                {session.status === "Active" ? "🟢 Active" : "🔴 Ended"}
              </Text>
            </View>
          </View>

          {/* Search bar */}
          <View className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
            <TextInput
              placeholder="Search by student name or roll number..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="text-slate-800 text-base"
            />
          </View>

          {/* Student list */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 min-h-[300px]">
            <Text className="text-lg font-bold text-slate-800 mb-4">Student Attendance List</Text>
            {filteredRecords.length === 0 ? (
              <View className="flex-1 justify-center items-center py-10">
                <Text className="text-slate-400 text-sm text-center">No students found matching query.</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {filteredRecords.map((record) => (
                  <View
                    key={record.attendanceId}
                    className="flex-row justify-between items-center bg-slate-50 border border-slate-150 p-4 rounded-2xl"
                  >
                    <View>
                      <Text className="font-bold text-slate-800 text-base">{record.studentName}</Text>
                      <Text className="text-slate-500 text-sm mt-0.5">Roll No: {record.rollNumber}</Text>
                      <Text className="text-slate-400 text-xs mt-1">Present at {record.markedAt}</Text>
                    </View>
                    <View className="bg-emerald-100 px-3 py-1 rounded-full">
                      <Text className="text-emerald-700 text-xs font-bold uppercase">Present</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Conditional Bottom Control */}
          <View className="space-y-3">
            {session.status === "Active" && (
              <TouchableOpacity
                activeOpacity={0.8}
                className="bg-rose-500 rounded-2xl py-4 items-center justify-center shadow-sm"
                onPress={handleEndAttendance}
              >
                <Text className="text-white font-bold text-base">End Attendance</Text>
              </TouchableOpacity>
            )}
            
            {session.status === "Active" && (
              <TouchableOpacity
                activeOpacity={0.8}
                className="bg-indigo-600 rounded-2xl py-3.5 items-center justify-center"
                onPress={() => setShowDashboardOnly(false)}
              >
                <Text className="text-white font-bold text-sm">Show QR Code</Text>
              </TouchableOpacity>
            )}

            {session.status === "Ended" && (
              <TouchableOpacity
                activeOpacity={0.8}
                className="bg-indigo-600 rounded-2xl py-4 items-center justify-center shadow-sm"
                onPress={() => router.replace("/")}
              >
                <Text className="text-white font-bold text-base">Finish & Return Home</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

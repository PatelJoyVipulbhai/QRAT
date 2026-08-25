import React, { useState } from "react";
import { Text, View, TextInput, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getSessionById, addAttendanceRecord } from "../../utils/storage";

export default function StudentDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = id ? getSessionById(id) : undefined;
  
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleMarkAttendance = () => {
    setErrorMessage(null);

    if (!studentName.trim()) {
      if (Platform.OS === 'web') {
        alert("Error: Please enter your full name.");
      } else {
        Alert.alert("Error", "Please enter your full name.");
      }
      return;
    }
    if (!rollNumber.trim()) {
      if (Platform.OS === 'web') {
        alert("Error: Please enter your roll number.");
      } else {
        Alert.alert("Error", "Please enter your roll number.");
      }
      return;
    }

    const result = addAttendanceRecord(session.sessionId, studentName, rollNumber);

    if (!result.success) {
      setErrorMessage(result.error || "Failed to mark attendance.");
      return;
    }

    const record = result.record!;
    // Redirect to success page
    router.replace(
      `/student/success?name=${encodeURIComponent(record.studentName)}&roll=${record.rollNumber}&subject=${encodeURIComponent(session.subjectName)}&time=${record.markedAt}`
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24 }}>
      {/* Session Details Header */}
      <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 mt-4">
        <Text className="text-xs font-bold text-indigo-600 uppercase tracking-widest">📚 Session Details</Text>
        <Text className="text-2xl font-extrabold text-slate-800 mt-2">{session.subjectName}</Text>
        
        <View className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          <View className="flex-row">
            <Text className="w-20 text-slate-400 font-semibold text-sm">Faculty:</Text>
            <Text className="flex-1 text-slate-700 font-bold text-sm">{session.facultyName}</Text>
          </View>
          <View className="flex-row">
            <Text className="w-20 text-slate-400 font-semibold text-sm">Class:</Text>
            <Text className="flex-1 text-slate-700 font-bold text-sm">{session.className}</Text>
          </View>
          <View className="flex-row">
            <Text className="w-20 text-slate-400 font-semibold text-sm">Time:</Text>
            <Text className="flex-1 text-slate-700 font-bold text-sm">
              {session.startTime} – {session.endTime}
            </Text>
          </View>
        </View>
      </View>

      {/* Inputs Form */}
      <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <Text className="text-lg font-bold text-slate-800">Enter Your Details</Text>

        {errorMessage && (
          <View className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex-row items-start space-x-2">
            <Text className="text-rose-500 font-bold text-lg mt-[-2]">⚠️</Text>
            <View className="flex-1">
              <Text className="text-rose-800 font-bold text-sm">Attendance Already Marked</Text>
              <Text className="text-rose-700 text-xs mt-1 leading-normal">{errorMessage}</Text>
            </View>
          </View>
        )}

        {/* Full Name */}
        <View>
          <Text className="text-sm font-semibold text-slate-700 mb-2">Full Name</Text>
          <TextInput
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 text-base"
            placeholder="Enter your full name"
            placeholderTextColor="#94a3b8"
            value={studentName}
            onChangeText={setStudentName}
          />
        </View>

        {/* Roll Number */}
        <View>
          <Text className="text-sm font-semibold text-slate-700 mb-2">Roll Number</Text>
          <TextInput
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 text-base"
            placeholder="Enter your roll number"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={rollNumber}
            onChangeText={setRollNumber}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="bg-indigo-600 rounded-2xl py-4 items-center justify-center mt-4"
          onPress={handleMarkAttendance}
        >
          <Text className="text-white font-bold text-base">Mark My Attendance</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        activeOpacity={0.8}
        className="mt-6 self-center"
        onPress={() => router.replace("/")}
      >
        <Text className="text-slate-500 text-sm font-semibold hover:text-slate-800">Cancel & Go Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

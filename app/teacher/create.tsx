import React, { useState } from "react";
import { Text, View, TextInput, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { createSession } from "../../utils/storage";

export default function CreateSession() {
  const router = useRouter();
  const [facultyName, setFacultyName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [className, setClassName] = useState("");
  
  // Format Date as: YYYY-MM-DD
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Format Time as: HH:MM AM/PM
  const [startTime, setStartTime] = useState("10:00 AM");
  const [endTime, setEndTime] = useState("11:00 AM");

  const handleGenerate = () => {
    if (!facultyName.trim() || !subjectName.trim() || !className.trim()) {
      if (Platform.OS === 'web') {
        alert("Error: Please fill in all fields.");
      } else {
        Alert.alert("Error", "Please fill in all fields.");
      }
      return;
    }

    const session = createSession({
      facultyName,
      subjectName,
      className,
      date,
      startTime,
      endTime,
    });

    // Go to QR code display screen
    router.push(`/teacher/session?id=${session.sessionId}`);
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24 }}>
      <View className="mb-8 mt-4">
        <Text className="text-3xl font-extrabold text-slate-800 tracking-tight">Create Session</Text>
        <Text className="text-slate-500 mt-2 text-base">
          Setup an attendance session and generate a unique QR code for your classroom.
        </Text>
      </View>

      <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        {/* Faculty Name */}
        <View>
          <Text className="text-sm font-semibold text-slate-700 mb-2">Faculty Name</Text>
          <TextInput
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 text-base"
            placeholder="Enter faculty name"
            placeholderTextColor="#94a3b8"
            value={facultyName}
            onChangeText={setFacultyName}
          />
        </View>

        {/* Subject Name */}
        <View>
          <Text className="text-sm font-semibold text-slate-700 mb-2">Subject Name</Text>
          <TextInput
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 text-base"
            placeholder="Financial Management"
            placeholderTextColor="#94a3b8"
            value={subjectName}
            onChangeText={setSubjectName}
          />
        </View>

        {/* Class / Division */}
        <View>
          <Text className="text-sm font-semibold text-slate-700 mb-2">Class / Division</Text>
          <TextInput
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 text-base"
            placeholder="BBA Semester 1 - Division A"
            placeholderTextColor="#94a3b8"
            value={className}
            onChangeText={setClassName}
          />
        </View>

        {/* Date */}
        <View>
          <Text className="text-sm font-semibold text-slate-700 mb-2">Date</Text>
          <TextInput
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 text-base"
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
            value={date}
            onChangeText={setDate}
          />
        </View>

        {/* Start / End Time */}
        <View className="flex-row space-x-4">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-700 mb-2">Start Time</Text>
            <TextInput
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 text-base"
              placeholder="10:00 AM"
              placeholderTextColor="#94a3b8"
              value={startTime}
              onChangeText={setStartTime}
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-700 mb-2">End Time</Text>
            <TextInput
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 text-base"
              placeholder="11:00 AM"
              placeholderTextColor="#94a3b8"
              value={endTime}
              onChangeText={setEndTime}
            />
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="bg-indigo-600 rounded-2xl py-4 items-center justify-center mt-4"
          onPress={handleGenerate}
        >
          <Text className="text-white font-bold text-base">Generate Attendance QR</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

import React from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24, justifyContent: 'center', minHeight: '100%' }}>
      {/* App Logo & Welcome Header */}
      <View className="mb-10 items-center">
        <View className="w-16 h-16 bg-indigo-600 rounded-3xl items-center justify-center mb-4 shadow-md shadow-indigo-600/30">
          <Text className="text-white text-3xl font-extrabold">QR</Text>
        </View>
        <Text className="text-4xl font-black text-slate-800 tracking-tight text-center">
          Smart Attendance
        </Text>
        <Text className="text-slate-500 mt-2 text-center text-base px-4 leading-normal">
          Mark classroom attendance instantly using a secure QR code.
        </Text>
      </View>

      {/* Selector Cards Container */}
      <View className="space-y-6">
        {/* Teacher Selection Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
          <View className="flex-row items-center space-x-3 mb-3">
            <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center">
              <Text className="text-indigo-600 text-lg font-bold">👨‍🏫</Text>
            </View>
            <Text className="text-xl font-bold text-slate-800">Teacher / Faculty</Text>
          </View>
          <Text className="text-slate-500 text-sm mb-5 leading-normal">
            Create an attendance session and generate a unique QR code for your class.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-indigo-600 rounded-2xl py-3.5 items-center justify-center shadow-sm shadow-indigo-600/20"
            onPress={() => {
              console.log("Navigating to teacher/create...");
              router.push("/teacher/create");
            }}
          >
            <Text className="text-white font-bold text-sm">Continue as Teacher</Text>
          </TouchableOpacity>
        </View>

        {/* Student Selection Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
          <View className="flex-row items-center space-x-3 mb-3">
            <View className="w-10 h-10 bg-emerald-50 rounded-xl items-center justify-center">
              <Text className="text-emerald-600 text-lg font-bold">🎓</Text>
            </View>
            <Text className="text-xl font-bold text-slate-800">Student</Text>
          </View>
          <Text className="text-slate-500 text-sm mb-5 leading-normal">
            Scan your teacher's QR code and mark your attendance instantly.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-emerald-600 rounded-2xl py-3.5 items-center justify-center shadow-sm shadow-emerald-600/20"
            onPress={() => {
              console.log("Navigating to student/scan...");
              router.push("/student/scan");
            }}
          >
            <Text className="text-white font-bold text-sm">Continue as Student</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer Branding */}
      <View className="mt-12 items-center">
        <Text className="text-slate-300 text-xs font-semibold tracking-wider uppercase">
          Classroom Attendance System
        </Text>
      </View>
    </ScrollView>
  );
}

import React from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function StudentSuccess() {
  const router = useRouter();
  const { name, roll, subject, time } = useLocalSearchParams<{
    name: string;
    roll: string;
    subject: string;
    time: string;
  }>();

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24, justifyContent: 'center', minHeight: '100%' }}>
      <View className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 items-center">
        {/* Success Icon */}
        <View className="w-20 h-20 bg-emerald-100 rounded-full items-center justify-center mb-6">
          <Text className="text-emerald-600 text-4xl font-bold">✓</Text>
        </View>

        <Text className="text-2xl font-extrabold text-slate-800 text-center tracking-tight">
          Attendance Marked Successfully!
        </Text>
        <Text className="text-slate-400 text-sm text-center mt-2 px-4 leading-normal">
          Your attendance has been successfully recorded.
        </Text>

        {/* Details Table */}
        <View className="w-full bg-slate-50 border border-slate-150 rounded-2xl p-5 mt-6 space-y-3.5">
          <View className="flex-row justify-between items-center">
            <Text className="text-slate-400 font-semibold text-sm">Name</Text>
            <Text className="text-slate-700 font-bold text-sm">{name}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-slate-400 font-semibold text-sm">Roll Number</Text>
            <Text className="text-slate-700 font-bold text-sm">{roll}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-slate-400 font-semibold text-sm">Subject</Text>
            <Text className="text-slate-700 font-bold text-sm max-w-[200px] text-right" numberOfLines={1}>
              {subject}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-slate-400 font-semibold text-sm">Marked At</Text>
            <Text className="text-slate-700 font-bold text-sm">{time}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="bg-indigo-600 w-full rounded-2xl py-4 items-center justify-center mt-8 shadow-sm"
          onPress={() => router.replace("/")}
        >
          <Text className="text-white font-bold text-base">Done</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

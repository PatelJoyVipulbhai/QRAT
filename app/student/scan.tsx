import React, { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getSessions, getSessionById } from "../../utils/storage";

export default function StudentScan() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState("");
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const activeSessions = getSessions().filter(s => s.status === 'Active');

  const handleScanSuccess = (sessionId: string) => {
    console.log("handleScanSuccess called with ID:", sessionId);
    const session = getSessionById(sessionId);
    if (!session) {
      console.log("Session not found:", sessionId);
      if (Platform.OS === 'web') {
        alert("Error: This attendance session does not exist.");
      } else {
        Alert.alert("Error", "This attendance session does not exist.");
      }
      setScanned(false);
      return;
    }
    
    if (session.status !== 'Active') {
      console.log("Session is not active:", sessionId);
      if (Platform.OS === 'web') {
        alert("Error: This attendance session has ended.");
      } else {
        Alert.alert("Error", "This attendance session has ended.");
      }
      setScanned(false);
      return;
    }

    console.log("Session is valid! Navigating to details for session:", session.sessionId);
    router.push(`/student/details?id=${session.sessionId}`);
  };

  const handleManualSubmit = () => {
    console.log("handleManualSubmit triggered. Entered code:", manualCode);
    if (!manualCode.trim()) {
      if (Platform.OS === 'web') {
        alert("Error: Please enter a valid Session ID.");
      } else {
        Alert.alert("Error", "Please enter a valid Session ID.");
      }
      return;
    }
    handleScanSuccess(manualCode.trim());
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    console.log("Barcode scanned data:", data);
    handleScanSuccess(data);
  };

  // Render camera permission UI
  const renderCameraSection = () => {
    if (!permission) {
      // Loading state
      return (
        <View className="w-full aspect-square bg-slate-950 rounded-3xl items-center justify-center mb-8">
          <Text className="text-slate-400 text-sm">Requesting camera permissions...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      // Permission denied UI
      return (
        <View className="w-full aspect-square bg-slate-950 rounded-3xl items-center justify-center p-6 mb-8 border border-rose-500/20">
          <Text className="text-white text-base font-bold text-center mb-2">Camera Access Required</Text>
          <Text className="text-slate-400 text-xs text-center mb-6">
            We need camera permissions to scan the attendance QR code.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-indigo-600 px-6 py-3 rounded-2xl"
            onPress={requestPermission}
          >
            <Text className="text-white font-bold text-sm">Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Camera view active
    return (
      <View className="w-full aspect-square bg-slate-950 rounded-3xl border border-indigo-500/30 overflow-hidden relative mb-8">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />
        {/* Transparent Overlay Viewfinder */}
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <View className="w-48 h-48 border-2 border-white rounded-2xl items-center justify-center relative bg-transparent">
            <View className="w-6 h-6 border-t-4 border-l-4 border-indigo-500 absolute top-[-4] left-[-4]" />
            <View className="w-6 h-6 border-t-4 border-r-4 border-indigo-500 absolute top-[-4] right-[-4]" />
            <View className="w-6 h-6 border-b-4 border-l-4 border-indigo-500 absolute bottom-[-4] left-[-4]" />
            <View className="w-6 h-6 border-b-4 border-r-4 border-indigo-500 absolute bottom-[-4] right-[-4]" />
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-900" contentContainerStyle={{ padding: 24, justifyContent: 'center', minHeight: '100%' }}>
      <View className="mb-8 mt-4 items-center">
        <Text className="text-3xl font-extrabold text-white tracking-tight">Scan Attendance QR</Text>
        <Text className="text-slate-400 mt-2 text-center text-sm px-4">
          Scan the QR code displayed by your faculty or select from active sessions below.
        </Text>
      </View>

      {/* Camera Finder */}
      {renderCameraSection()}

      {/* Manual Input or Simulator */}
      <View className="bg-slate-800 rounded-3xl p-6 border border-slate-700 space-y-6">
        <View>
          <Text className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Enter Session Code Manually</Text>
          <View className="flex-row space-x-3">
            <TextInput
              className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white text-base font-semibold"
              placeholder="e.g. 1234"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              value={manualCode}
              onChangeText={setManualCode}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-indigo-600 px-5 rounded-2xl justify-center items-center"
              onPress={handleManualSubmit}
            >
              <Text className="text-white font-bold text-sm">Submit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Prototype Simulator Assistant */}
        <View className="border-t border-slate-700/50 pt-4">
          <Text className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">
            Prototype Session Picker (Quick Test)
          </Text>
          {activeSessions.length === 0 ? (
            <Text className="text-slate-500 text-xs italic">No active sessions. Please create a session as a Teacher first.</Text>
          ) : (
            <View className="space-y-2">
              {activeSessions.map(s => (
                <TouchableOpacity
                  key={s.sessionId}
                  activeOpacity={0.8}
                  className="bg-slate-900/60 hover:bg-slate-900 border border-indigo-500/20 p-3 rounded-xl flex-row justify-between items-center"
                  onPress={() => handleScanSuccess(s.sessionId)}
                >
                  <View>
                    <Text className="text-white text-xs font-bold">{s.subjectName}</Text>
                    <Text className="text-slate-400 text-[10px] mt-0.5">{s.className} | {s.facultyName}</Text>
                  </View>
                  <View className="bg-indigo-500/10 px-2.5 py-1 rounded-full">
                    <Text className="text-indigo-400 text-[10px] font-bold">Simulate Scan</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        className="mt-6 self-center"
        onPress={() => router.replace("/")}
      >
        <Text className="text-slate-400 text-sm font-semibold hover:text-white">Cancel & Go Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

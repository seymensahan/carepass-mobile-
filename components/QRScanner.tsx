/**
 * QR Code Scanner component for scanning patient QR codes.
 * Extracts the CaryPass ID or emergency token from the scanned URL.
 *
 * QR format: https://carypass.cm/emergency/{carypassId}
 * or just: CP-YYYY-NNNNN
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Feather } from "@expo/vector-icons";

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: { carypassId?: string; token?: string; raw: string }) => void;
  title?: string;
}

function parseQRData(raw: string): { carypassId?: string; token?: string } {
  // URL format: https://carypass.cm/emergency/{token}
  const urlMatch = raw.match(/carypass\.cm\/emergency\/(.+)/i);
  if (urlMatch) {
    const token = urlMatch[1];
    // Token could be the carypassId itself (CP-YYYY-NNNNN)
    if (token.match(/^CP-\d{4}-\d{5}$/)) {
      return { carypassId: token, token };
    }
    return { token };
  }

  // Direct CaryPass ID format: CP-YYYY-NNNNN
  const idMatch = raw.match(/CP-\d{4}-\d{5}/);
  if (idMatch) {
    return { carypassId: idMatch[0] };
  }

  return {};
}

export default function QRScanner({
  visible,
  onClose,
  onScan,
  title = "Scanner le QR du patient",
}: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
    if (visible) {
      setScanned(false);
    }
  }, [visible]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const parsed = parseQRData(data);
    onScan({ ...parsed, raw: data });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Camera */}
        {!permission?.granted ? (
          <View style={styles.permissionContainer}>
            <Feather name="camera-off" size={48} color="#6c757d" />
            <Text style={styles.permissionText}>
              Autorisez l&apos;accès à la caméra pour scanner les QR codes
            </Text>
            <Pressable onPress={requestPermission} style={styles.permissionBtn}>
              <Text style={styles.permissionBtnText}>Autoriser la caméra</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            {/* Overlay with scan area */}
            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                {/* Corner markers */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.instruction}>
                Placez le QR code du patient dans le cadre
              </Text>
            </View>

            {/* Scanned indicator */}
            {scanned && (
              <View style={styles.scannedOverlay}>
                <ActivityIndicator size="large" color="#28a745" />
                <Text style={styles.scannedText}>QR code detecté...</Text>
              </View>
            )}
          </View>
        )}

        {/* Scan again button */}
        {scanned && (
          <View style={styles.footer}>
            <Pressable
              onPress={() => setScanned(false)}
              style={styles.rescanBtn}
            >
              <Feather name="refresh-cw" size={18} color="#fff" />
              <Text style={styles.rescanText}>Scanner à nouveau</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const TEAL = "#006B5A";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanArea: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: TEAL,
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  instruction: {
    marginTop: 24,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  scannedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  scannedText: {
    color: "#28a745",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  permissionText: {
    color: "#adb5bd",
    fontSize: 15,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: TEAL,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permissionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  rescanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: TEAL,
    paddingVertical: 14,
    borderRadius: 24,
  },
  rescanText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

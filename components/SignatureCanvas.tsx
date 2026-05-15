import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  PanResponder,
  Dimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";

interface SignatureCanvasProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (dataUrl: string) => void | Promise<void>;
  submitting?: boolean;
}

/**
 * Modal that lets a user draw a signature in-app with their finger.
 * Built on react-native-svg + PanResponder so we don't need a webview
 * or extra native dependency. The drawn paths are exported as a PNG
 * data URL (image/png, base64) via the Svg ref's toDataURL method.
 */
export default function SignatureCanvas({
  visible,
  onClose,
  onSubmit,
  submitting,
}: SignatureCanvasProps) {
  const svgRef = useRef<any>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const currentPath = useRef<string>("");

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        // Force a re-render via state update — we keep the in-progress
        // path in a ref so we don't rebuild the array on every move.
        setPaths((prev) => {
          if (prev.length === 0 || !prev[prev.length - 1].startsWith("__live__")) {
            return [...prev, `__live__${currentPath.current}`];
          }
          const next = [...prev];
          next[next.length - 1] = `__live__${currentPath.current}`;
          return next;
        });
      },
      onPanResponderRelease: () => {
        if (!currentPath.current) return;
        const finished = currentPath.current;
        currentPath.current = "";
        setPaths((prev) => {
          const stable = prev.filter((p) => !p.startsWith("__live__"));
          return [...stable, finished];
        });
      },
    }),
  ).current;

  const clear = () => {
    setPaths([]);
    currentPath.current = "";
  };

  const isEmpty = paths.length === 0;

  const save = async () => {
    if (!svgRef.current || isEmpty) return;
    // react-native-svg's toDataURL returns base64 (without the data URL prefix).
    svgRef.current.toDataURL((base64: string) => {
      const dataUrl = `data:image/png;base64,${base64}`;
      Promise.resolve(onSubmit(dataUrl))
        .then(() => clear())
        .catch(() => {});
    });
  };

  const screenWidth = Dimensions.get("window").width;
  const canvasWidth = Math.min(screenWidth - 48, 600);
  const canvasHeight = 220;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Signez ici</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#6c757d" />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Dessinez votre signature avec votre doigt dans la zone ci-dessous.
          </Text>

          <View
            style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}
            {...panResponder.panHandlers}
          >
            <Svg
              ref={svgRef}
              width={canvasWidth}
              height={canvasHeight}
              style={StyleSheet.absoluteFill}
            >
              {paths.map((d, i) => (
                <Path
                  key={i}
                  d={d.startsWith("__live__") ? d.replace("__live__", "") : d}
                  stroke="#212529"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
            </Svg>
            {isEmpty && (
              <View style={styles.placeholder} pointerEvents="none">
                <Text style={styles.placeholderText}>
                  Dessinez votre signature ici
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={clear}
              disabled={isEmpty || submitting}
              style={[
                styles.btn,
                styles.btnSecondary,
                (isEmpty || submitting) && styles.btnDisabled,
              ]}
            >
              <Feather name="rotate-ccw" size={14} color="#6c757d" />
              <Text style={styles.btnSecondaryText}>Effacer</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={isEmpty || submitting}
              style={[
                styles.btn,
                styles.btnPrimary,
                (isEmpty || submitting) && styles.btnDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="check" size={14} color="#fff" />
              )}
              <Text style={styles.btnPrimaryText}>Enregistrer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { fontSize: 17, fontWeight: "700", color: "#212529" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: { fontSize: 13, color: "#6c757d", marginBottom: 16 },
  canvas: {
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#dee2e6",
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 16,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { fontSize: 13, color: "#adb5bd" },
  actions: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    backgroundColor: "#fff",
  },
  btnSecondaryText: { color: "#6c757d", fontWeight: "600", fontSize: 14 },
  btnPrimary: { backgroundColor: "#28a745" },
  btnPrimaryText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
});

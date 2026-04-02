import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useOffline } from "../hooks/useOffline";

export default function OfflineBanner() {
  const { isOnline, pendingCount } = useOffline();

  if (isOnline) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Feather name="wifi-off" size={16} color="#7c4700" />
        <Text style={styles.text}>Vous etes hors ligne</Text>
      </View>
      {pendingCount > 0 && (
        <Text style={styles.subtext}>
          {pendingCount} action{pendingCount > 1 ? "s" : ""} en attente de
          synchronisation
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff3cd",
    borderBottomWidth: 1,
    borderBottomColor: "#ffc107",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    color: "#7c4700",
    fontSize: 14,
    fontWeight: "600",
  },
  subtext: {
    color: "#7c4700",
    fontSize: 12,
    marginTop: 2,
    marginLeft: 24,
  },
});

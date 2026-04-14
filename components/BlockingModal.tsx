import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface BlockingModalProps {
  visible: boolean;
  type: "suspended" | "subscription_expired";
  reason?: string | null;
  onResubscribe?: () => void;
}

export default function BlockingModal({ visible, type, reason, onResubscribe }: BlockingModalProps) {
  if (!visible) return null;

  const isSuspended = type === "suspended";

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: isSuspended ? "#dc354515" : "#ffc10715" }]}>
            <Feather
              name={isSuspended ? "shield-off" : "credit-card"}
              size={32}
              color={isSuspended ? "#dc3545" : "#ffc107"}
            />
          </View>

          <Text style={styles.title}>
            {isSuspended ? "Institution suspendue" : "Abonnement expiré"}
          </Text>

          <Text style={styles.description}>
            {isSuspended
              ? "Votre institution a été suspendue par l'administration. Vous ne pouvez pas effectuer d'actions sur la plateforme."
              : "Votre abonnement a expiré. Veuillez renouveler votre abonnement pour continuer à utiliser la plateforme."}
          </Text>

          {isSuspended && reason ? (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Raison :</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ) : null}

          {isSuspended ? (
            <Text style={styles.supportText}>
              Contactez le support à support@carypass.cm pour plus d'informations.
            </Text>
          ) : (
            <Pressable style={styles.button} onPress={onResubscribe}>
              <Feather name="credit-card" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Renouveler mon abonnement</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  reasonBox: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffc10740",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    width: "100%",
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 13,
    color: "#856404",
  },
  supportText: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#006B5A",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

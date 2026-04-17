import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Share } from "react-native";

import * as walletService from "../../services/wallet.service";
import * as referralService from "../../services/referral.service";
import type { WalletTransaction } from "../../services/wallet.service";

function formatBalance(amount: number): string {
  return amount.toLocaleString("fr-FR").replace(/,/g, " ");
}

const TRANSACTION_CONFIG: Record<
  string,
  { icon: keyof typeof Feather.glyphMap; color: string; prefix: string }
> = {
  referral_earning: { icon: "user-plus", color: "#28a745", prefix: "+" },
  subscription_debit: { icon: "credit-card", color: "#dc3545", prefix: "-" },
  withdrawal: { icon: "arrow-down-circle", color: "#ff8c00", prefix: "-" },
};

export default function WalletScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ─── State ───
  const [page, setPage] = useState(1);
  const [allTransactions, setAllTransactions] = useState<WalletTransaction[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");

  // ─── Queries ───
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: walletService.getWallet,
  });

  const { data: referralCode, refetch: refetchReferral } = useQuery({
    queryKey: ["referral-code"],
    queryFn: async () => {
      const existing = await referralService.getMyCode();
      if (existing) return existing;
      // Auto-generate if none exists
      return referralService.generateCode();
    },
  });

  const {
    data: txResponse,
    isLoading: txLoading,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ["wallet-transactions", page],
    queryFn: () => walletService.getTransactions(page),
    placeholderData: (prev) => prev,
  });

  // Merge pages
  React.useEffect(() => {
    if (txResponse?.data) {
      if (page === 1) {
        setAllTransactions(txResponse.data);
      } else {
        setAllTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newItems = txResponse.data.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [txResponse, page]);

  const hasMore =
    txResponse?.meta?.total != null &&
    allTransactions.length < txResponse.meta.total;

  // ─── Withdrawal ───
  const withdrawMutation = useMutation({
    mutationFn: () =>
      walletService.requestWithdrawal(
        Number(withdrawAmount),
        withdrawPhone.replace(/[^0-9]/g, "")
      ),
    onSuccess: (result) => {
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setWithdrawPhone("");
      if (result.success) {
        Alert.alert("Retrait initie", "Votre demande de retrait a ete envoyee.");
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      } else {
        Alert.alert("Erreur", result.message || "Echec du retrait");
      }
    },
  });

  // ─── Actions ───
  const handleCopyCode = async () => {
    if (referralCode?.code) {
      await Clipboard.setStringAsync(referralCode.code);
      Alert.alert("Copie !", "Code de parrainage copie dans le presse-papiers.");
    }
  };

  const handleShareCode = async () => {
    if (referralCode?.code) {
      try {
        await Share.share({
          message: `Rejoignez CaryPass avec mon code de parrainage : ${referralCode.code}\nInscrivez-vous sur CaryPass pour acceder a votre dossier medical numerique.`,
        });
      } catch {
        // User cancelled
      }
    }
  };

  const onRefresh = useCallback(() => {
    setPage(1);
    refetchWallet();
    refetchReferral();
    refetchTx();
  }, [refetchWallet, refetchReferral, refetchTx]);

  const handleWithdraw = () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount < 10000) {
      Alert.alert("Erreur", "Le montant minimum de retrait est de 10 000 FCFA.");
      return;
    }
    if (!withdrawPhone || withdrawPhone.replace(/[^0-9]/g, "").length < 9) {
      Alert.alert("Erreur", "Veuillez entrer un numero de telephone valide.");
      return;
    }
    if (wallet && amount > wallet.balance) {
      Alert.alert("Erreur", "Solde insuffisant.");
      return;
    }
    withdrawMutation.mutate();
  };

  // ─── Render transaction item ───
  const renderTransaction = ({ item }: { item: WalletTransaction }) => {
    const config = TRANSACTION_CONFIG[item.type] || {
      icon: "activity" as const,
      color: "#6c757d",
      prefix: "",
    };
    const date = new Date(item.createdAt);
    const dateStr = date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return (
      <View className="flex-row items-center px-5 py-4 border-b border-border/40">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: config.color + "15" }}
        >
          <Feather name={config.icon} size={18} color={config.color} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {item.description}
          </Text>
          <Text className="text-xs text-muted mt-0.5">{dateStr}</Text>
        </View>
        <Text
          className="text-sm font-bold"
          style={{ color: config.color }}
        >
          {config.prefix}{formatBalance(Math.abs(item.amount))} F
        </Text>
      </View>
    );
  };

  // ─── Header content ───
  const renderHeader = () => (
    <>
      {/* Back + Title */}
      <View className="flex-row items-center px-6 pt-4 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-border items-center justify-center mr-3"
        >
          <Feather name="arrow-left" size={20} color="#212529" />
        </Pressable>
        <Text className="text-xl font-bold text-foreground">Portefeuille</Text>
      </View>

      {/* Balance Card */}
      <View className="mx-6 mt-4 bg-primary rounded-3xl p-6">
        <Text className="text-white/60 text-sm mb-1">Solde disponible</Text>
        {walletLoading ? (
          <ActivityIndicator color="#fff" className="my-2" />
        ) : (
          <Text className="text-white text-3xl font-bold">
            {formatBalance(wallet?.balance ?? 0)} FCFA
          </Text>
        )}
        <Pressable
          onPress={() => setShowWithdrawModal(true)}
          className="mt-4 bg-white/20 rounded-2xl py-3 items-center"
        >
          <Text className="text-white font-bold text-sm">Retirer</Text>
        </Pressable>
      </View>

      {/* Referral Code Card */}
      <View className="mx-6 mt-4 bg-white rounded-3xl p-5 border border-border">
        <Text className="text-base font-bold text-foreground mb-3">
          Code de parrainage
        </Text>

        {referralCode?.code ? (
          <>
            {/* Code display */}
            <View className="bg-primary/5 rounded-2xl p-4 items-center mb-3">
              <Text className="text-primary text-xl font-bold tracking-wider">
                {referralCode.code}
              </Text>
            </View>

            {/* Copy & Share */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={handleCopyCode}
                className="flex-1 flex-row items-center justify-center gap-2 bg-primary/10 rounded-xl py-3"
              >
                <Feather name="copy" size={16} color="#007bff" />
                <Text className="text-primary font-semibold text-sm">Copier</Text>
              </Pressable>
              <Pressable
                onPress={handleShareCode}
                className="flex-1 flex-row items-center justify-center gap-2 bg-secondary/10 rounded-xl py-3"
              >
                <Feather name="share-2" size={16} color="#28a745" />
                <Text className="text-secondary font-semibold text-sm">Partager</Text>
              </Pressable>
            </View>

            {/* Stats */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-background rounded-xl p-3 items-center">
                <Text className="text-xl font-bold text-foreground">
                  {referralCode.totalReferrals}
                </Text>
                <Text className="text-xs text-muted mt-0.5">Filleuls</Text>
              </View>
              <View className="flex-1 bg-background rounded-xl p-3 items-center">
                <Text className="text-xl font-bold text-secondary">
                  {formatBalance(referralCode.totalEarnings)} F
                </Text>
                <Text className="text-xs text-muted mt-0.5">Gains</Text>
              </View>
            </View>
          </>
        ) : (
          <View className="items-center py-4">
            <ActivityIndicator color="#007bff" />
            <Text className="text-xs text-muted mt-2">
              Chargement du code...
            </Text>
          </View>
        )}
      </View>

      {/* Transaction History Header */}
      <View className="px-6 mt-6 mb-2">
        <Text className="text-base font-bold text-foreground">
          Historique des transactions
        </Text>
      </View>

      {txLoading && page === 1 && (
        <View className="items-center py-8">
          <ActivityIndicator color="#007bff" />
        </View>
      )}

      {!txLoading && allTransactions.length === 0 && (
        <View className="items-center py-8 px-6">
          <Feather name="inbox" size={40} color="#dee2e6" />
          <Text className="text-sm text-muted mt-3">Aucune transaction</Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={allTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
        onEndReached={() => {
          if (hasMore && !txLoading) {
            setPage((p) => p + 1);
          }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          txLoading && page > 1 ? (
            <View className="py-4 items-center">
              <ActivityIndicator color="#007bff" />
            </View>
          ) : null
        }
      />

      {/* ─── Withdrawal Modal ─── */}
      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-lg font-bold text-foreground">
                Retirer des fonds
              </Text>
              <Pressable onPress={() => setShowWithdrawModal(false)}>
                <Feather name="x" size={24} color="#6c757d" />
              </Pressable>
            </View>

            {/* Amount */}
            <Text className="text-sm font-medium text-foreground mb-1.5">
              Montant (FCFA)
            </Text>
            <TextInput
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="Ex: 15 000"
              keyboardType="numeric"
              className="h-12 px-4 rounded-xl border border-border bg-background text-base text-foreground mb-4"
              placeholderTextColor="#adb5bd"
            />

            {/* Phone */}
            <Text className="text-sm font-medium text-foreground mb-1.5">
              Numero Mobile Money
            </Text>
            <TextInput
              value={withdrawPhone}
              onChangeText={setWithdrawPhone}
              placeholder="6XX XXX XXX"
              keyboardType="phone-pad"
              className="h-12 px-4 rounded-xl border border-border bg-background text-base text-foreground mb-3"
              placeholderTextColor="#adb5bd"
            />

            {/* Warning */}
            <View className="bg-yellow-50 rounded-xl p-3 mb-6">
              <Text className="text-xs text-yellow-700">
                Solde minimum de 10 000 FCFA requis pour un retrait.
              </Text>
            </View>

            {/* Confirm */}
            <Pressable
              onPress={handleWithdraw}
              disabled={withdrawMutation.isPending}
              className={`rounded-2xl py-4 items-center ${
                withdrawMutation.isPending ? "bg-primary/50" : "bg-primary"
              }`}
            >
              <Text className="text-white font-bold text-base">
                {withdrawMutation.isPending
                  ? "Traitement..."
                  : "Confirmer le retrait"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

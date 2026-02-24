import React, { Component, type ErrorInfo } from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-background items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-danger/10 items-center justify-center mb-6">
            <Feather name="alert-triangle" size={36} color="#dc3545" />
          </View>
          <Text className="text-xl font-bold text-foreground text-center mb-2">
            Oups, une erreur est survenue
          </Text>
          <Text className="text-sm text-muted text-center leading-5 mb-6">
            L'application a rencontré un problème inattendu. Veuillez réessayer.
          </Text>
          {__DEV__ && this.state.error && (
            <View className="bg-danger/5 border border-danger/20 rounded-xl p-4 mb-6 w-full">
              <Text className="text-xs text-danger font-mono" numberOfLines={5}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <Pressable
            onPress={this.handleRetry}
            className="bg-primary h-14 rounded-xl items-center justify-center flex-row px-8 active:opacity-90"
            accessibilityRole="button"
            accessibilityLabel="Réessayer"
          >
            <Feather name="refresh-cw" size={18} color="#fff" />
            <Text className="text-base font-semibold text-white ml-2">
              Réessayer
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

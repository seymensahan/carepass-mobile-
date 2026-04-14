import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Socket URL — derived from EXPO_PUBLIC_API_URL (without the /api suffix)
const PROD_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  "https://carypass-backend.zylo-platform.cloud/api"
).replace(/\/api\/?$/, "");

function getDevSocketUrl(): string {
  if (process.env.EXPO_PUBLIC_DEV_API_URL) {
    return process.env.EXPO_PUBLIC_DEV_API_URL.replace(/\/api\/?$/, "");
  }
  const debuggerHost =
    Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(":")[0];
    return `http://${ip}:8000`;
  }
  return Platform.OS === "android"
    ? "http://10.0.2.2:8000"
    : "http://localhost:8000";
}

const SOCKET_URL = __DEV__ ? getDevSocketUrl() : PROD_URL;
const TOKEN_KEY = "carypass_access_token";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socket: Socket | null = null;

    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) return;

      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on("connect", () => setIsConnected(true));
      socket.on("disconnect", () => setIsConnected(false));
    })();

    return () => {
      socket?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  return useContext(SocketContext);
}

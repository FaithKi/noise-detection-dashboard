import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5050";

export type DeviceRealtimeStatus = {
  device: string;
  p: number;       // duty cycle 0..1
  count: number;   // number of samples
  online: boolean; // true only if last data point is within threshold (e.g. 60s)
  lastSeen: string | null; // ISO timestamp of last data point
};

export type RealtimePayload = {
  period: string;
  devices: DeviceRealtimeStatus[];
  timestamp: string;
};

export function useRealtimeDevices(period: string) {
  const [devices, setDevices] = useState<DeviceRealtimeStatus[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("subscribe", { period });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("device-status", (payload: RealtimePayload) => {
      setDevices(payload.devices);
      setLastUpdate(payload.timestamp);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // connect once

  // When period changes, tell the server
  const changePeriod = useCallback((newPeriod: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("change-period", { period: newPeriod });
    }
  }, []);

  useEffect(() => {
    changePeriod(period);
  }, [period, changePeriod]);

  return { devices, connected, lastUpdate };
}

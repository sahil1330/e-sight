import React, { createContext, useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketProviderProps {
  children: React.ReactNode;
}

interface ISocketContext {
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  socket: Socket | undefined;
}

export const useSocket = () => {
  const state = React.useContext(SocketContext);
  if (!state) {
    throw new Error(
      "State is undefined, make sure to wrap your component in <SocketProvider>"
    );
  }
  return state;
};

const SocketContext = createContext<ISocketContext | null>(null);

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | undefined>(undefined);

  const joinRoom = useCallback(
    (roomId: string) => {
      if (socket) {
        socket.emit("joinRoom", roomId);
        // console.log(`Joined room: ${roomId}`);
      } else {
        // console.error("Socket is not initialized");
      }
    },
    [socket]
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      if (socket) {
        socket.emit("leaveRoom", roomId);
        // console.log(`Left room: ${roomId}`);
      } else {
        // console.error("Socket is not initialized");
      }
    },
    [socket]
  );

  useEffect(() => {
    const _socket = io(process.env.EXPO_PUBLIC_REST_API_BASE_URL!, {
      transports: ["websocket"],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    setSocket(_socket);
    _socket.on("connect", () => {
      // console.log("Socket connected:", _socket.id);
    });

    return () => {
      if (_socket) {
        _socket.disconnect();
        // console.log("Socket disconnected");
      }
      setSocket(undefined);
    };
  }, []);
  return (
    <SocketContext.Provider
      value={{ socket, joinRoom, leaveRoom }}
    >
      {children}
    </SocketContext.Provider>
  );
};

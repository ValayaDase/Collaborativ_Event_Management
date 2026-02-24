import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io("http://localhost:5000");      // made connection to server
    setSocket(s);                              // set socket state now we can use socket in out components and pages

    return () => {
      s.disconnect();
    };
  }, []);

  return socket;
}
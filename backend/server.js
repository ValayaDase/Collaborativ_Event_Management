import express from "express";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/event.js";
import chatRoutes from "./routes/chat.js";
import { initSocket } from "./socket.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/event", eventRoutes);
app.use("/chat", chatRoutes);

const server = http.createServer(app);
initSocket(server);

server.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});
